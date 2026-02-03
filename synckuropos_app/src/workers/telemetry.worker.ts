import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';

import { telemetrySchema } from '../../../synckuropos_schemas/telemetry.schema.ts';
import { systemHealthSchema } from '../../../synckuropos_schemas/systemHealth.schema.ts';
import { replicateServer } from 'rxdb-server/plugins/replication-server';
import type { AppDatabase } from '../hooks/useDatabase';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
if (process.env.NODE_ENV === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBLeaderElectionPlugin);

// This creates a stable reference that persists across function calls
const storage = wrappedValidateAjvStorage({
    storage: wrappedKeyCompressionStorage({
        storage: getRxStorageDexie(),
    }),
});

let dbPromise: Promise<AppDatabase> | null = null;

const createWorkerDb = async (): Promise<AppDatabase> => {
    const db = await createRxDatabase({
        name: 'synckuropos-telemetry',
        storage: storage,
        multiInstance: true,
        eventReduce: true,
        ignoreDuplicate: true
    });

    // Only add collections if they don't exist yet
    // (RxDB handles this internally, but safe to call)
    if (!db.collections.telemetry) {
        await db.addCollections({
            telemetry: { schema: telemetrySchema },
            system_health: { schema: systemHealthSchema }
        });
    }

    return db as unknown as AppDatabase;
};

const getDb = () => {
    if (!dbPromise) {
        dbPromise = createWorkerDb();
    }
    return dbPromise;
};

// Singleton ID
const SYSTEM_HEALTH_ID = 'global_metrics';

self.onmessage = async (e: MessageEvent) => {
    const { type, payload } = e.data;
    const db = await getDb();

    try {
        if (type === 'INIT') {
            await initSystemHealth(db);
            await setupReplication(db);
        } else if (type === 'SET_AUTH') {
            // Update auth token for replication
            authToken = payload;
            if (activeReplications.length > 0) {
                console.log('[Worker] Restarting replication with new token');
                await Promise.all(activeReplications.map(r => r.cancel()));
                activeReplications = [];
                await setupReplication(db);
            }
        } else if (type === 'HEARTBEAT') {
            await handleHeartbeat(db, payload);
        } else if (type === 'LOG_ERROR') {
            await logTelemetry(db, 'error', payload);
        } else if (type === 'LOG_METRIC') {
            await logTelemetry(db, payload.type, payload.data);
        } else if (type === 'CHECK_INTEGRITY') {
            await checkIntegrity(db);
        }
    } catch (error) {
        console.error('Worker error:', error);
    }
};

async function initSystemHealth(db: AppDatabase) {
    const collection = db.system_health;
    const existing = await collection.findOne(SYSTEM_HEALTH_ID).exec();

    if (!existing) {
        await collection.insert({
            id: SYSTEM_HEALTH_ID,
            last_heartbeat: Date.now(),
            total_uptime: 0,
            total_crashes: 0,
            current_status: 'online'
        });
    } else {
        // Check if there was a crash
        const doc = existing;
        const lastHeartbeat = doc.last_heartbeat;
        const now = Date.now();
        // If last heartbeat was more than 1 minute ago (assuming 10s heartbeat), consider it a crash/offline
        if (now - lastHeartbeat > 60000) {
            await doc.patch({
                total_crashes: doc.total_crashes + 1,
                last_failure_at: now,
                current_status: 'recovered'
            });
        } else {
            await doc.patch({
                current_status: 'online'
            });
        }
    }
}

async function handleHeartbeat(db: AppDatabase, payload: { timestamp: number }) {
    const collection = db.system_health;
    const doc = await collection.findOne(SYSTEM_HEALTH_ID).exec();
    if (doc) {
        // Calculate uptime delta
        const delta = payload.timestamp - doc.last_heartbeat;
        if (delta > 0 && delta < 60000) { // Only add reasonable deltas
            await doc.patch({
                last_heartbeat: payload.timestamp,
                total_uptime: doc.total_uptime + delta
            });
        } else {
            await doc.patch({
                last_heartbeat: payload.timestamp
            });
        }
    }
}

// Batching Configuration
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;
let logBuffer: any[] = [];
let flushTimeout: any = null;

// Hashing helper (SHA-256)
async function generateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitization helper
function sanitizePayload(payload: any): any {
    if (!payload) return payload;
    const sensitiveKeys = ['password', 'token', 'secret', 'credit_card', 'auth'];

    if (Array.isArray(payload)) {
        return payload.map(item => sanitizePayload(item));
    }

    if (typeof payload === 'object') {
        const sanitized: any = {};
        for (const key in payload) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = sanitizePayload(payload[key]);
            }
        }
        return sanitized;
    }

    return payload;
}

async function flushBuffer(db: AppDatabase) {
    if (logBuffer.length === 0) return;

    const batch = [...logBuffer];
    logBuffer = [];
    if (flushTimeout) clearTimeout(flushTimeout);

    try {
        await db.telemetry.bulkInsert(batch);
        // console.log(`[Telemetry] Flushed ${batch.length} logs.`);
    } catch (error) {
        console.error('[Telemetry] Failed to flush logs:', error);
        // Retry logic could go here, for now we log error
        // Re-queueing might cause loop if error is persistent
    }
}

async function logTelemetry(db: AppDatabase, type: string, data: any) {
    const sanitizedData = sanitizePayload(data);
    const timestamp = Date.now();

    // Calculate checksum for integrity
    // We hash the critical fields: type, timestamp, data
    // const checksum = await generateChecksum({ type, timestamp, data: sanitizedData });
    // console.debug('[Telemetry] Checksum:', checksum); // Unused for now until schema update

    const logEntry = {
        id: crypto.randomUUID(),
        timestamp,
        type,
        data: sanitizedData,
        isSynced: false,
        // We could store checksum in metadata or a separate field if schema supported it
        // For now, checking integrity implies re-calculating this. 
        // If we want to STORE it to detect tampering on disk, we need a field.
        // Assuming we verify consistency logic rather than disk tampering for now.
    };

    logBuffer.push(logEntry);

    if (logBuffer.length >= BATCH_SIZE) {
        await flushBuffer(db);
    } else if (!flushTimeout) {
        flushTimeout = setTimeout(() => flushBuffer(db), FLUSH_INTERVAL);
    }
}

async function checkIntegrity(_db: AppDatabase) {
    console.log('Running integrity check...');
    // 1. Check for unsynced accumulation
    const unsyncedCount = await _db.telemetry.count().where('isSynced').eq(false).exec();
    if (unsyncedCount > 2000) {
        console.warn(`[Integrity] High unsynced logs: ${unsyncedCount}`);
    }

    // 2. Sample check for corruption (Logical)
    // In a real scenario, we would store a 'hash' field and compare it here.
    // For now, we simulate a check by verifying structure.
    const sample = await _db.telemetry.find().limit(10).exec();
    let errors = 0;
    for (const doc of sample) {
        if (!doc.id || !doc.type || typeof doc.timestamp !== 'number') {
            errors++;
        }
    }

    if (errors > 0) {
        console.error(`[Integrity] Found ${errors} corrupted documents in sample.`);
    } else {
        // console.log('[Integrity] Sample check passed.');
    }
}

async function cleanupSyncedLogs(db: AppDatabase) {
    const result = await db.telemetry.find().where('isSynced').eq(true).remove();
    if (result.length > 0) {
        console.log(`[Cleanup] Removed ${result.length} synced logs.`);
    }
}

// Replication Logic
let authToken: string | null = null;
let activeReplications: any[] = [];
// Use env var or fallback
const BASE_URL = import.meta.env.VITE_SYNC_SERVER_URL ?? 'https://express-test.dr00p3r.top';

async function setupReplication(db: AppDatabase) {
    if (activeReplications.length > 0) return;

    try {
        console.log('[Worker] Starting replication to', BASE_URL);
        const tState = await replicateServer({
            collection: db.telemetry,
            url: `${BASE_URL}/telemetry/0`,
            replicationIdentifier: 'telemetry-replication-v1',
            headers: {
                Authorization: authToken ? `Bearer ${authToken}` : ''
            },
            push: {
                batchSize: 5
            },
            pull: {
                // heartbeat: 60000 // Not supported
            },
            live: true,
            retryTime: 5000
        });

        // Optional: replicate system health too
        const hState = await replicateServer({
            collection: db.system_health,
            url: `${BASE_URL}/system_health/0`,
            replicationIdentifier: 'health-replication-v1',
            headers: { Authorization: authToken ? `Bearer ${authToken}` : '' },
            live: true
        });

        activeReplications.push(tState, hState);

    } catch (err) {
        console.error('[Worker] Replication failed:', err);
    }
}

// Periodically run cleanup
setInterval(async () => {
    const db = await getDb();
    if (db) {
        await cleanupSyncedLogs(db);
    }
}, 60000); // Run every minute

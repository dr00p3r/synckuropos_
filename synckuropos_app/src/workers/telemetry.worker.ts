import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

import { telemetrySchema } from '../../../synckuropos_schemas/telemetry.schema.ts';
import { systemHealthSchema } from '../../../synckuropos_schemas/systemHealth.schema.ts';
import { replicateServer } from 'rxdb-server/plugins/replication-server';
import type { AppDatabase } from '../hooks/useDatabase';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
if (process.env.NODE_ENV === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

// This creates a stable reference that persists across function calls
const storage = wrappedValidateAjvStorage({
    storage: wrappedKeyCompressionStorage({
        storage: getRxStorageDexie(),
    }),
});

let dbPromise: Promise<AppDatabase> | null = null;

const createWorkerDb = async (): Promise<AppDatabase> => {
    const db = await createRxDatabase({
        name: 'synckuropos-telemetry-2',
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
            authToken = payload;
            if (activeReplications.length > 0) {
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

    // Retry logic with exponential backoff
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            // Get fresh document each retry
            const doc = await collection.findOne(SYSTEM_HEALTH_ID).exec();
            if (doc) {
                const delta = payload.timestamp - doc.last_heartbeat;
                if (delta > 0 && delta < 60000) {
                    await doc.patch({
                        last_heartbeat: payload.timestamp,
                        total_uptime: doc.total_uptime + delta
                    });
                } else {
                    await doc.patch({
                        last_heartbeat: payload.timestamp
                    });
                }
                return; // Success!
            }
        } catch (error: any) {
            if (error.code === 'CONFLICT' && retries < maxRetries - 1) {
                retries++;
                // Exponential backoff: 50ms, 100ms, 200ms
                await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, retries)));
                continue;
            }
            // If not a conflict or max retries reached, throw
            throw error;
        }
    }
}
// Batching Configuration
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;
let logBuffer: any[] = [];
let flushTimeout: any = null;

// Hashing helper (SHA-256)


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
    if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }

    try {
        console.log('[Telemetry] Flushing batch:', batch);
        await db.telemetry.bulkInsert(batch);
    } catch (error) {
        console.error('[Telemetry] Failed to flush logs:', error);
    }
}

async function logTelemetry(db: AppDatabase, type: string, data: any) {
    const sanitizedData = sanitizePayload(data);
    const timestamp = Date.now();

    const logEntry = {
        id: crypto.randomUUID(),
        timestamp,
        type,
        data: sanitizedData,
        isSynced: false,
    };

    logBuffer.push(logEntry);

    if (logBuffer.length >= BATCH_SIZE) {
        await flushBuffer(db);
    } else if (!flushTimeout) {
        flushTimeout = setTimeout(() => flushBuffer(db), FLUSH_INTERVAL);
    }
}

async function checkIntegrity(_db: AppDatabase) {
    // 1. Check for unsynced accumulation
    const unsyncedCount = await _db.telemetry.count().where('isSynced').eq(false).exec();
    if (unsyncedCount > 2000) {
        console.warn(`[Integrity] High unsynced logs: ${unsyncedCount}`);
    }

    const sample = await _db.telemetry.find().limit(10).exec();
    let errors = 0;
    for (const doc of sample) {
        if (!doc.id || !doc.type || typeof doc.timestamp !== 'number') {
            errors++;
        }
    }

    if (errors > 0) {
        console.error(`[Integrity] Found ${errors} corrupted documents in sample.`);
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
                batchSize: 5
            },
            live: true,
            retryTime: 5000
        });

        const hState = await replicateServer({
            collection: db.system_health,
            url: `${BASE_URL}/system_health/0`,
            replicationIdentifier: 'health-replication-v1',
            push: {
                batchSize: 5
            },
            pull: {
                batchSize: 5
            },
            live: true,
            retryTime: 5000
        });

        activeReplications.push(tState, hState);

        tState.error$.subscribe((err: any) => {
            console.error('[Worker] Telemetry Replication Error:', err);
        });

        hState.error$.subscribe((err: any) => {
            console.error('[Worker] Health Replication Error:', err);
        });


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
}, 60000);

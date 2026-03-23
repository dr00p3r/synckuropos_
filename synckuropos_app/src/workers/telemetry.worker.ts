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
        name: 'synckuropos-telemetry-30',
        storage: storage,
        multiInstance: true,
        eventReduce: true,
    });

    // Only add collections if they don't exist yet
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
const FLUSH_INTERVAL = 2000;
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
        await db.telemetry.bulkInsert(batch);
    } catch (error) {
        console.error('[Telemetry] Failed to flush logs, re-queuing:', error);
        // Re-encolar el batch fallido al frente del buffer para no perder datos
        logBuffer = [...batch, ...logBuffer];
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
    try {
        const totalCount = await db.telemetry.count().exec();
        if (totalCount > 5000) {
            console.warn(`[Telemetry] Local DB tiene ${totalCount} logs. Verificar estado de replicación.`);
            // Solo limpiar logs muy antiguos (>30 días) si la BD crece demasiado
            if (totalCount > 10000) {
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                const oldDocs = await db.telemetry.find({
                    selector: { timestamp: { $lt: thirtyDaysAgo } },
                    limit: 500
                }).exec();
                if (oldDocs.length > 0) {
                    await Promise.all(oldDocs.map(doc => doc.remove()));
                    console.warn(`[Cleanup] Eliminados ${oldDocs.length} logs antiguos (>30 días). Total era: ${totalCount}`);
                }
            }
        }
    } catch (e) {
        console.error('[Cleanup] Error durante limpieza:', e);
    }
}

// Replication Logic
let authToken: string | null = null;
let activeReplications: any[] = [];
// Use env var or fallback
const BASE_URL = import.meta.env.VITE_SYNC_SERVER_URL ?? 'https://express-test.dr00p3r.top';

let replicationRetryCount = 0;
const MAX_REPLICATION_RETRIES = 5;

async function setupReplication(db: AppDatabase) {
    if (activeReplications.length > 0) return;

    // Flush pending logs antes de iniciar replicación
    await flushBuffer(db);

    try {
        const tState = await replicateServer({
            collection: db.telemetry,
            url: `${BASE_URL}/telemetry/0`,
            replicationIdentifier: 'telemetry-replication-v1',
            headers: {
                Authorization: authToken ? `Bearer ${authToken}` : ''
            },
            push: {
                batchSize: 10
            },
            pull: {
                batchSize: 10
            },
            live: true,
            retryTime: 3000
        });

        const hState = await replicateServer({
            collection: db.system_health,
            url: `${BASE_URL}/system_health/0`,
            replicationIdentifier: 'health-replication-v1',
            push: {
                batchSize: 10
            },
            pull: {
                batchSize: 10
            },
            live: true,
            retryTime: 3000
        });

        activeReplications.push(tState, hState);
        replicationRetryCount = 0;

        // Monitor errores de replicación con auto-restart
        let consecutiveErrors = 0;
        tState.error$.subscribe((err: any) => {
            consecutiveErrors++;
            console.error(`[Worker] Telemetry Replication Error (${consecutiveErrors}):`, err.message || err);
            if (consecutiveErrors >= 10) {
                console.warn('[Worker] Demasiados errores consecutivos, reiniciando replicación...');
                consecutiveErrors = 0;
                restartReplication(db);
            }
        });

        // Resetear contador cuando la sync completa un ciclo exitoso
        tState.active$.subscribe((active) => {
            if (!active && consecutiveErrors > 0) {
                consecutiveErrors = 0;
            }
        });

        hState.error$.subscribe((err: any) => {
            console.error('[Worker] Health Replication Error:', err.message || err);
        });

        console.log('[Worker] Replicación iniciada correctamente');

    } catch (err) {
        console.error('[Worker] Replication setup failed:', err);
        replicationRetryCount++;
        if (replicationRetryCount <= MAX_REPLICATION_RETRIES) {
            const delay = Math.min(5000 * Math.pow(2, replicationRetryCount - 1), 30000);
            console.log(`[Worker] Reintentando replicación en ${delay}ms (intento ${replicationRetryCount}/${MAX_REPLICATION_RETRIES})`);
            setTimeout(() => setupReplication(db), delay);
        } else {
            console.error('[Worker] Máximo de reintentos alcanzado. Replicación no iniciada.');
        }
    }
}

async function restartReplication(db: AppDatabase) {
    try {
        await Promise.all(activeReplications.map(r => r.cancel()));
    } catch (e) {
        console.error('[Worker] Error cancelando replicaciones:', e);
    }
    activeReplications = [];
    replicationRetryCount = 0;
    await setupReplication(db);
}

// Health check periódico: flush buffer, verificar replicación, monitorear logs
setInterval(async () => {
    const db = await getDb();
    if (db) {
        // Siempre hacer flush del buffer para asegurar persistencia local
        await flushBuffer(db);

        // Si no hay replicaciones activas, reintentar
        if (activeReplications.length === 0) {
            console.warn('[Worker] Sin replicaciones activas, reintentando...');
            replicationRetryCount = 0;
            await setupReplication(db);
        }

        // Monitorear cantidad de logs locales
        await cleanupSyncedLogs(db);
    }
}, 120000); // Cada 2 minutos

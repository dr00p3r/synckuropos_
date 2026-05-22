import { eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from './client';
import { SYNC_TABLES, type SyncTableName } from './syncTables';

const SYNC_STATE_KEY = 'sync_engine_state_v1';
const SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL;

export interface SyncState {
    lastSyncAt: number;
    lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
    consecutiveFailures: number;
    nextRetryAt: number;
}

const DEFAULT_STATE: SyncState = {
    lastSyncAt: 0,
    lastSyncStatus: 'idle',
    consecutiveFailures: 0,
    nextRetryAt: 0,
};

function loadState(): SyncState {
    try {
        const raw = localStorage.getItem(SYNC_STATE_KEY);
        return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

function saveState(state: SyncState) {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

export class SyncEngine {
    private db: AppDatabase;
    private state: SyncState;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private running = false;

    private readonly config = {
        intervalWithChanges: 30_000,
        intervalIdle: 180_000,
        maxBackoff: 600_000,
        healthTimeout: 5_000,
    };

    constructor(db: AppDatabase) {
        this.db = db;
        this.state = loadState();
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.sync(true);
    }

    stop() {
        this.running = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    getStatus(): SyncState {
        return { ...this.state };
    }

    async forceSync() {
        await this.sync(false);
    }

    private async sync(isStartup = false) {
        if (!this.running) return;

        this.state.lastSyncStatus = 'syncing';
        saveState(this.state);

        const online = await this.pingServer();
        if (!online) {
            this.state.consecutiveFailures++;
            this.state.lastSyncStatus = 'error';
            saveState(this.state);
            this.scheduleNext();
            return;
        }

        try {
            await this.pullChanges();

            if (!isStartup) {
                await this.pushChanges();
            }

            this.state.consecutiveFailures = 0;
            this.state.lastSyncAt = Date.now();
            this.state.lastSyncStatus = 'success';
            saveState(this.state);
        } catch (err) {
            console.error('[SyncEngine] Sync failed:', err);
            this.state.consecutiveFailures++;
            this.state.lastSyncStatus = 'error';
            saveState(this.state);
        }

        this.scheduleNext();
    }

    private scheduleNext() {
        if (!this.running) return;

        // Query async para determinar si hay cambios pendientes
        this.checkPendingChanges().then(hasPending => {
            if (!this.running) return;

            let interval = hasPending
                ? this.config.intervalWithChanges
                : this.config.intervalIdle;

            if (this.state.consecutiveFailures > 0) {
                const backoff = interval * Math.pow(2, this.state.consecutiveFailures);
                interval = Math.min(backoff, this.config.maxBackoff);
            }

            this.state.nextRetryAt = Date.now() + interval;
            saveState(this.state);

            this.timer = setTimeout(() => this.sync(false), interval);
        });
    }

    private async pingServer(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), this.config.healthTimeout);
            const res = await fetch(`${SERVER_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(id);
            return res.ok;
        } catch {
            return false;
        }
    }

    private async pullChanges() {
        const since = this.state.lastSyncAt;
        const tableNames = SYNC_TABLES.map(t => t.name).join(',');

        const url = `${SERVER_URL}/api/sync/pull?since=${since}&tables=${tableNames}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Pull failed: ${res.status}`);

        const data: Record<SyncTableName, any[]> = await res.json();

        await Promise.all(
            SYNC_TABLES.map(async ({ name, table }) => {
                const rows = data[name];
                if (!Array.isArray(rows) || rows.length === 0) return;

                const pkName = Object.keys(table)[0];
                const pkValues: any[] = [];
                for (const r of rows) {
                    const v = r[pkName];
                    if (v !== undefined) pkValues.push(v);
                }

                const existingMap = new Map<string, number>();

                if (pkValues.length > 0) {
                    const existing = await this.db
                        .select()
                        .from(table as any)
                        .where(inArray((table as any)[pkName], pkValues));
                    for (const row of existing) {
                        existingMap.set(row[pkName], (row as any).updatedAt ?? 0);
                    }
                }

                await Promise.all(
                    rows.map(async (row: any) => {
                        const pkValue = row[pkName];
                        if (pkValue === undefined) return;

                        if (existingMap.has(pkValue)) {
                            const localUpdated = existingMap.get(pkValue)!;
                            const remoteUpdated = row.updatedAt ?? 0;
                            if (remoteUpdated >= localUpdated) {
                                await this.db
                                    .update(table as any)
                                    .set(row)
                                    .where(eq((table as any)[pkName], pkValue));
                            }
                        } else {
                            await this.db.insert(table as any).values(row);
                        }
                    })
                );
            })
        );
    }

    private async pushChanges() {
        const payload: Record<string, any[]> = {};

        const pendingRows = await Promise.all(
            SYNC_TABLES.map(async ({ name, table }) => {
                const rows = await this.db
                    .select()
                    .from(table as any)
                    .where(eq((table as any).synced, 0));
                return { name, rows };
            })
        );

        for (const { name, rows } of pendingRows) {
            if (rows.length > 0) {
                payload[name] = rows;
            }
        }

        const hasData = Object.keys(payload).length > 0;
        if (!hasData) return;

        const res = await fetch(`${SERVER_URL}/api/sync/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Push failed: ${res.status}`);

        const { success } = await res.json();
        if (success) {
            await Promise.all(
                SYNC_TABLES.map(async ({ name, table }) => {
                    const rows = payload[name];
                    if (!rows || rows.length === 0) return;

                    const pkName = Object.keys(table)[0];
                    const pkValues: any[] = [];
                    for (const r of rows) {
                        const v = r[pkName];
                        if (v !== undefined) pkValues.push(v);
                    }
                    if (pkValues.length === 0) return;

                    await this.db
                        .update(table as any)
                        .set({ synced: 1 })
                        .where(inArray((table as any)[pkName], pkValues));
                })
            );
        }
    }

    private async checkPendingChanges(): Promise<boolean> {
        const checks = SYNC_TABLES.map(async ({ table }) => {
            const rows = await this.db
                .select()
                .from(table as any)
                .where(eq((table as any).synced, 0))
                .limit(1);
            return rows.length > 0;
        });

        const results = await Promise.all(checks);
        return results.some(Boolean);
    }
}

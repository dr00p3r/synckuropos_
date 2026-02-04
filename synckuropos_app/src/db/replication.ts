// src/replication.ts
import { replicateServer, RxServerReplicationState } from 'rxdb-server/plugins/replication-server';
import type { AppDatabase } from '@/hooks';
import type {
    Product,
    User,
    Customer,
    Supplying,
    ComboProduct,
    Debt,
    DebtPayment,
    Sale,
    SaleDetail
} from '../types/types';

import { TelemetryEvents } from '../types/telemetryEvents';

export interface Replications {
    products?: RxServerReplicationState<Product>;
    users?: RxServerReplicationState<User>;
    customers?: RxServerReplicationState<Customer>;
    supplyings?: RxServerReplicationState<Supplying>;
    comboProducts?: RxServerReplicationState<ComboProduct>;
    debts?: RxServerReplicationState<Debt>;
    debtPayments?: RxServerReplicationState<DebtPayment>;
    sales?: RxServerReplicationState<Sale>;
    saleDetails?: RxServerReplicationState<SaleDetail>;
}

let activeReplications: Replications | null = null;
let activeDb: AppDatabase | null = null;
let activeToken: string | null = null;
let networkListenerAdded = false;

const logEvent = (type: string, data: any) => {
    if (window.__TELEMETRY_WORKER__) {
        window.__TELEMETRY_WORKER__.postMessage({
            type: 'LOG_METRIC',
            payload: { type, data }
        });
    }
};

const monitorNetwork = () => {
    if (networkListenerAdded) return;

    window.addEventListener('online', () => {
        logEvent(TelemetryEvents.NETWORK_STATUS_CHANGE, { status: 'online', timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
        logEvent(TelemetryEvents.NETWORK_STATUS_CHANGE, { status: 'offline', timestamp: Date.now() });
    });

    networkListenerAdded = true;
};


const BASE_URL = import.meta.env.VITE_SYNC_SERVER_URL ?? 'https://express-test.dr00p3r.top';

export async function startReplications(db: AppDatabase): Promise<Replications> {
    if (activeReplications) {
        return activeReplications;
    }
    activeDb = db;

    // Helper to create replication for a collection
    const startRep = async <T>(name: string, collection: any): Promise<RxServerReplicationState<T>> => {
        const rep = await replicateServer<T>({
            collection: collection,
            replicationIdentifier: `${name}-replication-v0`,
            url: `${BASE_URL}/${name}/0`,
            push: {
                batchSize: 5
            },
            pull: {
                batchSize: 5
            },
            live: true,
            retryTime: 5000,
        });

        // Monitor Sync Performance
        let startTime = 0;
        rep.active$.subscribe(active => {
            if (active) {
                startTime = performance.now();
            } else {
                if (startTime > 0) {
                    const durationMs = performance.now() - startTime;
                    // Only log significant syncs (e.g. > 30ms) to avoid noise
                    if (durationMs > 30) {
                        logEvent(TelemetryEvents.SYNC_PERFORMANCE, {
                            durationMs,
                            collection: name
                            // docsProcessed: ? Hard to get exact count from just active$. 
                            // received$.subscribe() could count docs.
                        });
                    }
                    startTime = 0;
                }
            }
        });

        // Monitor docs processed (optional, for completeness)
        rep.received$.subscribe(() => {
            // We could accumulate counts here if needed for SYNC_PERFORMANCE payload
        });

        return rep;
    };

    monitorNetwork();

    activeReplications = {
        products: await startRep<Product>('products', db.collections.products),
        users: await startRep<User>('users', db.collections.users),
        customers: await startRep<Customer>('customers', db.collections.customers),
        supplyings: await startRep<Supplying>('supplyings', db.collections.supplyings),
        comboProducts: await startRep<ComboProduct>('comboProducts', db.collections.comboProducts),
        debts: await startRep<Debt>('debts', db.collections.debts),
        debtPayments: await startRep<DebtPayment>('debtPayments', db.collections.debtPayments),
        sales: await startRep<Sale>('sales', db.collections.sales),
        saleDetails: await startRep<SaleDetail>('saleDetails', db.collections.saleDetails),
    };

    console.log('[Replication] Started for all collections');
    return activeReplications;
}

export async function stopReplications() {
    if (!activeReplications) return;

    // Iterate and cancel
    await Promise.all(Object.values(activeReplications).map((rep: any) => rep.cancel()));
    activeReplications = null;
}

export async function setReplicationAuth(token: string | null) {
    if (activeToken === token) return;
    activeToken = token;

    if (activeReplications && activeDb) {
        await stopReplications();
        await startReplications(activeDb);
    }
}

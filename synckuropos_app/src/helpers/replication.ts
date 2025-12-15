import { replicateServer, RxServerReplicationState } from 'rxdb-server/plugins/replication-server';
import type { AppDatabase } from '../hooks/useDatabase';
import type { Product, User } from '../types/types';

export type Replications = {
    products?: RxServerReplicationState<Product>;
    users?: RxServerReplicationState<User>;
};

// FIX: Usar 'any' para evitar errores de compilación TS en modo test
// En producción (Vite), import.meta.env estará definido.
// En test (Jest), usamos el fallback.
const getBaseUrl = () => {
    try {
        // @ts-ignore
        return import.meta.env.VITE_SYNC_SERVER_URL ?? 'https://express-test.dr00p3r.top';
    } catch (e) {
        return 'https://express-test.dr00p3r.top';
    }
};

const BASE_URL = getBaseUrl();

export async function startReplications(db: AppDatabase): Promise<Replications> {
    const reps: Replications = {};

    // === Products ===
    reps.products = await replicateServer<Product>({
        collection: db.collections.products,
        replicationIdentifier: 'products-replication-v0',
        url: `${BASE_URL}/products/0`,
        headers: {
            withCredentials: "false",
        },
        push: {},
        pull: {},
        live: true,
        retryTime: 5000,
    });

    // Listeners
    reps.products.error$?.subscribe(err => console.error('[products:replication:error]', err));
    reps.products.outdatedClient$?.subscribe(() => {
        console.warn('[products:replication] outdated client — revisa versión del endpoint');
    });
    reps.products.unauthorized$?.subscribe(() => {
        console.warn('[products:replication] unauthorized — refresca token y setHeaders()');
    });

    // === Users ===
    reps.users = await replicateServer<User>({
        collection: db.collections.users,
        replicationIdentifier: 'users-replication-v0',
        url: `${BASE_URL}/users/0`,
        headers: {
            withCredentials: "false",
        },
        push: {},
        pull: {},
        live: true,
        retryTime: 5000,
    });

    // Listeners
    reps.users.error$?.subscribe(err => console.error('[users:replication:error]', err));
    reps.users.outdatedClient$?.subscribe(() => {
        console.warn('[users:replication] outdated client — revisa versión del endpoint');
    });
    reps.users.unauthorized$?.subscribe(() => {
        console.warn('[users:replication] unauthorized — refresca token y setHeaders()');
    });

    return reps;
}

export function stopReplications(reps?: Replications) {
    reps?.products?.cancel();
    reps?.users?.cancel();
}
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// Schemas
import { productSchema } from '../../../synckuropos_schemas/product.schema.ts';
import { customerSchema } from '../../../synckuropos_schemas/customer.schema.ts';
import { supplyingSchema } from '../../../synckuropos_schemas/supplying.schema.ts';
import { comboProductSchema } from '../../../synckuropos_schemas/comboProduct.schema.ts';
import { debtSchema } from '../../../synckuropos_schemas/debt.schema.ts';
import { debtPaymentSchema } from '../../../synckuropos_schemas/debtPayment.schema.ts';
import { saleSchema } from '../../../synckuropos_schemas/sale.schema.ts';
import { saleDetailSchema } from '../../../synckuropos_schemas/saleDetail.schema.ts';
import { userSchema } from '../../../synckuropos_schemas/user.schema.ts';
import { telemetrySchema } from '../../../synckuropos_schemas/telemetry.schema.ts';
import { systemHealthSchema } from '../../../synckuropos_schemas/systemHealth.schema.ts';

import type { AppDatabase } from '@/hooks';

// Register Plugins
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBDevModePlugin);

/**
 * 1. DEFINE STORAGE GLOBALLY
 * This ensures the object reference stays the same across re-renders/HMR.
 */
const storage = wrappedValidateAjvStorage({
    storage: wrappedKeyCompressionStorage({
        storage: getRxStorageDexie(),
    }),
});

let dbPromise: Promise<AppDatabase> | null = null;

const createDb = async (): Promise<AppDatabase> => {
    const db = await createRxDatabase({
        name: 'synckuroposdb-3',
        storage: storage,     // Use the stable reference
        multiInstance: false, // Main thread usually locks the DB
        eventReduce: true,
        ignoreDuplicate: true // Essential for HMR/Dev mode to avoid DB9 errors
    });

    /**
     * 2. CHECK IF COLLECTIONS EXIST
     * If ignoreDuplicate returned an existing DB, collections might already be there.
     */
    if (!db.collections.products) {
        await db.addCollections({
            products: { schema: productSchema },
            customers: { schema: customerSchema },
            supplyings: { schema: supplyingSchema },
            comboProducts: { schema: comboProductSchema },
            debts: { schema: debtSchema },
            debtPayments: { schema: debtPaymentSchema },
            sales: { schema: saleSchema },
            saleDetails: { schema: saleDetailSchema },
            users: { schema: userSchema },
            telemetry: { schema: telemetrySchema },
            system_health: { schema: systemHealthSchema }
        });
    }

    return db as unknown as AppDatabase;
}

export const getDb = () => {
    if (!dbPromise) {
        dbPromise = createDb();
    }
    return dbPromise;
};
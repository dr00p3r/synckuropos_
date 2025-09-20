import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { productSchema } from '../../../synckuropos_schemas/product.schema.ts';
import { customerSchema } from '../../../synckuropos_schemas/customer.schema.ts';
import { supplyingSchema } from '../../../synckuropos_schemas/supplying.schema.ts';
import { comboProductSchema } from '../../../synckuropos_schemas/comboProduct.schema.ts';
import { debtSchema } from '../../../synckuropos_schemas/debt.schema.ts';
import { debtPaymentSchema } from '../../../synckuropos_schemas/debtPayment.schema.ts';
import { saleSchema } from '../../../synckuropos_schemas/sale.schema.ts';
import { saleDetailSchema } from '../../../synckuropos_schemas/saleDetail.schema.ts';
import { userSchema } from '../../../synckuropos_schemas/user.schema.ts';

import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

import type { AppDatabase } from '../hooks/useDatabase.tsx';

// Registrar el plugin de Query Builder
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBDevModePlugin);

let dbPromise: Promise<AppDatabase> | null = null;

const createDb = async (): Promise<AppDatabase> => {
    const db = await createRxDatabase({
        name: 'synckuroposdb-22',
        storage: wrappedValidateAjvStorage({ // <-- Envolvemos aquí
            storage: wrappedKeyCompressionStorage({
                storage: getRxStorageDexie(),
            }),
        }),
        multiInstance: false,
        eventReduce: true
    });
    await db.addCollections({
        products: { schema: productSchema },
        customers: { schema: customerSchema },
        supplyings: { schema: supplyingSchema },
        comboProducts: { schema: comboProductSchema },
        debts: { schema: debtSchema },
        debtPayments: { schema: debtPaymentSchema },
        sales: { schema: saleSchema },
        saleDetails: { schema: saleDetailSchema },
        users: { schema: userSchema }
    });
    return db as unknown as AppDatabase;
}

export const getDb = () => {
    if (!dbPromise) {
        dbPromise = createDb();
    }
    return dbPromise;
};
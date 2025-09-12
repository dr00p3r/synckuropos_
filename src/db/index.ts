import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { productSchema } from './schemas/product.schema';
import { customerSchema } from './schemas/customer.schema';
import { supplyingSchema } from './schemas/supplying.schema';
import { comboProductSchema } from './schemas/comboProduct.schema';
import { debtSchema } from './schemas/debt.schema';
import { debtPaymentSchema } from './schemas/debtPayment.schema';
import { saleSchema } from './schemas/sale.schema';
import { saleDetailSchema } from './schemas/saleDetail.schema';
import { userSchema } from './schemas/user.schema';
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'; 

import type { AppDatabase } from '../hooks/useDatabase.tsx';

// Registrar el plugin de Query Builder
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

let dbPromise: Promise<AppDatabase> | null = null;

const createDb = async (): Promise<AppDatabase> => {
    const db = await createRxDatabase({
        name: 'synckuroposdb-1',
        storage: wrappedKeyCompressionStorage({ // <-- Envolvemos aquí
            storage: getRxStorageDexie(),
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
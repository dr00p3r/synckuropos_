// server-database.ts
import { addRxPlugin, createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { productSchema } from '../synckuropos_schemas/product.schema';
import { customerSchema } from '../synckuropos_schemas/customer.schema';
import { supplyingSchema } from '../synckuropos_schemas/supplying.schema';
import { comboProductSchema } from '../synckuropos_schemas/comboProduct.schema';
import { debtSchema } from '../synckuropos_schemas/debt.schema';
import { debtPaymentSchema } from '../synckuropos_schemas/debtPayment.schema';
import { saleSchema } from '../synckuropos_schemas/sale.schema';
import { saleDetailSchema } from '../synckuropos_schemas/saleDetail.schema';
import { userSchema } from '../synckuropos_schemas/user.schema';

import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

export const createServerDatabase = async (): Promise<RxDatabase> => {
  const db = await createRxDatabase({
    name: 'synckuroposdb-server',
    storage: wrappedValidateAjvStorage({
      storage: wrappedKeyCompressionStorage({
        storage: getRxStorageDexie(),
      }),
    }),
    multiInstance: false,
    eventReduce: true,
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
    users: { schema: userSchema },
  });

  return db;
};

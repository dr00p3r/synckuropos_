import { addRxPlugin, createRxDatabase } from 'rxdb';
import type { RxDatabase } from 'rxdb';

import { getRxStorageMongoDB } from 'rxdb/plugins/storage-mongodb';

import { productSchema } from '../synckuropos_schemas/product.schema.ts';
import { customerSchema } from '../synckuropos_schemas/customer.schema.ts';
import { supplyingSchema } from '../synckuropos_schemas/supplying.schema.ts';
import { comboProductSchema } from '../synckuropos_schemas/comboProduct.schema.ts';
import { debtSchema } from '../synckuropos_schemas/debt.schema.ts';
import { debtPaymentSchema } from '../synckuropos_schemas/debtPayment.schema.ts';
import { saleSchema } from '../synckuropos_schemas/sale.schema.ts';
import { saleDetailSchema } from '../synckuropos_schemas/saleDetail.schema.ts';
import { userSchema } from '../synckuropos_schemas/user.schema.ts';
import { telemetrySchema } from '../synckuropos_schemas/telemetry.schema.ts';
import { systemHealthSchema } from '../synckuropos_schemas/systemHealth.schema.ts';

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
        storage: getRxStorageMongoDB({
          /**
           * MongoDB connection string
           * @link https://www.mongodb.com/docs/manual/reference/connection-string/
           */
          connection: process.env.MONGODB_CONNECTION!
        }),
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
    telemetry: { schema: telemetrySchema },
    system_health: { schema: systemHealthSchema },
  });

  // Telemetry: Mark incoming logs as synced so the client can delete them
  db.collections.telemetry.postInsert(async function (this: any, _docData: any, doc: any) {
    if (doc.isSynced === false) {
      await doc.atomicPatch({ isSynced: true });
    }
  }, false);

  return db;
};

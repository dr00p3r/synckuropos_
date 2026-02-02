// server.ts
import 'dotenv/config';
import { createRxServer } from 'rxdb-server/plugins/server';
import { RxServerAdapterExpress } from 'rxdb-server/plugins/adapter-express';
import { createServerDatabase } from './db.ts';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

const run = async () => {
  const myRxDatabase = await createServerDatabase();

  const app = express();

  // Custom Middleware Setup
  app.use(cors({
    origin: CORS_ORIGIN
  }));

  // Middleware for Authentication
  app.use(async (req: any, res: any, next: any) => {
    const protectedPaths = [
      '/telemetry',
      '/system_health',
      '/products',
      '/users',
      '/customers',
      '/supplyings',
      '/comboProducts',
      '/debts',
      '/debtPayments',
      '/sales',
      '/saleDetails'
    ];
    const isProtected = protectedPaths.some(path => req.path.includes(path));

    if (isProtected) {
      if (req.method === 'OPTIONS') return next();

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[Auth] Unauthorized access attempt to ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
      }
    }
    next();
  });

  const server = await createRxServer({
    database: myRxDatabase,
    adapter: RxServerAdapterExpress,
    serverApp: app,
    port: Number(PORT)
  });

  const productsCollection = myRxDatabase.collections.products;
  if (!productsCollection) {
    throw new Error('Products collection not found in database');
  }

  const productsEndpoint = server.addReplicationEndpoint({
    name: 'products',
    collection: productsCollection,
  });

  const usersCollection = myRxDatabase.collections.users;
  if (!usersCollection) {
    throw new Error('Users collection not found in database');
  }

  const usersEndpoint = server.addReplicationEndpoint({
    name: 'users',
    collection: usersCollection,
  });

  const telemetryCollection = myRxDatabase.collections.telemetry;
  const telemetryEndpoint = server.addReplicationEndpoint({
    name: 'telemetry',
    collection: telemetryCollection
  });

  const systemHealthCollection = myRxDatabase.collections.system_health;
  const systemHealthEndpoint = server.addReplicationEndpoint({
    name: 'system_health',
    collection: systemHealthCollection
  });

  const customersCollection = myRxDatabase.collections.customers;
  const customersEndpoint = server.addReplicationEndpoint({
    name: 'customers',
    collection: customersCollection
  });

  const supplyingsCollection = myRxDatabase.collections.supplyings;
  const supplyingsEndpoint = server.addReplicationEndpoint({
    name: 'supplyings',
    collection: supplyingsCollection
  });

  const comboProductsCollection = myRxDatabase.collections.comboProducts;
  const comboProductsEndpoint = server.addReplicationEndpoint({
    name: 'comboProducts',
    collection: comboProductsCollection
  });

  const debtsCollection = myRxDatabase.collections.debts;
  const debtsEndpoint = server.addReplicationEndpoint({
    name: 'debts',
    collection: debtsCollection
  });

  const debtPaymentsCollection = myRxDatabase.collections.debtPayments;
  const debtPaymentsEndpoint = server.addReplicationEndpoint({
    name: 'debtPayments',
    collection: debtPaymentsCollection
  });

  const salesCollection = myRxDatabase.collections.sales;
  const salesEndpoint = server.addReplicationEndpoint({
    name: 'sales',
    collection: salesCollection
  });

  const saleDetailsCollection = myRxDatabase.collections.saleDetails;
  const saleDetailsEndpoint = server.addReplicationEndpoint({
    name: 'saleDetails',
    collection: saleDetailsCollection
  });

  console.log(productsEndpoint.urlPath);
  console.log(usersEndpoint.urlPath);
  console.log(telemetryEndpoint.urlPath);
  console.log(systemHealthEndpoint.urlPath);
  console.log(customersEndpoint.urlPath);
  console.log(supplyingsEndpoint.urlPath);
  console.log(comboProductsEndpoint.urlPath);
  console.log(debtsEndpoint.urlPath);
  console.log(debtPaymentsEndpoint.urlPath);
  console.log(salesEndpoint.urlPath);
  console.log(saleDetailsEndpoint.urlPath);

  await server.start();
  console.log(`🚀 RxServer running on http://localhost:${PORT}`);
};

run().catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});

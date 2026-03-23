// server.ts
import 'dotenv/config';
import { createRxServer } from 'rxdb-server/plugins/server';
import { RxServerAdapterExpress } from 'rxdb-server/plugins/adapter-express';
import { createServerDatabase } from './db.js';
import express from 'express';
import cors from 'cors';
import { getSonarMetrics } from './services/sonarService.js';
import { runLighthouseAudit, measureMemoryUsage } from './scripts/auditRunner.js';

const PORT = process.env.PORT;

const run = async () => {
  const myRxDatabase = await createServerDatabase();

  const app = express();

  // 1. CORS must come first
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Create RxDB server with the configured app
  const server = await createRxServer({
    database: myRxDatabase,
    adapter: RxServerAdapterExpress,
    serverApp: app,
    cors: allowedOrigin,
    port: Number(PORT)
  });

  // Endpoints Custom
  app.get('/api/telemetry', async (req, res) => {
    try {
      const telemetryCollection = myRxDatabase.collections.telemetry;
      if (!telemetryCollection) {
        return res.status(500).json({ error: 'Telemetry collection not found' });
      }
      const logs = await telemetryCollection.find().exec();
      // Return raw documents
      const result = logs.map(doc => doc.toJSON());
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });



  let isAuditRunning = false;
  let isMemoryMeasuring = false;

  app.post('/api/run-audit', async (req, res) => {
    if (isAuditRunning) {
      return res.status(429).json({ error: "Audit already in progress" });
    }
    isAuditRunning = true;
    try {
      console.log("Triggering Lighthouse Audit...");
      const metrics = await runLighthouseAudit();
      res.json({
        ...metrics,
        memory: 0, // Memory is measured separately
        vulnerabilities: 0
      });
    } catch (e: any) {
      console.error("Lighthouse Audit Error:", e);
      res.status(500).json({ error: e.message });
    } finally {
      isAuditRunning = false;
    }
  });

  app.post('/api/measure-memory', async (req, res) => {
    if (isMemoryMeasuring) {
      return res.status(429).json({ error: "Memory measurement already in progress" });
    }
    isMemoryMeasuring = true;
    try {
      console.log("Measuring memory usage...");
      const memory = await measureMemoryUsage();
      res.json({ memory });
    } catch (e: any) {
      console.error("Memory Measurement Error:", e);
      res.status(500).json({ error: e.message, memory: 0 });
    } finally {
      isMemoryMeasuring = false;
    }
  });

  app.get('/api/sonar-metrics', async (req, res) => {
    try {
      const metrics = await getSonarMetrics();
      res.json(metrics);
    } catch (e: any) {
      console.error("Error fetching SonarQube metrics (returning empty):", e.message);
      // Return empty object so frontend shows "-"
      res.json({});
    }
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
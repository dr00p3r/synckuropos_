// server.ts
import { createRxServer } from 'rxdb-server/plugins/server';
import { RxServerAdapterExpress } from 'rxdb-server/plugins/adapter-express';
import { createServerDatabase } from './db';

const run = async () => {
  const myRxDatabase = await createServerDatabase();

  const server = await createRxServer({
    database: myRxDatabase,
    adapter: RxServerAdapterExpress,
    port: 443,
  });

  server.addReplicationEndpoint({
    name: 'products-endpoint',
    collection: myRxDatabase.collections.products,
  });

  await server.start();
  console.log('🚀 RxServer running on https://localhost:443');
};

run().catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});

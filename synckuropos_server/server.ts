// server.ts
import { createRxServer } from 'rxdb-server/plugins/server';
import { RxServerAdapterExpress } from 'rxdb-server/plugins/adapter-express';
import { createServerDatabase } from './db.ts';

const run = async () => {
  const myRxDatabase = await createServerDatabase();

  const server = await createRxServer({
    database: myRxDatabase,
    adapter: RxServerAdapterExpress,
    port: 3000,
    cors: 'https://vite-test.dr00p3r.top'
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

  console.log(productsEndpoint.urlPath);
  console.log(usersEndpoint.urlPath);

  await server.start();
  console.log('🚀 RxServer running on http://localhost:3000');
};

run().catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});

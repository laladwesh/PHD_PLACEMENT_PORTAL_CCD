import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), '.mongodb-data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Starting local persistent MongoDB instance on port 27017...');

try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'phd_placement_portal',
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
    },
  });

  console.log('====================================================');
  console.log('Local MongoDB server is ACTIVE and LISTENING:');
  console.log('URI:', mongod.getUri());
  console.log('Data Directory:', dataDir);
  console.log('====================================================');

  const keepAlive = () => setTimeout(keepAlive, 1000 * 60 * 60);
  keepAlive();

  process.on('SIGINT', async () => {
    console.log('Stopping MongoDB server...');
    await mongod.stop();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    console.log('Stopping MongoDB server...');
    await mongod.stop();
    process.exit(0);
  });
} catch (err) {
  console.error('Failed to start MongoMemoryServer:', err);
}

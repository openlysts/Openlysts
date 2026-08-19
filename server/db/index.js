import pg from 'pg';
import { initSchema } from './schema.js';

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/openlyst',
});

initSchema(db).then(() => {
  console.log('[DB] connected to PostgreSQL & schema initialized');
}).catch(err => {
  console.error('[DB] Schema init failed:', err);
});

export { db };

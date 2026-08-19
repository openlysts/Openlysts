import pg from 'pg';
import { initSchema } from './schema.js';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[DB] CRITICAL ERROR: DATABASE_URL environment variable is missing.');
  console.error('[DB] CEO DIRECTIVE: You must run against the live Vercel/Neon database.');
  console.error('[DB] Please run `vercel env pull .env.local` to sync credentials.');
  process.exit(1);
}

// Handle Vercel CLI [SENSITIVE] obfuscation
let connectionString = process.env.DATABASE_URL;
if (connectionString === '[SENSITIVE]') {
  console.error('[DB] CRITICAL ERROR: DATABASE_URL was pulled as [SENSITIVE].');
  console.error('[DB] Please uncheck "Sensitive" in Vercel Dashboard for DATABASE_URL and run `vercel env pull .env.local --environment production` again, or copy the URL manually into .env.local.');
  process.exit(1);
}

const db = new Pool({
  connectionString,
});

initSchema(db).then(() => {
  console.log('[DB] connected to PostgreSQL & schema initialized');
}).catch(err => {
  console.error('[DB] Schema init failed:', err);
});

export { db };

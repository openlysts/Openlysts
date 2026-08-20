import pg from 'pg';
import { initSchema } from './schema.js';

const { Pool } = pg;

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.NEON_DATABASE_URL || '';

if (!connectionString || connectionString === '[SENSITIVE]') {
  console.warn('[DB] WARNING: DATABASE_URL is missing or set to [SENSITIVE].');
}

const isNeonOrCloud = 
  connectionString.includes('neon.tech') || 
  connectionString.includes('sslmode=require') || 
  connectionString.includes('vercel-storage.com') ||
  process.env.NODE_ENV === 'production' || 
  !!process.env.VERCEL;

const db = new Pool({
  connectionString,
  ssl: (isNeonOrCloud && connectionString && !connectionString.includes('localhost')) ? { rejectUnauthorized: false } : undefined,
  max: process.env.VERCEL ? 5 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true
});

if (connectionString && connectionString !== '[SENSITIVE]') {
  initSchema(db).then(() => {
    console.log('[DB] connected to PostgreSQL & schema initialized');
  }).catch(err => {
    console.error('[DB] Schema init failed:', err.message);
  });
}

export { db };

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
  ssl: (isNeonOrCloud && connectionString && !connectionString.includes('localhost')) ? true : undefined,
  max: process.env.VERCEL ? 5 : 10,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
  keepAlive: true
});

if (connectionString && connectionString !== '[SENSITIVE]') {
  // CRITICAL FIX: DO NOT run initSchema(db) on every module load.
  // In Vercel serverless environments, this runs on every single API request,
  // exhausting Neon's data transfer limits and causing 504 timeouts.
  // Schema initialization should only be done via explicit CLI scripts (e.g., db:reset).
  console.log('[DB] PostgreSQL pool initialized (skipping auto-schema creation to save quota).');
}

export { db };

import pg from 'pg';
import { initSchema } from './schema.js';

const { Pool } = pg;

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.NEON_DATABASE_URL || '';

if (!connectionString || connectionString === '[SENSITIVE]') {
  throw new Error("FATAL: DATABASE_URL is missing or set to [SENSITIVE]. Cannot safely connect to database.");
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
  // Neon serverless endpoints are expensive to reconnect to (~2s cold wake per
  // new TLS connection). A 5s idle timeout destroyed the pool between page-load
  // asset bursts, so every burst paid reconnect churn. 60s keeps bursts warm
  // without pinning the endpoint awake between user sessions (Neon autosuspend
  // is minutes-scale, so the endpoint still sleeps during long idle gaps).
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
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

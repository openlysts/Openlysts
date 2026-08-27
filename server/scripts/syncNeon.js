import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { initSchema } from '../db/schema.js';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const ALTS_PATH = path.join(DATA_DIR, 'mega_alternatives_catalog.json');
const REPOS_PATH = path.join(DATA_DIR, 'mega_repositories_catalog.json');

async function syncToNeon() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('[SYNC] ERROR: No DATABASE_URL or POSTGRES_URL found in environment.');
    process.exit(1);
  }

  console.log('[SYNC] Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  console.log('[SYNC] Connected successfully! Initializing schema...');
  
  await initSchema(client);
  console.log('[SYNC] Schema initialized. Starting two-way idempotent synchronization...');

  try {
    // 1. Sync Alternatives
    if (fs.existsSync(ALTS_PATH)) {
      const alternatives = JSON.parse(fs.readFileSync(ALTS_PATH, 'utf-8'));
      console.log(`[SYNC] Upserting ${alternatives.length} alternatives into "Alternative" table...`);

      const batchSize = 50;
      let insertedAlts = 0;

      for (let i = 0; i < alternatives.length; i += batchSize) {
        const batch = alternatives.slice(i, i + batchSize);
        for (const alt of batch) {
          const query = `
            INSERT INTO "Alternative" (
              id, created_date, paid_tool_name, free_tool_name, free_tool_repo,
              free_tool_url, category, description, quality_score, verified_oss
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              paid_tool_name = EXCLUDED.paid_tool_name,
              free_tool_name = EXCLUDED.free_tool_name,
              free_tool_repo = EXCLUDED.free_tool_repo,
              free_tool_url = EXCLUDED.free_tool_url,
              category = EXCLUDED.category,
              description = EXCLUDED.description,
              quality_score = EXCLUDED.quality_score,
              verified_oss = EXCLUDED.verified_oss
            WHERE 
              "Alternative".paid_tool_name IS DISTINCT FROM EXCLUDED.paid_tool_name OR
              "Alternative".free_tool_name IS DISTINCT FROM EXCLUDED.free_tool_name OR
              "Alternative".free_tool_repo IS DISTINCT FROM EXCLUDED.free_tool_repo OR
              "Alternative".free_tool_url IS DISTINCT FROM EXCLUDED.free_tool_url OR
              "Alternative".category IS DISTINCT FROM EXCLUDED.category OR
              "Alternative".description IS DISTINCT FROM EXCLUDED.description OR
              "Alternative".quality_score IS DISTINCT FROM EXCLUDED.quality_score OR
              "Alternative".verified_oss IS DISTINCT FROM EXCLUDED.verified_oss;
          `;
          await client.query(query, [
            alt.id,
            alt.created_date || new Date().toISOString(),
            alt.paid_tool_name,
            alt.free_tool_name,
            alt.free_tool_repo,
            alt.free_tool_url,
            alt.category,
            alt.description,
            alt.quality_score || 92,
            alt.verified_oss ? 1 : 0
          ]);
          insertedAlts++;
        }
        process.stdout.write(`[SYNC] Progress: ${insertedAlts}/${alternatives.length} alternatives synced\r`);
      }
      console.log(`\n[SYNC] Finished syncing ${insertedAlts} alternatives!`);
    }

    // 2. Sync Repositories — DISABLED
    // The in-memory catalog engine (catalogEngine.js) is now the primary source for repository data.
    // Syncing 47K+ repos to Neon was the #1 cause of "data transfer quota exceeded" errors.
    // Repository data is served from mega_repositories_catalog.json loaded into RAM at startup.
    if (fs.existsSync(REPOS_PATH)) {
      const repos = JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8'));
      console.log(`[SYNC] Skipping ${repos.length} repository sync to Neon (catalog engine is the primary source).`);
    }

    console.log('[SYNC] SUCCESS: Full database synchronization complete!');
  } catch (err) {
    console.error('[SYNC] Synchronization error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

syncToNeon();

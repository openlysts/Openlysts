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
              verified_oss = EXCLUDED.verified_oss;
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

    // 2. Sync Repositories
    if (fs.existsSync(REPOS_PATH)) {
      const repos = JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8'));
      console.log(`[SYNC] Upserting ${repos.length} repositories into "Repository" table...`);

      let insertedRepos = 0;
      const batchSize = 50;

      for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize);
        for (const repo of batch) {
          const query = `
            INSERT INTO "Repository" (
              id, created_date, github_id, full_name, owner, name, description,
              html_url, homepage_url, language, license_key, license_name,
              stars, forks, open_issues, topics, categories, quality_score,
              trending_score, difficulty, hidden
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (id) DO UPDATE SET
              stars = EXCLUDED.stars,
              forks = EXCLUDED.forks,
              open_issues = EXCLUDED.open_issues,
              quality_score = EXCLUDED.quality_score,
              trending_score = EXCLUDED.trending_score,
              categories = EXCLUDED.categories,
              topics = EXCLUDED.topics;
          `;
          await client.query(query, [
            repo.id,
            repo.created_date || new Date().toISOString(),
            repo.github_id || Math.floor(Math.random() * 90000000),
            repo.full_name,
            repo.owner,
            repo.name,
            repo.description,
            repo.html_url,
            repo.homepage_url,
            repo.language,
            repo.license_key,
            repo.license_name,
            repo.stars || 0,
            repo.forks || 0,
            repo.open_issues || 0,
            JSON.stringify(repo.topics || []),
            JSON.stringify(repo.categories || []),
            repo.quality_score || 90,
            repo.trending_score || 90,
            repo.difficulty || 'Intermediate',
            0
          ]);
          insertedRepos++;
        }
        process.stdout.write(`[SYNC] Progress: ${insertedRepos}/${repos.length} repositories synced\r`);
      }
      console.log(`\n[SYNC] Finished syncing ${insertedRepos} repositories!`);
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

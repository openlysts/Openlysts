import { db } from '../db/index.js';

async function cleanupDb() {
  console.log('[Cleanup] Starting database cleanup...');
  try {
    const { rows: tables } = await db.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
    `);
    
    if (tables.length === 0) {
      console.log('[Cleanup] No tables found to drop.');
    } else {
      for (const table of tables) {
        if (table.tablename !== 'sqlite_sequence') {
          console.log(`[Cleanup] Dropping table ${table.tablename}...`);
          await db.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
        }
      }
    }
    
    console.log('[Cleanup] Database completely reset. Restart your server to auto-recreate tables.');
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  } finally {
    process.exit(0);
  }
}

cleanupDb();

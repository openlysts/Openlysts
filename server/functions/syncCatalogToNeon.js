import { db } from '../db/index.js';
import { entities } from '../services/entities.js';
import { getCatalogRepositories, getCatalogAlternatives } from '../services/catalogEngine.js';
import { serverCache } from '../services/cache.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';
import { invalidateAlternativesCache } from './queryAlternatives.js';

/**
 * Checks if Neon database is reachable and accepts queries.
 */
export async function checkNeonAvailability() {
  try {
    const res = await Promise.race([
      db.query('SELECT 1 as ping'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (5s)')), 5000))
    ]);
    return res && res.rows && res.rows.length > 0;
  } catch (err) {
    return false;
  }
}

/**
 * Hybrid Data Synchronization:
 * Merges the bundled/local high-speed JSON catalog into Neon PostgreSQL
 * when Neon is available and active.
 */
export default async function syncCatalogToNeon(req, res) {
  try {
    const isAvailable = await checkNeonAvailability();
    if (!isAvailable) {
      serverCache.set('neon_incomplete', true, 60 * 60 * 1000); // flag for 1 hour
      const msg = 'Neon PostgreSQL database is currently unreachable or data transfer quota is exceeded. Openlysts is running smoothly in 100% Free Edge JSON Catalog mode.';
      console.warn(`[HYBRID SYNC] ${msg}`);
      if (res) {
        return res.status(200).json({
          success: false,
          mode: 'EDGE_CATALOG_FALLBACK',
          message: msg
        });
      }
      return { success: false, mode: 'EDGE_CATALOG_FALLBACK', message: msg };
    }

    console.log('[HYBRID SYNC] Neon PostgreSQL is available! Starting catalog merge...');
    
    // 1. Sync Repositories
    const repos = getCatalogRepositories();
    console.log(`[HYBRID SYNC] Synchronizing ${repos.length} repositories to Neon in chunks...`);
    const CHUNK_SIZE = 50;
    let syncedRepos = 0;

    for (let i = 0; i < repos.length; i += CHUNK_SIZE) {
      const chunk = repos.slice(i, i + CHUNK_SIZE);
      try {
        await entities.Repository.bulkUpsert(chunk);
        syncedRepos += chunk.length;
      } catch (chunkErr) {
        console.warn(`[HYBRID SYNC] Chunk ${i}-${i + CHUNK_SIZE} repo sync error:`, chunkErr.message);
        if (chunkErr.message?.includes('quota') || chunkErr.message?.includes('limit')) {
          serverCache.set('neon_incomplete', true, 60 * 60 * 1000);
          break;
        }
      }
    }

    // 2. Sync Alternatives
    const alts = getCatalogAlternatives();
    console.log(`[HYBRID SYNC] Synchronizing ${alts.length} alternatives to Neon in chunks...`);
    let syncedAlts = 0;

    for (let i = 0; i < alts.length; i += CHUNK_SIZE) {
      const chunk = alts.slice(i, i + CHUNK_SIZE);
      try {
        await entities.Alternative.bulkUpsert(chunk);
        syncedAlts += chunk.length;
      } catch (chunkErr) {
        console.warn(`[HYBRID SYNC] Chunk ${i}-${i + CHUNK_SIZE} alt sync error:`, chunkErr.message);
        if (chunkErr.message?.includes('quota') || chunkErr.message?.includes('limit')) {
          serverCache.set('neon_incomplete', true, 60 * 60 * 1000);
          break;
        }
      }
    }

    serverCache.invalidate('neon_incomplete');
    invalidateRepositoriesCache();
    invalidateAlternativesCache();

    const result = {
      success: true,
      mode: 'HYBRID_NEON_SYNCED',
      syncedRepositories: syncedRepos,
      totalRepositories: repos.length,
      syncedAlternatives: syncedAlts,
      totalAlternatives: alts.length,
      timestamp: new Date().toISOString()
    };

    console.log('[HYBRID SYNC] Completed successfully:', result);
    if (res) return res.json(result);
    return result;
  } catch (err) {
    console.error('[HYBRID SYNC] Unexpected failure:', err);
    if (res) {
      return res.status(500).json({ error: true, message: err.message });
    }
    return { success: false, error: err.message };
  }
}

export { syncCatalogToNeon };

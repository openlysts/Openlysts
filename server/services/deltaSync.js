/**
 * deltaSync.js
 * Cursor-based delta synchronization between Neon DB and in-memory catalog.
 * Tracks exactly which records have been synced, handles conflicts,
 * and provides batched fetching to stay within Vercel timeout limits.
 */

import fs from 'fs';
import path from 'path';
import { ingestCatalogRepository, ingestCatalogAlternative } from './catalogEngine.js';

const CURSOR_FILE = path.join(process.cwd(), 'server', 'data', 'delta_cursor.json');
const MAX_BATCH_SIZE = 500; // Max records per sync cycle
const SYNC_COOLDOWN_MS = 30000; // 30 seconds between syncs

class DeltaSync {
  constructor() {
    this.cursor = {
      lastRepoSyncAt: new Date(0).toISOString(),
      lastAltSyncAt: new Date(0).toISOString(),
      totalReposSynced: 0,
      totalAltsSynced: 0,
      lastSyncAt: null,
      syncCount: 0,
      lastError: null,
    };
    this.isSyncing = false;
    this.lastSyncTime = 0;
    this._loadCursor();
  }

  /**
   * Run a delta sync cycle. Fetches only records updated since last cursor.
   * Returns { reposSynced, altsSynced, timeMs, hasMore }
   */
  async sync(options = {}) {
    if (this.isSyncing) return { skipped: true, reason: 'already syncing' };

    const now = Date.now();
    if (!options.force && (now - this.lastSyncTime) < SYNC_COOLDOWN_MS) {
      return { skipped: true, reason: 'cooldown' };
    }

    this.isSyncing = true;
    const startMs = Date.now();
    let reposSynced = 0;
    let altsSynced = 0;
    let hasMore = false;

    try {
      const { db } = await import('../db/index.js');

      // Fetch repo deltas
      const repoRes = await db.query(
        'SELECT * FROM "Repository" WHERE updated_at > $1 ORDER BY updated_at ASC LIMIT $2',
        [this.cursor.lastRepoSyncAt, MAX_BATCH_SIZE]
      );

      if (repoRes.rows && repoRes.rows.length > 0) {
        for (const row of repoRes.rows) {
          ingestCatalogRepository(row);
          reposSynced++;
        }
        // Update cursor to the latest synced record
        this.cursor.lastRepoSyncAt = repoRes.rows[repoRes.rows.length - 1].updated_at;
        this.cursor.totalReposSynced += reposSynced;

        // If we hit the batch limit, there are more records
        if (reposSynced >= MAX_BATCH_SIZE) {
          hasMore = true;
        }
      }

      // Fetch alternative deltas
      const altRes = await db.query(
        'SELECT * FROM "Alternative" WHERE updated_at > $1 ORDER BY updated_at ASC LIMIT $2',
        [this.cursor.lastAltSyncAt, MAX_BATCH_SIZE]
      );

      if (altRes.rows && altRes.rows.length > 0) {
        for (const row of altRes.rows) {
          ingestCatalogAlternative(row);
          altsSynced++;
        }
        this.cursor.lastAltSyncAt = altRes.rows[altRes.rows.length - 1].updated_at;
        this.cursor.totalAltsSynced += altsSynced;

        if (altsSynced >= MAX_BATCH_SIZE) {
          hasMore = true;
        }
      }

      this.cursor.lastSyncAt = new Date().toISOString();
      this.cursor.syncCount++;
      this.cursor.lastError = null;
      this.lastSyncTime = Date.now();
      this._saveCursor();

    } catch (err) {
      this.cursor.lastError = err.message;
      this._saveCursor();
      console.error('[DELTA SYNC] Error:', err.message);
    } finally {
      this.isSyncing = false;
    }

    const timeMs = Date.now() - startMs;
    if (reposSynced > 0 || altsSynced > 0) {
      console.log(`[DELTA SYNC] Synced ${reposSynced} repos, ${altsSynced} alts in ${timeMs}ms${hasMore ? ' (more pending)' : ''}`);
    }

    return { reposSynced, altsSynced, timeMs, hasMore, cursor: { ...this.cursor } };
  }

  /**
   * Get current sync status for the monitoring dashboard.
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      cursor: { ...this.cursor },
      nextSyncAt: this.lastSyncTime + SYNC_COOLDOWN_MS,
      ready: Date.now() >= (this.lastSyncTime + SYNC_COOLDOWN_MS),
    };
  }

  /**
   * Determine if a repository is stale (not updated in maxStaleDays, default 180).
   * @param {Object} repo
   * @param {number} maxStaleDays
   * @returns {boolean}
   */
  isStale(repo, maxStaleDays = 180) {
    if (!repo) return false;
    if (repo.archived) return true;
    const dateStr = repo.updated_at || repo.pushed_at || repo.github_updated_at;
    if (!dateStr) return false;
    const updatedMs = new Date(dateStr).getTime();
    if (isNaN(updatedMs)) return false;
    const cutoff = Date.now() - (maxStaleDays * 24 * 60 * 60 * 1000);
    return updatedMs < cutoff;
  }

  /**
   * Filter and tag records with stale lifecycle status.
   * @param {Array} repos
   * @param {number} maxStaleDays
   * @returns {Array} Repositories with is_stale flag
   */
  filterStaleRecords(repos, maxStaleDays = 180) {
    if (!Array.isArray(repos)) return [];
    return repos.map(r => ({
      ...r,
      is_stale: this.isStale(r, maxStaleDays),
    }));
  }

  /**
   * Reset cursor (admin action — full re-sync on next cycle).
   */
  reset() {
    this.cursor = {
      lastRepoSyncAt: new Date(0).toISOString(),
      lastAltSyncAt: new Date(0).toISOString(),
      totalReposSynced: 0,
      totalAltsSynced: 0,
      lastSyncAt: null,
      syncCount: 0,
      lastError: null,
    };
    this._saveCursor();
    console.log('[DELTA SYNC] Cursor reset — full re-sync on next cycle');
  }

  _loadCursor() {
    try {
      if (fs.existsSync(CURSOR_FILE)) {
        const data = JSON.parse(fs.readFileSync(CURSOR_FILE, 'utf8'));
        this.cursor = { ...this.cursor, ...data };
        console.log(`[DELTA SYNC] Loaded cursor: ${this.cursor.totalReposSynced} repos, ${this.cursor.totalAltsSynced} alts synced previously`);
      }
    } catch (e) {
      // Start fresh
    }
  }

  _saveCursor() {
    try {
      const dir = path.dirname(CURSOR_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // NON-REGRESSING write: catalogEngine.syncDeltasFromDB shares this same
      // file and may have already advanced the watermark past this batch (it
      // fuses the full table with no batch cap, deltaSync caps at 500 rows).
      // Taking the max of on-disk vs in-memory keeps whichever system advanced
      // furthest, so a 500-row batch can never roll the cursor back and force
      // the next boot to re-pull thousands of rows from Neon.
      let onDisk = {};
      try {
        if (fs.existsSync(CURSOR_FILE)) onDisk = JSON.parse(fs.readFileSync(CURSOR_FILE, 'utf8'));
      } catch { /* tolerate corrupt file */ }
      const diskRepo = onDisk.lastRepoSyncAt ? new Date(onDisk.lastRepoSyncAt) : null;
      const diskAlt = onDisk.lastAltSyncAt ? new Date(onDisk.lastAltSyncAt) : null;
      const memRepo = this.cursor.lastRepoSyncAt ? new Date(this.cursor.lastRepoSyncAt) : null;
      const memAlt = this.cursor.lastAltSyncAt ? new Date(this.cursor.lastAltSyncAt) : null;
      const merged = { ...onDisk, ...this.cursor };
      merged.lastRepoSyncAt = (diskRepo && memRepo && diskRepo > memRepo) ? onDisk.lastRepoSyncAt : this.cursor.lastRepoSyncAt;
      merged.lastAltSyncAt = (diskAlt && memAlt && diskAlt > memAlt) ? onDisk.lastAltSyncAt : this.cursor.lastAltSyncAt;
      fs.writeFileSync(CURSOR_FILE, JSON.stringify(merged, null, 2), 'utf8');
    } catch (e) {
      // Non-critical
    }
  }
}

export const deltaSync = new DeltaSync();

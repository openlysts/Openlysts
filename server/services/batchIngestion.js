/**
 * batchIngestion.js
 * Queue-based batch ingestion service that processes queries in controlled batches.
 * Designed to work within Vercel's 30s timeout AND support continuous external workers.
 * 
 * Key features:
 * - Priority-based queue (high-value queries first)
 * - Progress tracking with resume capability
 * - Configurable batch sizes and timeouts
 * - Token rotation integration
 * - External worker support (via API triggers)
 */

import { githubFetch, ingestRepoItem } from '../functions/runIngestion.js';
import { entities } from './entities.js';
import { db } from '../db/index.js';
import { tokenRotation } from './tokenRotation.js';
import { serverCache } from './cache.js';
import fs from 'fs';
import path from 'path';

const BATCH_STATE_FILE = 'server/data/batch_state.json';
const MAX_BATCH_TIME_MS = 25000; // 25s (leave 5s buffer for Vercel 30s limit)
const DEFAULT_BATCH_SIZE = 50; // repos per batch
const PRIORITY_HIGH = 1;
const PRIORITY_MEDIUM = 2;
const PRIORITY_LOW = 3;

class BatchIngestion {
  constructor() {
    this.isRunning = false;
    this.currentBatch = null;
    this.stats = {
      totalProcessed: 0,
      totalAdded: 0,
      totalErrors: 0,
      batchesCompleted: 0,
      lastBatchAt: null,
      startedAt: null,
    };
  }

  /**
   * Build a prioritized queue from SEED_QUERIES.
   * High priority: queries never run, trending topics, SaaS alternatives
   * Medium: queries run >7 days ago
   * Low: queries run recently
   */
  buildQueue(seedQueries, existingQueryState = []) {
    const stateMap = new Map();
    for (const qs of existingQueryState) {
      stateMap.set(qs.query_string, qs);
    }

    const now = Date.now();
    const queue = seedQueries.map((sq, idx) => {
      const state = stateMap.get(sq.query_string);
      let priority = PRIORITY_MEDIUM;

      if (!state || !state.last_run_at) {
        priority = PRIORITY_HIGH; // Never run
      } else {
        const daysSince = (now - new Date(state.last_run_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) priority = PRIORITY_MEDIUM;
        else if (daysSince > 1) priority = PRIORITY_LOW;
      }

      // Boost priority for high-signal queries
      if (sq.query_string.includes('alternative') || sq.query_string.includes('alternative to')) {
        priority = Math.max(PRIORITY_HIGH, priority - 1);
      }

      return {
        ...sq,
        priority,
        state: state || { current_page: 1 },
        index: idx,
      };
    });

    // Sort: HIGH first, then MEDIUM, then LOW. Within same priority, oldest first.
    queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const aLast = a.state.last_run_at ? new Date(a.state.last_run_at).getTime() : 0;
      const bLast = b.state.last_run_at ? new Date(b.state.last_run_at).getTime() : 0;
      return aLast - bLast;
    });

    return queue;
  }

  /**
   * Execute a single batch of ingestion.
   * Returns { processed, added, updated, errors, queriesCompleted, timeMs }
   */
  async executeBatch(options = {}) {
    if (this.isRunning) {
      return { skipped: true, message: 'Batch already running' };
    }

    this.isRunning = true;
    const batchStart = Date.now();
    const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    const maxTimeMs = options.maxTimeMs || MAX_BATCH_TIME_MS;
    let reposProcessed = 0;
    let reposAdded = 0;
    let reposUpdated = 0;
    let queriesCompleted = 0;
    const errors = [];

    try {
      // Initialize token rotation
      tokenRotation.init();

      // Load existing repo map for dedup
      const repoMap = new Map();
      try {
        const { rows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
        for (const r of rows) {
          if (r.github_id) repoMap.set(String(r.github_id), r);
          if (r.full_name) repoMap.set(r.full_name.toLowerCase(), r);
        }
      } catch (e) {
        console.warn('[BATCH] Could not load repo map:', e.message);
      }

      // Load query state
      const queryState = options.queryState || [];
      const queue = this.buildQueue(options.seedQueries || [], queryState);

      // Process queries within time budget
      const maxQueries = options.maxQueries || 10;
      let queriesProcessed = 0;

      for (const query of queue) {
        if (Date.now() - batchStart > maxTimeMs) {
          console.log(`[BATCH] Time budget exhausted after ${queriesProcessed} queries`);
          break;
        }
        if (queriesProcessed >= maxQueries) break;

        try {
          const page = query.state.current_page || 1;
          let qStr = query.query_string;
          if (!qStr.includes('stars:>')) {
            qStr += ' stars:>50';
          }

          const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(qStr)}&sort=stars&order=desc&per_page=${batchSize}&page=${page}`;
          const data = await githubFetch(url);

          if (data.items && data.items.length > 0) {
            const processedBatch = [];
            for (const item of data.items) {
              try {
                const res = await ingestRepoItem(item, query.category_hint, repoMap, new Map());
                processedBatch.push(res);
                reposProcessed++;
                if (!repoMap.has(String(item.id)) && !repoMap.has(item.full_name.toLowerCase())) {
                  reposAdded++;
                  repoMap.set(String(item.id), res.repoData);
                } else {
                  reposUpdated++;
                }
              } catch (repoErr) {
                errors.push(`Repo ${item.full_name}: ${repoErr.message}`);
              }
            }

            // Batch DB write
            if (processedBatch.length > 0) {
              try {
                await entities.Repository.bulkUpsert(processedBatch.map(p => p.repoData));
                await entities.MetricSnapshot.bulkCreate(processedBatch.map(p => p.snapshotData));
              } catch (dbErr) {
                console.warn('[BATCH] DB write warning:', dbErr.message);
              }
            }

            // Update query state
            const hasMore = data.items.length === batchSize;
            let nextPage = hasMore && page < 10 ? page + 1 : 1;

            // Deep pagination
            if (page >= 10 && data.items.length > 0) {
              const oldest = data.items.reduce((a, b) =>
                new Date(a.created_at) < new Date(b.created_at) ? a : b
              );
              const oldestDate = oldest.created_at.split('T')[0];
              qStr = qStr.replace(/created:<[\d-]+/, '') + ` created:<${oldestDate}`;
            } else if (!hasMore) {
              qStr = qStr.replace(/\s?created:<[\d-]+/, '');
            }

            query.state.current_page = nextPage;
            query.state.last_run_at = new Date().toISOString();
            query.state.query_string = qStr;
          }

          queriesCompleted++;
          queriesProcessed++;
        } catch (queryErr) {
          errors.push(`Query "${query.query_string}": ${queryErr.message}`);
          // Don't count failed queries as completed
        }
      }

      // Save query state
      this._saveQueryState(queue);

    } catch (err) {
      errors.push(`Batch error: ${err.message}`);
    } finally {
      this.isRunning = false;
    }

    const timeMs = Date.now() - batchStart;

    // Update stats
    this.stats.totalProcessed += reposProcessed;
    this.stats.totalAdded += reposAdded;
    this.stats.totalErrors += errors.length;
    this.stats.batchesCompleted++;
    this.stats.lastBatchAt = new Date().toISOString();

    // Invalidate caches
    try {
      serverCache.invalidate('category_counts');
      serverCache.invalidate('global_platform_stats');
    } catch (e) {}

    return {
      processed: reposProcessed,
      added: reposAdded,
      updated: reposUpdated,
      queriesCompleted,
      errors: errors.slice(0, 10),
      timeMs,
      stats: { ...this.stats },
    };
  }

  /**
   * Get current batch status for the admin dashboard.
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: { ...this.stats },
      tokenPool: tokenRotation.getStatus(),
    };
  }

  _saveQueryState(queue) {
    try {
      const state = queue.map(q => ({
        id: `q-${q.index}`,
        query_string: q.state.query_string || q.query_string,
        category_hint: q.category_hint,
        enabled: true,
        current_page: q.state.current_page || 1,
        last_run_at: q.state.last_run_at || null,
      }));
      const dir = path.dirname(BATCH_STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(BATCH_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      // Non-critical
    }
  }
}

export const batchIngestion = new BatchIngestion();

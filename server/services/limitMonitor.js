/**
 * Openlysts Free-Tier Limit Monitor
 * Continuously tracks GitHub API, Neon DB, and Vercel usage
 * against free-tier caps. Logs warnings when approaching limits.
 *
 * Runs as a background task, checking every 5 minutes.
 */

import { db } from '../db/index.js';
import { serverCache } from './cache.js';

const THRESHOLDS = {
  github: {
    limit: 5000,
    warnPercent: 0.7,   // Warn at 70% usage
    criticalPercent: 0.9, // Critical at 90%
  },
  neon_storage: {
    limitMB: 512,       // 0.5 GB
    warnPercent: 0.7,
    criticalPercent: 0.85,
  },
  neon_compute: {
    limitHours: 191.9,
    warnPercent: 0.7,
    criticalPercent: 0.85,
  },
  neon_writes: {
    limitMB: 512,
    warnPercent: 0.7,
    criticalPercent: 0.85,
  },
  vercel_build: {
    limitMB: 100,
    warnPercent: 0.7,
    criticalPercent: 0.85,
  },
  vercel_bandwidth: {
    limitGB: 100,
    warnPercent: 0.7,
    criticalPercent: 0.85,
  },
};

class LimitMonitor {
  constructor() {
    this.lastCheck = null;
    this.checks = {};
    this.alerts = [];
    this.checkIntervalMs = 5 * 60 * 1000; // 5 minutes
    this.timer = null;
  }

  /**
   * Start periodic monitoring
   */
  start() {
    if (this.timer) return;
    console.log('[MONITOR] Starting limit monitor (interval: 5min)');
    this.timer = setInterval(() => this.runAll(), this.checkIntervalMs);
    // Run immediately on start
    this.runAll();
  }

  /**
   * Stop periodic monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Run all limit checks
   */
  async runAll() {
    const results = {};
    try {
      const [github, neonStorage] = await Promise.allSettled([
        this.checkGitHub(),
        this.checkNeonStorage(),
      ]);

      results.github = github.status === 'fulfilled' ? github.value : { error: github.reason?.message };
      results.neon_storage = neonStorage.status === 'fulfilled' ? neonStorage.value : { error: neonStorage.reason?.message };
      results.cache = this.checkCache();
      results.memory = this.checkMemory();
      results.dbPool = this.checkDbPool();

      this.lastCheck = new Date().toISOString();
      this.checks = results;

      // Log warnings
      this._logWarnings(results);

    } catch (err) {
      console.error('[MONITOR] Check failed:', err.message);
    }
    return results;
  }

  /**
   * Check GitHub API rate limit
   */
  async checkGitHub() {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      return { status: 'no_token', remaining: 'N/A', limit: 'N/A' };
    }

    try {
      const res = await fetch('https://api.github.com/rate_limit', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return { status: 'error', httpStatus: res.status };
      }

      const data = await res.json();
      const core = data.resources?.core || { remaining: 0, limit: 5000, reset: 0 };
      const search = data.resources?.search || { remaining: 0, limit: 30, reset: 0 };

      const usagePercent = (core.limit - core.remaining) / core.limit;
      const resetDate = new Date(core.reset * 1000);

      return {
        status: usagePercent > THRESHOLDS.github.criticalPercent ? 'critical'
          : usagePercent > THRESHOLDS.github.warnPercent ? 'warning' : 'ok',
        remaining: core.remaining,
        limit: core.limit,
        used: core.limit - core.remaining,
        usagePercent: `${(usagePercent * 100).toFixed(1)}%`,
        resetAt: resetDate.toISOString(),
        searchRemaining: search.remaining,
        searchLimit: search.limit,
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Check Neon storage usage
   */
  async checkNeonStorage() {
    try {
      const { rows } = await db.query(`
        SELECT pg_database_size(current_database()) as size_bytes
      `);
      const sizeBytes = rows[0]?.size_bytes || 0;
      const sizeMB = sizeBytes / 1024 / 1024;
      const usagePercent = sizeMB / THRESHOLDS.neon_storage.limitMB;

      return {
        status: usagePercent > THRESHOLDS.neon_storage.criticalPercent ? 'critical'
          : usagePercent > THRESHOLDS.neon_storage.warnPercent ? 'warning' : 'ok',
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        limitMB: THRESHOLDS.neon_storage.limitMB,
        usagePercent: `${(usagePercent * 100).toFixed(1)}%`,
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Check in-memory cache stats
   */
  checkCache() {
    const stats = serverCache.getStats();
    const mem = serverCache.getMemoryEstimate();
    return {
      ...stats,
      memoryMB: parseFloat(mem.mb),
    };
  }

  /**
   * Check Node.js memory usage
   */
  checkMemory() {
    const mem = process.memoryUsage();
    return {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1022 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      externalMB: Math.round(mem.external / 1024 / 1024),
    };
  }

  /**
   * Check DB connection pool status
   */
  checkDbPool() {
    return {
      total: db.totalCount || 0,
      idle: db.idleCount || 0,
      waiting: db.waitingCount || 0,
    };
  }

  /**
   * Get a summary of all limits for the admin API
   */
  getSummary() {
    return {
      lastCheck: this.lastCheck,
      checks: this.checks,
      alerts: this.alerts.slice(-20), // Last 20 alerts
      thresholds: THRESHOLDS,
      uptime: Math.floor(process.uptime()),
    };
  }

  /**
   * Log warnings for any limits approaching threshold
   * @private
   */
  _logWarnings(results) {
    for (const [key, data] of Object.entries(results)) {
      if (data?.status === 'critical') {
        const msg = `[MONITOR] CRITICAL: ${key} at ${data.usagePercent || 'unknown'}`;
        console.error(msg);
        this.alerts.push({ level: 'critical', key, message: msg, ts: new Date().toISOString() });
      } else if (data?.status === 'warning') {
        const msg = `[MONITOR] WARNING: ${key} at ${data.usagePercent || 'unknown'}`;
        console.warn(msg);
        this.alerts.push({ level: 'warning', key, message: msg, ts: new Date().toISOString() });
      }
    }
  }
}

export const limitMonitor = new LimitMonitor();
export default limitMonitor;

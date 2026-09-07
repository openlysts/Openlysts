/**
 * Error Tracker — lightweight in-memory error aggregation.
 *
 * Captures thrown server errors + client-reported errors with timestamps,
 * counts, codes, and recent samples. Data is exposed to the admin dashboard
 * via GET /api/admin/errors. In-memory by design (zero DB cost, free-tier
 * safe); entries are capped so memory stays bounded.
 */

const MAX_ENTRIES = 200;
const MAX_RECENT = 20;

export class ErrorTracker {
  constructor() {
    /** Ring buffer of recent error samples (oldest dropped first). */
    this.entries = [];
    /** Aggregated counters keyed by `${code}|${path}`. */
    this.counts = new Map();
    this.total = 0;
    this.byCode = new Map();
    this.byPath = new Map();
    this.firstSeenAt = null;
    this.lastSeenAt = null;
  }

  /**
   * @param {Error|string} error
   * @param {Object} meta { code, status, method, path, requestId, userId, stack }
   */
  capture(error, meta = {}) {
    const now = new Date();
    if (!this.firstSeenAt) this.firstSeenAt = now.toISOString();
    this.lastSeenAt = now.toISOString();

    const message = error instanceof Error ? error.message : String(error);
    const code = meta.code || 'UNKNOWN_ERROR';
    const status = meta.status || (error instanceof Error && error.status) || 500;
    const path = meta.path || 'unknown';
    const stack =
      meta.stack || (error instanceof Error ? error.stack : undefined) || '';

    this.total += 1;

    // Code / path aggregation
    this.byCode.set(code, (this.byCode.get(code) || 0) + 1);
    this.byPath.set(path, (this.byPath.get(path) || 0) + 1);
    const aggKey = `${code}|${path}`;
    this.counts.set(aggKey, (this.counts.get(aggKey) || 0) + 1);

    // Ring buffer sample
    this.entries.push({
      timestamp: now.toISOString(),
      code,
      status,
      message: String(message).slice(0, 300),
      method: meta.method,
      path,
      requestId: meta.requestId,
      userId: meta.userId,
      stack: String(stack).slice(0, 2000),
    });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    }

    return this;
  }

  /** Aggregate summary for the admin dashboard. */
  summary() {
    const byCode = Object.fromEntries(
      [...this.byCode.entries()].sort((a, b) => b[1] - a[1])
    );
    const byPath = Object.fromEntries(
      [...this.byPath.entries()].sort((a, b) => b[1] - a[1])
    );
    return {
      total: this.total,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
      byCode,
      byPath,
      recent: this.entries.slice(-MAX_RECENT),
    };
  }

  recent(limit = MAX_RECENT) {
    return this.entries.slice(-limit);
  }

  reset() {
    this.entries = [];
    this.counts = new Map();
    this.byCode = new Map();
    this.byPath = new Map();
    this.total = 0;
    this.firstSeenAt = null;
    this.lastSeenAt = null;
    return this;
  }
}

/** Singleton used across the server. */
export const errorTracker = new ErrorTracker();

export default errorTracker;

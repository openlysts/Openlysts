/**
 * Openlysts In-Memory LRU & TTL Cache Service
 * Provides high-speed, sub-millisecond caching for heavy database aggregations (category counts, system metrics)
 * to eliminate repetitive Neon PostgreSQL wire-transfer bandwidth.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Get a cached value if present and not expired
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Store a value with a Time-To-Live in milliseconds (default: 15 minutes)
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMs Default 15 mins (900,000 ms)
   */
  set(key, value, ttlMs = 15 * 60 * 1000) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Check if non-expired key exists in cache
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache key or keys matching a prefix
   * @param {string} keyOrPrefix 
   */
  invalidate(keyOrPrefix) {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }

    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  flush() {
    this.store.clear();
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    let activeEntries = 0;
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now <= entry.expiry) activeEntries++;
      else this.store.delete(key);
    }
    return {
      totalKeys: this.store.size,
      activeKeys: activeEntries,
    };
  }
}

export const serverCache = new MemoryCache();
export default serverCache;

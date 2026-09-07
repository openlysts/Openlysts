/**
 * Openlysts In-Memory LRU & TTL Cache Service
 * Provides high-speed, sub-millisecond caching for heavy database aggregations
 * to eliminate repetitive Neon PostgreSQL wire-transfer bandwidth.
 *
 * Features:
 * - LRU eviction when capacity is reached
 * - TTL-based expiration per entry
 * - Hit/miss statistics for monitoring
 * - Memory pressure awareness
 */

class MemoryCache {
  /**
   * @param {number} maxSize Maximum number of entries (default 500)
   * @param {number} defaultTtlMs Default TTL in ms (default 15 min)
   */
  constructor(maxSize = 500, defaultTtlMs = 15 * 60 * 1000) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };
  }

  /**
   * Get a cached value if present and not expired.
   * Moves the entry to the end of the Map (most recently used) for LRU.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    // Move to end (most recently used) for LRU
    this.store.delete(key);
    this.store.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Store a value with a Time-To-Live in milliseconds.
   * Triggers LRU eviction if over capacity.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs] Override default TTL
   */
  set(key, value, ttlMs) {
    const ttl = ttlMs ?? this.defaultTtlMs;

    // If key exists, delete first to update LRU order
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, {
      value,
      expiry: Date.now() + ttl,
    });

    this.stats.sets++;

    // LRU eviction: remove oldest entries when over capacity
    this._evict();
  }

  /**
   * Check if non-expired key exists in cache (does not update LRU order)
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate a specific cache key or all keys matching a prefix
   * @param {string} keyOrPrefix
   * @returns {number} Number of entries invalidated
   */
  invalidate(keyOrPrefix) {
    let count = 0;
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return 1;
    }

    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache and reset stats
   */
  flush() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0 };
  }

  /**
   * Evict oldest entries when over capacity (LRU)
   * @private
   */
  _evict() {
    while (this.store.size > this.maxSize) {
      // Map迭代器按插入顺序返回，第一个就是最旧的
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Get cache statistics for monitoring
   * Also cleans up expired entries as a side effect
   */
  getStats() {
    let activeEntries = 0;
    let expiredCleaned = 0;
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now <= entry.expiry) {
        activeEntries++;
      } else {
        this.store.delete(key);
        expiredCleaned++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      totalKeys: this.store.size,
      activeEntries,
      expiredCleaned,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0
        ? `${((this.stats.hits / totalRequests) * 100).toFixed(1)}%`
        : 'N/A',
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      sets: this.stats.sets,
    };
  }

  /**
   * Get memory usage estimate (rough, in bytes)
   */
  getMemoryEstimate() {
    let bytes = 0;
    for (const [key, entry] of this.store.entries()) {
      bytes += key.length * 2; // string chars
      bytes += JSON.stringify(entry.value).length * 2; // rough JSON size
      bytes += 64; // entry overhead
    }
    return { bytes, mb: (bytes / 1024 / 1024).toFixed(2) };
  }
}

export const serverCache = new MemoryCache();
export default serverCache;

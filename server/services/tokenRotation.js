/**
 * tokenRotation.js
 * Manages a pool of GitHub Personal Access Tokens with automatic rotation.
 * When one token hits the rate limit, it switches to the next available token.
 * Tracks per-token usage and provides health status for the admin dashboard.
 */

import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), 'server', 'data', 'token_state.json');

class TokenRotation {
  constructor() {
    this.tokens = [];
    this.currentIndex = 0;
    this.usage = new Map(); // tokenIndex -> { requests, resetsAt, consecutiveErrors }
    this.initialized = false;
  }

  /**
   * Initialize from environment. Call once on server boot.
   * Reads GITHUB_TOKENS (comma-separated) and falls back to GITHUB_TOKEN.
   */
  init() {
    if (this.initialized) return;

    const multiTokens = process.env.GITHUB_TOKENS;
    const singleToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (multiTokens && multiTokens.trim()) {
      this.tokens = multiTokens.split(',').map(t => t.trim()).filter(Boolean);
    } else if (singleToken && singleToken.trim()) {
      this.tokens = [singleToken.trim()];
    }

    // Load persisted state (rate limit resets, etc.)
    this._loadState();

    this.initialized = true;
    console.log(`[TOKEN ROTATION] Initialized with ${this.tokens.length} token(s)`);
  }

  /**
   * Get the next available token. Returns null if all tokens are exhausted.
   * Skips tokens that are rate-limited (backoff active).
   */
  getToken() {
    if (this.tokens.length === 0) return null;

    const now = Date.now();
    const startIdx = this.currentIndex;

    // Round-robin with backoff awareness
    for (let i = 0; i < this.tokens.length; i++) {
      const idx = (startIdx + i) % this.tokens.length;
      const info = this.usage.get(idx) || {};

      // Skip if this token is in backoff
      if (info.resetsAt && now < info.resetsAt) {
        continue;
      }

      // Skip if too many consecutive errors
      if ((info.consecutiveErrors || 0) >= 3) {
        continue;
      }

      this.currentIndex = (idx + 1) % this.tokens.length;
      return { token: this.tokens[idx], index: idx };
    }

    // All tokens exhausted — find the one that resets soonest
    let earliest = Infinity;
    let earliestIdx = 0;
    for (let i = 0; i < this.tokens.length; i++) {
      const info = this.usage.get(i) || {};
      const resetTime = info.resetsAt || 0;
      if (resetTime < earliest) {
        earliest = resetTime;
        earliestIdx = i;
      }
    }

    const waitMs = earliest - now;
    if (waitMs > 0) {
      console.log(`[TOKEN ROTATION] All tokens exhausted. Earliest reset in ${Math.round(waitMs / 1000)}s (token #${earliestIdx})`);
      return null;
    }

    // Reset time has passed, try again
    this.currentIndex = earliestIdx;
    return { token: this.tokens[earliestIdx], index: earliestIdx };
  }

  /**
   * Report a successful request for a token.
   */
  reportSuccess(tokenIndex) {
    const info = this.usage.get(tokenIndex) || { requests: 0, consecutiveErrors: 0 };
    info.requests = (info.requests || 0) + 1;
    info.consecutiveErrors = 0;
    info.lastUsedAt = new Date().toISOString();
    this.usage.set(tokenIndex, info);
  }

  /**
   * Report a rate-limited response. Sets backoff for this token.
   */
  reportRateLimit(tokenIndex, resetTimestamp) {
    const resetMs = resetTimestamp ? resetTimestamp * 1000 : Date.now() + 60000;
    const info = this.usage.get(tokenIndex) || { requests: 0 };
    info.resetsAt = resetMs;
    info.consecutiveErrors = (info.consecutiveErrors || 0) + 1;
    info.lastRateLimitedAt = new Date().toISOString();
    this.usage.set(tokenIndex, info);
    this._saveState();

    console.log(`[TOKEN ROTATION] Token #${tokenIndex} rate-limited until ${new Date(resetMs).toISOString()}`);
  }

  /**
   * Report an auth error (401). This token is dead until reconfigured.
   */
  reportAuthError(tokenIndex) {
    const info = this.usage.get(tokenIndex) || { requests: 0 };
    info.consecutiveErrors = 999; // Effectively disable
    info.lastAuthErrorAt = new Date().toISOString();
    this.usage.set(tokenIndex, info);
    this._saveState();

    console.warn(`[TOKEN ROTATION] Token #${tokenIndex} returned 401 — disabled until reconfigured`);
  }

  /**
   * Get status of all tokens for the admin dashboard.
   * Never returns actual token values — only health info.
   */
  getStatus() {
    const now = Date.now();
    return {
      totalTokens: this.tokens.length,
      currentIndex: this.currentIndex,
      tokens: this.tokens.map((t, idx) => {
        const info = this.usage.get(idx) || {};
        const isRateLimited = info.resetsAt && now < info.resetsAt;
        const isDisabled = (info.consecutiveErrors || 0) >= 3;
        return {
          index: idx,
          // Show only last 4 chars for identification
          masked: `...${t.slice(-4)}`,
          requests: info.requests || 0,
          isRateLimited,
          resetsIn: isRateLimited ? Math.round((info.resetsAt - now) / 1000) : 0,
          isDisabled,
          consecutiveErrors: info.consecutiveErrors || 0,
          lastUsedAt: info.lastUsedAt || null,
          lastRateLimitedAt: info.lastRateLimitedAt || null,
        };
      }),
      // Aggregate stats
      totalRequests: Array.from(this.usage.values()).reduce((sum, u) => sum + (u.requests || 0), 0),
      healthyTokens: this.tokens.filter((_, idx) => {
        const info = this.usage.get(idx) || {};
        return (info.consecutiveErrors || 0) < 3 && (!info.resetsAt || now >= info.resetsAt);
      }).length,
    };
  }

  /**
   * Reset all token states (admin action).
   */
  resetAll() {
    this.usage.clear();
    this.currentIndex = 0;
    this._saveState();
    console.log('[TOKEN ROTATION] All token states reset');
  }

  /**
   * Add a new token at runtime (from Settings page).
   */
  addToken(token) {
    if (!token || typeof token !== 'string') return false;
    const trimmed = token.trim();
    if (this.tokens.includes(trimmed)) return false;
    this.tokens.push(trimmed);
    this._saveState();
    console.log(`[TOKEN ROTATION] Added token #${this.tokens.length - 1} (...${trimmed.slice(-4)})`);
    return true;
  }

  /**
   * Remove a token by index.
   */
  removeToken(index) {
    if (index < 0 || index >= this.tokens.length) return false;
    this.tokens.splice(index, 1);
    this.usage.delete(index);
    // Re-index usage map
    const newUsage = new Map();
    for (const [k, v] of this.usage.entries()) {
      newUsage.set(k > index ? k - 1 : k, v);
    }
    this.usage = newUsage;
    if (this.currentIndex >= this.tokens.length) {
      this.currentIndex = 0;
    }
    this._saveState();
    console.log(`[TOKEN ROTATION] Removed token #${index}`);
    return true;
  }

  _saveState() {
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const state = {
        currentIndex: this.currentIndex,
        usage: Object.fromEntries(this.usage),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      // Non-critical — state is in-memory
    }
  }

  _loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const state = JSON.parse(raw);
        if (state.currentIndex !== undefined) this.currentIndex = state.currentIndex;
        if (state.usage) {
          for (const [k, v] of Object.entries(state.usage)) {
            this.usage.set(parseInt(k), v);
          }
        }
        console.log(`[TOKEN ROTATION] Restored state: index=${this.currentIndex}, ${this.usage.size} tracked tokens`);
      }
    } catch (e) {
      // Start fresh
    }
  }
}

// Singleton
export const tokenRotation = new TokenRotation();

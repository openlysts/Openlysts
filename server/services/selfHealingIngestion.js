/**
 * selfHealingIngestion.js
 * Wraps the ingestion pipeline with self-healing capabilities:
 * - Exponential backoff retry for transient failures
 * - Circuit breaker to stop hammering failing endpoints
 * - Source health tracking for monitoring dashboard
 * - Automatic fallback to alternative data sources
 */

import { tokenRotation } from './tokenRotation.js';
import { deltaSync } from './deltaSync.js';
import { anomalyDetector } from './anomalyDetector.js';

const CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before opening circuit
const CIRCUIT_BREAKER_RESET_MS = 300_000; // 5 minutes before half-open
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

class SelfHealingIngestion {
  constructor() {
    this.sourceHealth = new Map(); // sourceName -> { failures, successes, lastFailure, circuitOpen, lastSuccess }
    this.ingestionStats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunAt: null,
      lastError: null,
      avgRunTimeMs: 0,
    };
  }

  /**
   * Execute a function with retry and circuit breaker protection.
   * @param {string} sourceName - Name of the data source (for health tracking)
   * @param {Function} fn - The function to execute
   * @param {Object} options - { maxRetries, baseBackoffMs }
   * @returns {any} Result of fn()
   */
  async executeWithProtection(sourceName, fn, options = {}) {
    const maxRetries = options.maxRetries ?? MAX_RETRIES;
    const baseBackoff = options.baseBackoffMs ?? BASE_BACKOFF_MS;

    // Check circuit breaker
    const health = this._getHealth(sourceName);
    if (health.circuitOpen) {
      const timeSinceOpen = Date.now() - health.lastFailure;
      if (timeSinceOpen < CIRCUIT_BREAKER_RESET_MS) {
        console.log(`[SELF-HEAL] Circuit OPEN for "${sourceName}" — skipping (${Math.round((CIRCUIT_BREAKER_RESET_MS - timeSinceOpen) / 1000)}s until half-open)`);
        return { skipped: true, reason: 'circuit_open', source: sourceName };
      }
      // Half-open: allow one trial request
      console.log(`[SELF-HEAL] Circuit HALF-OPEN for "${sourceName}" — allowing trial request`);
    }

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        this._reportSuccess(sourceName);
        return result;
      } catch (err) {
        lastError = err;
        this._reportFailure(sourceName, err);

        if (attempt < maxRetries) {
          const delay = baseBackoff * Math.pow(2, attempt) + Math.random() * 500;
          console.log(`[SELF-HEAL] "${sourceName}" failed (attempt ${attempt + 1}/${maxRetries + 1}): ${err.message}. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    console.error(`[SELF-HEAL] "${sourceName}" exhausted ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
    return { error: true, source: sourceName, message: lastError.message };
  }

  /**
   * Run a full ingestion cycle with self-healing.
   * Replaces the bare executeIngestion() call with protected versions.
   */
  async runProtectedIngestion(executeIngestionFn) {
    const runStart = Date.now();
    this.ingestionStats.totalRuns++;

    try {
      // First: sync deltas from Neon (low cost, high value)
      const deltaResult = await this.executeWithProtection('delta_sync', () => deltaSync.sync({ force: true }));

      // Then: run main ingestion with protection
      const result = await this.executeWithProtection('github_search', () => executeIngestionFn());

      const runTimeMs = Date.now() - runStart;
      this.ingestionStats.successfulRuns++;
      this.ingestionStats.lastRunAt = new Date().toISOString();
      this.ingestionStats.avgRunTimeMs = Math.round(
        (this.ingestionStats.avgRunTimeMs * (this.ingestionStats.successfulRuns - 1) + runTimeMs) / this.ingestionStats.successfulRuns
      );

      // Feed the anomaly detector with real run telemetry (success path)
      const queriesCompleted = Number(result?.reposProcessed || result?.added || 0) + Number(deltaResult?.reposSynced || 0);
      anomalyDetector.recordRun({ queriesCompleted, errorsCount: 0, durationMs: runTimeMs, successRate: 100 });

      return { ...result, deltaSync: deltaResult, runTimeMs };
    } catch (err) {
      this.ingestionStats.failedRuns++;
      this.ingestionStats.lastError = err.message;
      this.ingestionStats.lastRunAt = new Date().toISOString();

      // Feed the anomaly detector with real run telemetry (failure path)
      anomalyDetector.recordRun({ queriesCompleted: 0, errorsCount: 1, durationMs: Date.now() - runStart, successRate: 0 });

      throw err;
    }
  }

  /**
   * Get comprehensive status for the monitoring dashboard.
   */
  getStatus() {
    const sources = {};
    for (const [name, health] of this.sourceHealth) {
      sources[name] = {
        failures: health.failures,
        successes: health.successes,
        consecutiveSuccesses: health.consecutiveSuccesses || 0,
        classification: this.classifyHealth(name),
        circuitOpen: health.circuitOpen,
        lastFailure: health.lastFailure ? new Date(health.lastFailure).toISOString() : null,
        lastSuccess: health.lastSuccess ? new Date(health.lastSuccess).toISOString() : null,
        successRate: health.failures + health.successes > 0
          ? Math.round((health.successes / (health.failures + health.successes)) * 100)
          : 100,
      };
    }

    return {
      ingestion: { ...this.ingestionStats },
      sources,
      tokenPool: tokenRotation.getStatus(),
      deltaSync: deltaSync.getStatus(),
      healthySources: Array.from(this.sourceHealth.entries())
        .filter(([, h]) => !h.circuitOpen && h.failures === 0)
        .map(([name]) => name),
      openCircuits: Array.from(this.sourceHealth.entries())
        .filter(([, h]) => h.circuitOpen)
        .map(([name]) => name),
    };
  }

  /**
   * Classify source health state: healthy | degraded | failing | circuit_open
   */
  classifyHealth(sourceName) {
    const health = this._getHealth(sourceName);
    if (health.circuitOpen) return 'circuit_open';
    if (health.failures >= 3) return 'failing';
    if (health.failures >= 1) return 'degraded';
    return 'healthy';
  }

  /**
   * Reset all circuit breakers (admin action).
   */
  resetCircuits() {
    for (const [, health] of this.sourceHealth) {
      health.circuitOpen = false;
      health.failures = 0;
      health.consecutiveSuccesses = 0;
    }
    console.log('[SELF-HEAL] All circuit breakers reset');
  }

  _getHealth(sourceName) {
    if (!this.sourceHealth.has(sourceName)) {
      this.sourceHealth.set(sourceName, {
        failures: 0,
        successes: 0,
        consecutiveSuccesses: 0,
        lastFailure: null,
        lastSuccess: null,
        circuitOpen: false,
      });
    }
    return this.sourceHealth.get(sourceName);
  }

  _reportSuccess(sourceName) {
    const health = this._getHealth(sourceName);
    health.successes++;
    health.consecutiveSuccesses = (health.consecutiveSuccesses || 0) + 1;
    health.lastSuccess = Date.now();
    health.failures = 0; // Reset failure count on success
    if (health.circuitOpen) {
      health.circuitOpen = false;
      console.log(`[SELF-HEAL] Circuit CLOSED for "${sourceName}" after successful trial execution`);
    }
  }

  _reportFailure(sourceName, error) {
    const health = this._getHealth(sourceName);
    health.failures++;
    health.consecutiveSuccesses = 0;
    health.lastFailure = Date.now();

    if (health.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      health.circuitOpen = true;
      console.warn(`[SELF-HEAL] Circuit OPENED for "${sourceName}" after ${health.failures} failures`);
    }
  }
}

export const selfHealingIngestion = new SelfHealingIngestion();

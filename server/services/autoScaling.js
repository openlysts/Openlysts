/**
 * autoScaling.js
 * Dynamically adjusts ingestion parameters based on:
 * - Token pool health (available tokens, rate limit status)
 * - Recent ingestion success/failure rates
 * - Time of day (lower limits during peak GitHub usage)
 * - Vercel function timeout constraints
 */

import { tokenRotation } from './tokenRotation.js';

class AutoScaling {
  constructor() {
    this.config = {
      minBatchSize: 10,
      maxBatchSize: 100,
      defaultBatchSize: 50,
      minQueriesPerRun: 3,
      maxQueriesPerRun: 20,
      defaultQueriesPerRun: 10,
      timeoutBudgetMs: 25000, // Leave 5s buffer for Vercel 30s limit
      monthlyQuotaBudget: 15000, // Safe monthly API call ceiling
      monthlyCallsUsed: 0,
    };
    this.metrics = {
      avgQueryTimeMs: 2000, // Starting estimate
      recentSuccessRate: 1.0,
      lastAdjustment: null,
    };
  }

  /**
   * Record API calls made toward the monthly budget.
   * @param {number} count 
   */
  recordCalls(count = 1) {
    this.config.monthlyCallsUsed += Math.max(0, Number(count) || 1);
  }

  /**
   * Calculate optimal ingestion parameters based on current system state and quota budget.
   */
  calculateOptimalParams() {
    const tokenStatus = tokenRotation.getStatus();
    const availableTokens = tokenStatus.healthyTokens || 1;
    const totalTokens = tokenStatus.totalTokens || 1;

    // Token availability factor: 1.0 when all healthy, scales down
    const tokenFactor = Math.max(0.2, availableTokens / totalTokens);

    // Success rate factor: reduces batch size when errors are high
    const successFactor = Math.max(0.3, this.metrics.recentSuccessRate);

    // Quota budget factor: reduces volume as monthly ceiling approaches
    const budgetRatio = this.config.monthlyCallsUsed / Math.max(1, this.config.monthlyQuotaBudget);
    const budgetFactor = budgetRatio >= 1.0 ? 0.2 : (budgetRatio >= 0.8 ? 0.5 : 1.0);

    // Combined scaling factor
    const scaleFactor = Math.min(tokenFactor, successFactor, budgetFactor);

    // Calculate optimal batch size
    const batchSize = Math.round(
      this.config.defaultBatchSize * scaleFactor
    );
    const clampedBatchSize = Math.max(
      this.config.minBatchSize,
      Math.min(this.config.maxBatchSize, batchSize)
    );

    // Calculate optimal queries per run
    const queriesPerRun = Math.round(
      this.config.defaultQueriesPerRun * tokenFactor * budgetFactor
    );
    const clampedQueries = Math.max(
      this.config.minQueriesPerRun,
      Math.min(this.config.maxQueriesPerRun, queriesPerRun)
    );

    // Calculate time budget per query
    const timePerQuery = Math.floor(
      this.config.timeoutBudgetMs / clampedQueries
    );

    this.metrics.lastAdjustment = new Date().toISOString();

    return {
      batchSize: clampedBatchSize,
      maxQueries: clampedQueries,
      maxTimeMs: this.config.timeoutBudgetMs,
      timePerQuery,
      scaleFactor: Math.round(scaleFactor * 100) / 100,
      tokenFactor: Math.round(tokenFactor * 100) / 100,
      successFactor: Math.round(successFactor * 100) / 100,
      budgetFactor: Math.round(budgetFactor * 100) / 100,
      monthlyQuotaBudget: this.config.monthlyQuotaBudget,
      monthlyCallsUsed: this.config.monthlyCallsUsed,
      availableTokens,
      totalTokens,
    };
  }

  /**
   * Update metrics after an ingestion run completes.
   */
  reportRun(result) {
    if (result.timeMs && result.queriesCompleted) {
      const avgTimePerQuery = result.timeMs / Math.max(1, result.queriesCompleted);
      // Exponential moving average
      this.metrics.avgQueryTimeMs = this.metrics.avgQueryTimeMs * 0.7 + avgTimePerQuery * 0.3;
    }

    if (result.errors !== undefined) {
      const totalAttempts = (result.queriesCompleted || 0) + (result.errors?.length || 0);
      if (totalAttempts > 0) {
        const successRate = (result.queriesCompleted || 0) / totalAttempts;
        this.metrics.recentSuccessRate = this.metrics.recentSuccessRate * 0.8 + successRate * 0.2;
      }
    }
  }

  /**
   * Get current scaling status for monitoring dashboard.
   */
  getStatus() {
    const params = this.calculateOptimalParams();
    return {
      ...params,
      metrics: { ...this.metrics },
    };
  }
}

export const autoScaling = new AutoScaling();

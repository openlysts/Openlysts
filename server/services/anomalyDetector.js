/**
 * anomalyDetector.js
 * SRE-grade real-time anomaly detection service for Openlysts.
 * Monitors rolling ingestion metrics, failure rates, circuit breaker states, and memory trends.
 * Surfaced through the Admin Hypervisor at /api/admin/anomalies.
 */

import { selfHealingIngestion } from './selfHealingIngestion.js';

class AnomalyDetector {
  constructor() {
    this.history = [];
    this.memorySnapshots = [];
    this.MAX_HISTORY = 50;
    this.MAX_MEMORY_SNAPSHOTS = 20;
  }

  /**
   * Record metrics from an ingestion or system run.
   * @param {Object} stats - { queriesCompleted, errorsCount, durationMs, successRate }
   */
  recordRun(stats = {}) {
    const total = (Number(stats.queriesCompleted) || 0) + (Number(stats.errorsCount) || 0);
    const successRate = total > 0
      ? Math.round(((Number(stats.queriesCompleted) || 0) / total) * 100)
      : (stats.successRate !== undefined ? Number(stats.successRate) : 100);

    const entry = {
      timestamp: Date.now(),
      queriesCompleted: Number(stats.queriesCompleted) || 0,
      errorsCount: Number(stats.errorsCount) || 0,
      durationMs: Number(stats.durationMs) || 0,
      successRate,
    };

    this.history.push(entry);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }

    // Capture memory snapshot
    this.captureMemorySnapshot();
  }

  /**
   * Capture a process memory snapshot.
   */
  captureMemorySnapshot() {
    try {
      const mem = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      });
      if (this.memorySnapshots.length > this.MAX_MEMORY_SNAPSHOTS) {
        this.memorySnapshots.shift();
      }
    } catch {
      // Memory check unavailable (e.g. mock environment)
    }
  }

  /**
   * Detect anomalies across rolling ingestion runs and system metrics.
   * @returns {Array<Object>} List of active detected anomalies
   */
  detectAnomalies() {
    const anomalies = [];

    // 1. High Failure Rate Check (last 3 runs)
    if (this.history.length >= 3) {
      const recentRuns = this.history.slice(-3);
      const avgSuccess = recentRuns.reduce((sum, r) => sum + r.successRate, 0) / recentRuns.length;
      if (avgSuccess < 60) {
        anomalies.push({
          type: 'HIGH_FAILURE_RATE',
          severity: 'critical',
          message: `Recent ingestion success rate dropped to ${Math.round(avgSuccess)}% across last 3 runs.`,
          detectedAt: new Date().toISOString(),
          metrics: { avgSuccessRate: Math.round(avgSuccess) },
        });
      }
    }

    // 2. Ingestion Drop Check (sudden drop relative to moving average)
    if (this.history.length >= 5) {
      const baseline = this.history.slice(0, -1);
      const avgCompleted = baseline.reduce((sum, r) => sum + r.queriesCompleted, 0) / baseline.length;
      const latestRun = this.history[this.history.length - 1];

      if (avgCompleted >= 5 && latestRun.queriesCompleted < (avgCompleted * 0.2)) {
        anomalies.push({
          type: 'INGESTION_DROP',
          severity: 'warning',
          message: `Latest ingestion run completed only ${latestRun.queriesCompleted} queries (baseline average: ${Math.round(avgCompleted)}).`,
          detectedAt: new Date().toISOString(),
          metrics: { latestCompleted: latestRun.queriesCompleted, baselineAvg: Math.round(avgCompleted) },
        });
      }
    }

    // 3. Memory Bloat Check (monotonic growth over last 5 snapshots > 100MB)
    if (this.memorySnapshots.length >= 5) {
      const recentMem = this.memorySnapshots.slice(-5);
      const isMonotonicGrowth = recentMem.every((snap, idx, arr) => idx === 0 || snap.heapUsedMb >= arr[idx - 1].heapUsedMb);
      const growthDelta = recentMem[recentMem.length - 1].heapUsedMb - recentMem[0].heapUsedMb;

      if (isMonotonicGrowth && growthDelta >= 100) {
        anomalies.push({
          type: 'MEMORY_BLOAT',
          severity: 'warning',
          message: `Heap memory continuously climbed +${growthDelta}MB over the last 5 cycles without garbage collection relief.`,
          detectedAt: new Date().toISOString(),
          metrics: { growthDeltaMb: growthDelta, currentHeapMb: recentMem[recentMem.length - 1].heapUsedMb },
        });
      }
    }

    // 4. Circuit Breaker Alert (open circuits in selfHealingIngestion)
    try {
      const selfHealStatus = selfHealingIngestion.getStatus();
      if (selfHealStatus && Array.isArray(selfHealStatus.openCircuits) && selfHealStatus.openCircuits.length > 0) {
        anomalies.push({
          type: 'CIRCUIT_BREAKER_OPEN',
          severity: 'critical',
          message: `Circuit breaker active for sources: ${selfHealStatus.openCircuits.join(', ')}.`,
          detectedAt: new Date().toISOString(),
          metrics: { openCircuits: selfHealStatus.openCircuits },
        });
      }
    } catch {
      // Ignored if service not initialized
    }

    return anomalies;
  }

  /**
   * Get status summary for monitoring dashboard.
   */
  getStatus() {
    const anomalies = this.detectAnomalies();
    const status = anomalies.some(a => a.severity === 'critical')
      ? 'alert'
      : (anomalies.length > 0 ? 'degraded' : 'nominal');

    return {
      status,
      activeAnomaliesCount: anomalies.length,
      anomalies,
      historyCount: this.history.length,
      latestMemorySnapshot: this.memorySnapshots[this.memorySnapshots.length - 1] || null,
    };
  }

  /**
   * Reset tracking state (admin / test action).
   */
  clear() {
    this.history = [];
    this.memorySnapshots = [];
  }
}

export const anomalyDetector = new AnomalyDetector();

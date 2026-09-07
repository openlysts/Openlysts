/**
 * featureFlags.js
 * Progressive rollout & runtime feature flag manager for Openlysts.
 * Supports kill-switches, env overrides, and deterministic rollout percentages.
 */

export class FeatureFlagsService {
  constructor() {
    this.flags = new Map([
      ['semantic_search', { enabled: true, rollout: 100 }],
      ['quality_radar', { enabled: true, rollout: 100 }],
      ['rising_stars', { enabled: true, rollout: 100 }],
      ['collaborative_collections', { enabled: true, rollout: 100 }],
      ['personalized_recommendations', { enabled: true, rollout: 100 }],
      ['pwa_offline_sync', { enabled: true, rollout: 100 }],
    ]);
  }

  /**
   * Deterministic hash from 0 to 99 for user canary bucketing
   */
  _hashUser(userId, flagName) {
    const str = `${userId || 'anonymous'}:${flagName}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 100;
    }
    return Math.abs(hash);
  }

  /**
   * Check if a feature flag is enabled for an optional user/session context.
   */
  isEnabled(flagName, userId = null) {
    const envKey = `FLAG_${flagName.toUpperCase()}`;
    if (process.env[envKey] !== undefined) {
      return process.env[envKey] === 'true' || process.env[envKey] === '1';
    }

    const config = this.flags.get(flagName);
    if (!config) return false;
    if (!config.enabled) return false;
    if (config.rollout >= 100) return true;
    if (config.rollout <= 0) return false;

    // Canary percentage bucketing
    const bucket = this._hashUser(userId, flagName);
    return bucket < config.rollout;
  }

  setFlag(flagName, enabled, rollout = 100) {
    const r = rollout !== undefined && !isNaN(rollout) ? Number(rollout) : 100;
    this.flags.set(flagName, {
      enabled: Boolean(enabled),
      rollout: Math.max(0, Math.min(100, r)),
    });
  }


  getAllFlags(userId = null) {
    const result = {};
    for (const [key] of this.flags.entries()) {
      result[key] = this.isEnabled(key, userId);
    }
    return result;
  }
}

export const featureFlags = new FeatureFlagsService();

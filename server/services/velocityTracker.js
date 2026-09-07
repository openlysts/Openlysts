/**
 * velocityTracker.js
 * High-momentum breakout repository detection for Openlysts.
 * Identifies rising stars gaining traction before mainstream awareness.
 */

import { getCatalogRepositories } from './catalogEngine.js';
import { calculateVelocityScore } from './qualityScorer.js';

// The full ranked rail is expensive to compute over the whole RAM catalog
// (~50k repos), so memoize it for a short TTL — freshness is minutes-scale for
// a "rising now" rail, but every Home load + refetch otherwise pays ~2s CPU.
let memoized = null;
let memoizedAt = 0;
const MEMO_TTL_MS = 60 * 1000;

/**
 * Get top rising breakout repositories.
 * Only real signals are used: a repo's recorded velocity/growth fields when
 * present, otherwise an honest magnitude-based proxy (stars x engagement).
 * No fabricated constants or synthetic growth numbers.
 * @param {number} limit - Maximum repositories to return (default 12)
 * @returns {Array<Object>}
 */
export function getRisingRepositories(limit = 12) {
  const now = Date.now();
  if (!memoized || now - memoizedAt > MEMO_TTL_MS) {
    const repos = getCatalogRepositories();
    if (!repos || !Array.isArray(repos) || repos.length === 0) return [];

    memoized = repos
      .filter(r => {
        if (r.archived || r.hidden) return false;
        const recordedVelocity = Number(r.velocity_score) || 0;
        const velocity = recordedVelocity > 0 ? recordedVelocity : calculateVelocityScore(r);
        const trending = Number(r.trending_score) || 0;
        const gained7d = Number(r.stars_gained_7d) || 0;
        return r.is_rising || velocity >= 75 || trending >= 85 || gained7d >= 15;
      })
      .map(r => {
        const recordedVelocity = Number(r.velocity_score) || 0;
        const velocity = recordedVelocity > 0 ? recordedVelocity : calculateVelocityScore(r);
        const gained7d = Number(r.stars_gained_7d) || 0;

        return {
          ...r,
          velocity_score: velocity,
          stars_gained_7d: gained7d,
          momentum_rating: Math.min(100, Math.round(velocity * 0.7 + Math.min(30, gained7d))),
        };
      })
      .sort((a, b) => b.momentum_rating - a.momentum_rating);
    memoizedAt = now;
  }

  return (memoized || []).slice(0, Math.max(1, Number(limit) || 12));
}

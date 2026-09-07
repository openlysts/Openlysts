/**
 * recommendations.js
 * Privacy-first personalized repository recommendations engine for Openlysts.
 * Computes affinity scores based on user interest vectors (bookmarks, history)
 * without sending personal identifiable information to third parties.
 */

import { getCatalogRepositories } from './catalogEngine.js';

/**
 * Generate personalized repository recommendations based on interest tags.
 * @param {Array<string>} interestTags - Topics/categories user has engaged with
 * @param {Array<string|number>} excludeIds - Repository IDs or full_names to omit
 * @param {number} limit - Maximum recommendations to return (default 6)
 * @returns {Array<Object>} Ranked recommended repositories
 */
export function getPersonalizedRecommendations(interestTags = [], excludeIds = [], limit = 6) {
  const repos = getCatalogRepositories();
  if (!repos || !Array.isArray(repos) || repos.length === 0) return [];

  const targets = (Array.isArray(interestTags) ? interestTags : [interestTags])
    .map(t => String(t || '').toLowerCase().trim())
    .filter(Boolean);

  const excludeSet = new Set((Array.isArray(excludeIds) ? excludeIds : [excludeIds])
    .map(id => String(id || '').toLowerCase().trim())
    .filter(Boolean)
  );

  // If no interest signals provided, fallback to top quality repositories
  if (targets.length === 0) {
    return repos
      .filter(r => !r.archived && !r.hidden && !excludeSet.has(String(r.id)) && !excludeSet.has(String(r.full_name).toLowerCase()))
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, Math.max(1, limit));
  }

  return repos
    .filter(r => {
      if (r.archived || r.hidden) return false;
      if (excludeSet.has(String(r.id)) || excludeSet.has(String(r.full_name).toLowerCase())) return false;
      return true;
    })
    .map(r => {
      const repoTokens = [
        r.name || '',
        r.description || '',
        r.language || '',
        ...(r.topics || []),
        ...(r.categories || [])
      ].map(s => String(s).toLowerCase());

      let matches = 0;
      for (const target of targets) {
        if (repoTokens.some(token => token === target || token.includes(target))) {
          matches++;
        }
      }

      const affinityRatio = targets.length > 0 ? (matches / targets.length) : 0;
      const baseQuality = Number(r.quality_score) || 75;
      const recommendationScore = Math.round(affinityRatio * 70 + (baseQuality * 0.3));

      return {
        ...r,
        recommendationScore,
        matchedInterests: matches,
      };
    })
    .filter(r => r.matchedInterests > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, Math.max(1, limit));
}

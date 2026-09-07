// ─── Client-side Sponsorships & Donation helpers ─────────────────────
// Public data comes from the edge-cached /api/sponsorships endpoint so
// badges render without touching Neon on every page load.

import { useQuery } from '@tanstack/react-query';

let publicCache = null;

export async function fetchSponsorships({ force = false } = {}) {
  if (!force && publicCache) return publicCache;
  try {
    const res = await fetch('/api/sponsorships', { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`sponsorships ${res.status}`);
    publicCache = await res.json();
  } catch (e) {
    // Never block the UI on sponsorships — badges are progressive enhancement.
    if (!publicCache) publicCache = { placements: [], settings: {}, transferMode: 'normal' };
  }
  return publicCache;
}

/** React-query hook for components that render badges. */
export function useSponsorships() {
  return useQuery({
    queryKey: ['public-sponsorships'],
    queryFn: () => fetchSponsorships({ force: true }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Find the first active placement matching a repo/alternative.
 * @param {Array} placements active placements from /api/sponsorships
 * @param {'repository'|'alternative'} placementType
 * @param {string|string[]} names candidate names (full_name, free_tool_name, slug…)
 */
export function findPlacement(placements, placementType, names) {
  if (!Array.isArray(placements) || placements.length === 0) return null;
  const targets = (Array.isArray(names) ? names : [names])
    .filter(Boolean)
    .map((n) => String(n).trim().toLowerCase());
  if (targets.length === 0) return null;
  return (
    placements.find((p) => {
      if (p.placement_type !== placementType) return false;
      const t = String(p.target_name || '').trim().toLowerCase();
      return targets.includes(t);
    }) || null
  );
}
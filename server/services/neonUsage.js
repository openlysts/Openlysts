// ─── Neon Usage Monitor ──────────────────────────────────────────────
// Optional live view of Neon free-tier consumption (network transfer) via
// the official Neon Management API. The project-details endpoint exposes
// `project.data_transfer_bytes` — a running total for the current billing
// period, available on all plans (incl. Free).
//
// Entirely optional: when NEON_API_KEY / NEON_PROJECT_ID are absent or the
// API errors, the budget panel reports "unknown" instead of failing. Hard
// enforcement stays with quotaGuard.js (storage) plus Neon's own plan cap
// (5 GB/mo on Free — overage suspends compute, never deletes data).

const NEON_API = 'https://console.neon.tech/api/v2';
const FREE_TRANSFER_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB / month

let usageCache = null;
let usageCacheAt = 0;
const CACHE_MS = 15 * 60 * 1000;

async function fetchNeonJson(url, apiKey) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Neon API ${res.status}`);
  return res.json();
}

/**
 * Fetch current free-tier consumption from the Neon Management API.
 * Falls back to `null` (unknown) on any error — never throws.
 *
 * @returns {Promise<null|{
 *   transfer: { usedBytes: number, limitBytes: number, percent: number },
 *   measuredAt: string
 * }>}
 */
export async function getNeonUsage({ force = false } = {}) {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  const now = Date.now();
  if (!force && usageCache && now - usageCacheAt < CACHE_MS) return usageCache;

  try {
    const data = await fetchNeonJson(`${NEON_API}/projects/${projectId}`, apiKey);
    const transferBytes = Number(data?.project?.data_transfer_bytes) || 0;
    const result = {
      transfer: {
        usedBytes: transferBytes,
        limitBytes: FREE_TRANSFER_LIMIT_BYTES,
        percent: (transferBytes / FREE_TRANSFER_LIMIT_BYTES) * 100,
      },
      measuredAt: new Date(now).toISOString(),
    };
    usageCache = result;
    usageCacheAt = now;
    return result;
  } catch (err) {
    console.warn('[NEON USAGE] Fetch failed (usage shown as unknown):', err.message);
    return null;
  }
}
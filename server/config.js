import { db } from './db/index.js';

// getSystemConfig previously ran a Neon query on EVERY call. The maintenance
// interceptor calls it for every request — including every static asset fetch —
// so a single page load could trigger dozens of DB round-trips. Cache each key
// briefly in memory; admin writes invalidate so toggles still apply instantly.
const configCache = new Map(); // key -> { value, expiresAt }
const CONFIG_TTL_MS = 10_000;

export function invalidateSystemConfigCache(key) {
  if (key === undefined) configCache.clear();
  else configCache.delete(key);
}

export async function getSystemConfig(key) {
  const now = Date.now();
  const hit = configCache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;
  try {
    const { rows } = await db.query('SELECT value FROM "SystemConfig" WHERE key = $1', [key]);
    const value = rows[0]?.value ?? null;
    configCache.set(key, { value, expiresAt: now + CONFIG_TTL_MS });
    return value;
  } catch (e) {
    return null;
  }
}

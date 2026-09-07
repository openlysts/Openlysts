// ─── Neon Transfer Guard ─────────────────────────────────────────────
// Autonomous free-tier survival layer. Neon Free caps network transfer at
// 5 GB/mo; overage suspends compute (data is never deleted) but outages
// hurt users. This guard watches the cached Neon usage figure (no extra
// API calls per request — neonUsage.js already caches 15 min) and flips
// the read path into progressively cheaper modes:
//
//   normal   ( < WARN% )      — full reads: RAM catalog + Neon enrichment
//   warn     ( >= WARN% )     — same reads, but the budget panel warns
//   critical ( >= CRITICAL% ) — RAM/JSON-only reads: skip Neon syncs,
//                               enrichment and live table counts until
//                               the next billing period or manual reset.
//
// Thresholds are env-overridable so the operator can tune from Vercel
// without a code deploy.

import { getNeonUsage } from './neonUsage.js';
import { getSystemConfig } from '../config.js';

const ENV_WARN_PCT = Number(process.env.NEON_TRANSFER_WARN_PCT || 70);
const ENV_CRITICAL_PCT = Number(process.env.NEON_TRANSFER_CRITICAL_PCT || 85);

// Thresholds may be overridden from the Admin → Free-Tier Budget GUI
// (SystemConfig keys `transfer_guard_warn_pct` / `transfer_guard_critical_pct`),
// which take precedence over the env defaults. Re-reads are throttled to once
// a minute so the guard never pays a Neon query per request.
let thresholdCache = { warnPct: ENV_WARN_PCT, criticalPct: ENV_CRITICAL_PCT, at: 0 };
async function getThresholds() {
  const now = Date.now();
  if (thresholdCache.at && now - thresholdCache.at < 60 * 1000) return thresholdCache;
  const [warn, critical] = await Promise.all([
    getSystemConfig('transfer_guard_warn_pct'),
    getSystemConfig('transfer_guard_critical_pct'),
  ]);
  const warnPct = warn !== null && warn !== undefined && warn !== '' ? Number(warn) : ENV_WARN_PCT;
  const criticalPct = critical !== null && critical !== undefined && critical !== '' ? Number(critical) : ENV_CRITICAL_PCT;
  thresholdCache = {
    warnPct: Number.isFinite(warnPct) ? Math.min(99, Math.max(1, warnPct)) : ENV_WARN_PCT,
    criticalPct: Number.isFinite(criticalPct) ? Math.min(100, Math.max(1, criticalPct)) : ENV_CRITICAL_PCT,
    at: now,
  };
  return thresholdCache;
}

let mode = 'normal'; // 'normal' | 'warn' | 'critical'
let modeSince = Date.now();
let checkedAt = 0;

export function _resetThresholdCacheForTests() {
  thresholdCache = { warnPct: ENV_WARN_PCT, criticalPct: ENV_CRITICAL_PCT, at: 0 };
}

export function getTransferMode() {
  return mode;
}

export function isTransferCritical() {
  return mode === 'critical';
}

export function isTransferWarn() {
  return mode === 'warn' || mode === 'critical';
}

/**
 * Re-evaluate the mode from the *cached* Neon usage figure.
 * Never throws, never forces a Neon Management API call (getNeonUsage
 * serves its 15-minute cache when available). Safe to call on boot and
 * on a slow interval.
 */
export async function refreshTransferMode({ force = false } = {}) {
  const now = Date.now();
  if (!force && checkedAt && now - checkedAt < 60 * 1000) return mode;
  checkedAt = now;
  try {
    const { warnPct, criticalPct } = await getThresholds();
    const usage = await getNeonUsage();
    if (!usage || !usage.transfer) return mode;
    const pct = usage.transfer.percent;
    const next = pct >= criticalPct ? 'critical' : pct >= warnPct ? 'warn' : 'normal';
    if (next !== mode) {
      console.log(
        `[TRANSFER-GUARD] mode ${mode} -> ${next} (Neon transfer ${pct.toFixed(1)}% of 5 GB cap)`
      );
      mode = next;
      modeSince = now;
    }
    return mode;
  } catch (e) {
    return mode;
  }
}

export function getTransferGuardInfo() {
  return {
    mode,
    modeSince: new Date(modeSince).toISOString(),
    warnPct: thresholdCache.warnPct,
    criticalPct: thresholdCache.criticalPct,
  };
}
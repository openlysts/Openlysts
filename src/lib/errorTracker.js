/**
 * Client-side error tracking.
 *
 * Captures window.onerror + unhandledrejection + React ErrorBoundary errors
 * and reports them (best-effort, fire-and-forget) to the backend intake
 * endpoint so they appear in the admin Error Tracker dashboard.
 *
 * Reporting is rate-limited client-side (burst + per-minute caps) to avoid
 * flooding the API with duplicate reports.
 */

const ENDPOINT = '/api/client-errors/report';
const BURST_CAP = 10; // max reports per flush window
const MIN_INTERVAL_MS = 5000; // min wall-clock gap between flushes

let enabled = false;
let burstCount = 0;
let lastFlushAt = 0;
const pending = [];

function sendReport(entry) {
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(entry),
      keepalive: true, // survive page unload
    }).catch(() => {
      /* best-effort: never let error tracking itself throw */
    });
  } catch {
    /* noop */
  }
}

function flush() {
  const now = Date.now();
  if (pending.length === 0) return;
  if (now - lastFlushAt < MIN_INTERVAL_MS) return;
  lastFlushAt = now;
  burstCount = 0;
  const batch = pending.splice(0, BURST_CAP);
  batch.forEach(sendReport);
}

/**
 * Public API — report an error from anywhere (ErrorBoundary, catch blocks).
 */
export function reportError({ message, stack, source = 'manual', url, component } = {}) {
  if (!enabled) return;
  if (!message) return;
  pending.push({
    message: String(message).slice(0, 500),
    stack: stack ? String(stack).slice(0, 4000) : undefined,
    source,
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
    component,
  });
  if (pending.length >= BURST_CAP) flush();
}

/** Init global listeners. Call once from the app entrypoint. */
export function initErrorTracking() {
  if (enabled) return;
  if (typeof window === 'undefined') return;
  enabled = true;

  window.addEventListener('error', (event) => {
    reportError({
      message: event.message || 'Uncaught window error',
      stack: event.error?.stack,
      source: 'window.onerror',
      url: event.filename,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError({
      message: reason?.message || String(reason || 'Unhandled promise rejection').slice(0, 200),
      stack: reason?.stack,
      source: 'unhandledrejection',
    });
  });

  // Periodic flush (interval keeps reports batching without spamming)
  setInterval(flush, MIN_INTERVAL_MS);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    window.addEventListener('pagehide', () => {
      // Final flush on unload via sendBeacon-equivalent fetch keepalive
      const now = Date.now();
      if (now - lastFlushAt < MIN_INTERVAL_MS) return;
      lastFlushAt = now;
      pending.splice(0, BURST_CAP).forEach(sendReport);
    });
  }
}

export const errorTracking = {
  init: initErrorTracking,
  report: reportError,
};

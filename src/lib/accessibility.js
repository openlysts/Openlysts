/**
 * accessibility.js — WCAG-AA preference engine.
 *
 * Maps the user's accessibility settings (stored via @/lib/settings) plus the
 * operating system's own preferences onto data-* attributes on <html>, which
 * index.css turns into real behavior:
 *
 *   data-font-size   "normal" | "large" | "xlarge"   (root rem scaling)
 *   data-motion      "full" | "reduced"              (animations/transitions)
 *   data-contrast    "high"                          (text/border contrast)
 *   data-focus       "strong"                        (focus-visible rings)
 *
 * `reducedMotion: 'system'` resolves against the live OS media query and
 * re-evaluates when the OS preference changes (e.g. iOS Low Motion toggled
 * while the app is open). Every change also re-dispatches so components that
 * gate heavy effects on the flag (three.js background, particle text…) can
 * react without re-reading settings themselves.
 */

const SYS_REDUCED = '(prefers-reduced-motion: reduce)';

function osPrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia(SYS_REDUCED).matches;
}

export function resolveMotionPreference(setting) {
  if (setting === 'reduced') return 'reduced';
  if (setting === 'full') return 'full';
  return osPrefersReducedMotion() ? 'reduced' : 'full'; // 'system'
}

/** Apply the current settings to <html> data attributes (idempotent). */
export function applyAccessibility(settings = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const font = settings.fontSize === 'large' || settings.fontSize === 'xlarge' ? settings.fontSize : 'normal';
  const motion = resolveMotionPreference(settings.reducedMotion);

  root.setAttribute('data-font-size', font);
  root.setAttribute('data-motion', motion);

  if (settings.highContrast) root.setAttribute('data-contrast', 'high');
  else root.removeAttribute('data-contrast');

  if (settings.strongFocus) root.setAttribute('data-focus', 'strong');
  else root.removeAttribute('data-focus');
}

/** True when the current preference says reduce motion (setting or OS).
 *  Components that drive motion in JS (canvas, framer-motion loops) should
 *  gate on this — the CSS kill-switch cannot stop them. */
export function prefersReduced(getSettings) {
  const s = (getSettings && getSettings()) || {};
  if (s.reducedMotion === 'full') return false;
  if (s.reducedMotion === 'reduced') return true;
  return osPrefersReducedMotion();
}

/** Boot hook for main.jsx: applies saved settings and keeps them live. */
export function initAccessibility(getSettings) {
  if (typeof window === 'undefined') return () => {};

  const apply = () => applyAccessibility(getSettings());
  apply();

  const onSettings = () => apply();
  const onOsMotion = (e) => {
    // Only 'system' follows the OS live; explicit reduced/full stay fixed.
    const s = getSettings();
    if (!s.reducedMotion || s.reducedMotion === 'system') apply();
  };

  window.addEventListener('settings-changed', onSettings);
  if (window.matchMedia) window.matchMedia(SYS_REDUCED).addEventListener?.('change', onOsMotion);

  return () => {
    window.removeEventListener('settings-changed', onSettings);
    window.matchMedia?.(SYS_REDUCED).removeEventListener?.('change', onOsMotion);
  };
}

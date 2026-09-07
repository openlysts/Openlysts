const STORAGE_KEY = 'openlyst_settings';

const DEFAULT_SETTINGS = {
  githubToken: '',
  resultsPerPage: 24,
  defaultSort: 'trending',
  autoExpandVideos: false,
  backgroundType: 'particles',
  // ── Accessibility (WCAG AA) ─────────────────────────────────────
  // 'normal' | 'large' | 'xlarge' — scales the root font so every rem-based
  // size in the app grows proportionally.
  fontSize: 'normal',
  // 'system' (follow the OS prefers-reduced-motion), 'reduced', or 'full'.
  reducedMotion: 'system',
  // High-contrast text/borders for low-vision users.
  highContrast: false,
  // Stronger :focus-visible rings for keyboard/screen-reader users.
  strongFocus: false,
};

export function getSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(partial) {
  const updated = { ...getSettings(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('settings-changed', { detail: updated }));
  return updated;
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('settings-changed', { detail: DEFAULT_SETTINGS }));
}
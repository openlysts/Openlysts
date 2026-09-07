const KEY = 'openlyst_bookmarks';

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function isBookmarked(id) {
  return getBookmarks().includes(id);
}

export function toggleBookmark(id) {
  const current = getBookmarks();
  const next = current.includes(id)
    ? current.filter((b) => b !== id)
    : [...current, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  return next.includes(id);
}

export function removeBookmark(id) {
  const next = getBookmarks().filter((b) => b !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('bookmarks-changed'));
}

export function clearBookmarks() {
  localStorage.setItem(KEY, '[]');
  window.dispatchEvent(new CustomEvent('bookmarks-changed'));
}

// ─── Account sync (logged-in users) ─────────────────────────────────
// The backend is the source of truth for a signed-in user's bookmarks.
// These helpers mirror local toggles to /api/profile/bookmarks/sync and
// pull the account list down on login, always best-effort (offline-safe).

export async function persistBookmarkToggle(id, nowBookmarked, authed) {
  if (!authed) return;
  try {
    await fetch('/api/profile/bookmarks/sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operations: [{ repoId: id, action: nowBookmarked ? 'add' : 'remove' }],
      }),
    });
  } catch (e) {
    /* offline / transient — local list still reflects the choice */
  }
}

export async function fetchAccountBookmarks() {
  try {
    const res = await fetch('/api/profile/bookmarks', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.bookmarks) ? data.bookmarks : null;
  } catch (e) {
    return null;
  }
}

export function mergeAccountBookmarkIds(ids) {
  if (!ids || ids.length === 0) return;
  const current = getBookmarks();
  const next = Array.from(new Set([...current, ...ids]));
  if (next.length === current.length) return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('bookmarks-changed'));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    }
  });
}

export function useBookmarkCount() {
  // Re-render hook helper — components subscribe to the custom event
  return getBookmarks().length;
}
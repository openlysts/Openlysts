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
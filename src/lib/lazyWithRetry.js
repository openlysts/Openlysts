/**
 * Enhanced dynamic import wrapper that handles stale chunk deployments.
 * If a deployment happens and old chunks are missing, it automatically refreshes
 * the page once to pull the newest index.html and assets.
 * 
 * Note: We return the Promise directly instead of wrapping in React.lazy() 
 * so that Vite's React Fast Refresh (HMR) can statically analyze the lazy() call
 * in App.jsx.
 */
export function importWithRetry(componentImport) {
  const isRetried = window.sessionStorage.getItem('openlysts_chunk_retry') === 'true';

  return componentImport().then((module) => {
    window.sessionStorage.removeItem('openlysts_chunk_retry');
    return module;
  }).catch((error) => {
    console.warn('[LazyLoad] Dynamic import failed, checking for deployment update:', error?.message);

    if (!isRetried) {
      window.sessionStorage.setItem('openlysts_chunk_retry', 'true');
      // Force bypass browser cache to fetch newest index.html
      window.location.reload();
      return new Promise(() => {}); // Keep pending while reload happens
    }

    window.sessionStorage.removeItem('openlysts_chunk_retry');
    throw error;
  });
}

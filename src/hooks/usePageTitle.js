import { useEffect } from 'react';

export function usePageTitle(title) {
  const fullTitle = title ? `Openlysts — ${title}` : 'Openlysts — Discover Open-Source Projects';
  
  // Set title immediately on render for faster updates during navigation
  if (typeof document !== 'undefined' && document.title !== fullTitle) {
    document.title = fullTitle;
  }

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);
}

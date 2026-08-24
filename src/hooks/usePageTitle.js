import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `Openlysts — ${title}` : 'Openlysts — Discover Open-Source Projects';
  }, [title]);
}

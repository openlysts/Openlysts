import { useEffect } from 'react';

const DEFAULT_TITLE = 'Openlysts — Discover Open-Source Projects';
const DEFAULT_DESCRIPTION = 'Openlysts — Discover high-quality free and open-source GitHub repositories across AI, local models, developer tools, self-hosting, and 876+ SaaS alternatives.';

export function usePageTitle(title, description) {
  const fullTitle = title ? `Openlysts — ${title}` : DEFAULT_TITLE;
  const metaDesc = description || DEFAULT_DESCRIPTION;

  const updateMetaTags = () => {
    if (typeof document === 'undefined') return;

    // Document title
    if (document.title !== fullTitle) {
      document.title = fullTitle;
    }

    // Standard Meta Description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', metaDesc);

    // OpenGraph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDesc);

    // Twitter Title & Description
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', fullTitle);

    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', metaDesc);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && typeof window !== 'undefined') {
      canonical.setAttribute('href', window.location.origin + window.location.pathname);
    }
  };

  // Immediate synchronous execution on render
  updateMetaTags();

  useEffect(() => {
    updateMetaTags();
  }, [fullTitle, metaDesc]);
}

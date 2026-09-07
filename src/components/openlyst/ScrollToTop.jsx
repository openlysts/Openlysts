import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component ensures that navigating to any page
 * immediately resets the viewport to the top (0,0) or scrolls to the target anchor hash.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If an anchor hash exists (e.g. #faq), scroll to that element smoothly
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', '')) || document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }

    // Immediate scroll reset
    window.scrollTo(0, 0);

    // Single deferred fallback after framer-motion transitions complete
    const fallback = setTimeout(() => {
      window.scrollTo(0, 0);
      const mainContent = document.getElementById('main-content');
      if (mainContent && mainContent.scrollTop > 0) {
        mainContent.scrollTop = 0;
      }
    }, 100);

    return () => clearTimeout(fallback);
  }, [pathname, search, hash]);

  return null;
}

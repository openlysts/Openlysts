import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component ensures that navigating to any page (especially from the footer)
 * immediately and smoothly resets the viewport to the top (0,0) or scrolls to the target anchor hash.
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
          return;
        }
      }, 50);
    }

    // Default: Reset scroll position to top instantly on route change
    // Using instant prevents visual jitter of the new page rendering at previous scroll offset
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // Fallback for browsers or container scrolling
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent.scrollTop > 0) {
      mainContent.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
}

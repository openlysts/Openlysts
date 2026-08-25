import { useState, useEffect } from 'react';

/**
 * @returns {[string, (newView: string) => void]}
 */
export function useViewMode() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('openlyst_view') || 'grid';
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('openlyst_view');
      if (stored && stored !== view) {
        setView(stored);
      }
    };
    
    // Add custom event listener for same-window updates
    window.addEventListener('openlyst_view_change', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('openlyst_view_change', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [view]);

  const toggleView = (newView) => {
    setView(newView);
    localStorage.setItem('openlyst_view', newView);
    window.dispatchEvent(new Event('openlyst_view_change'));
  };

  return [view, toggleView];
}

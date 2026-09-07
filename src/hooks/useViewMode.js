import { useState } from 'react';

/**
 * Hook to manage view mode. 
 * Note: List view has been disabled. This now always returns 'grid'.
 * @returns {[string, (newView: string) => void]}
 */
export function useViewMode() {
  const [view] = useState('grid');
  
  const toggleView = () => {};

  return [view, toggleView];
}

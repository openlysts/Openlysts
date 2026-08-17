import { createContext, useContext, useState, useEffect } from 'react';

const MobileLayoutContext = createContext();

export function MobileLayoutProvider({ children }) {
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    return localStorage.getItem('openlyst_mobile_layout') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('openlyst_mobile_layout', isMobileLayout);
  }, [isMobileLayout]);

  const toggleMobileLayout = () => {
    setIsMobileLayout(prev => !prev);
  };

  return (
    <MobileLayoutContext.Provider value={{ isMobileLayout, toggleMobileLayout }}>
      {children}
    </MobileLayoutContext.Provider>
  );
}

export function useMobileLayout() {
  return useContext(MobileLayoutContext);
}

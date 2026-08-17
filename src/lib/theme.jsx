import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'light', label: 'Light', icon: 'Sun' },
  { id: 'dark', label: 'Dark', icon: 'Moon' },
  { id: 'slate', label: 'Slate', icon: 'Cloud' },
  { id: 'creme', label: 'Creme', icon: 'Coffee' },
  { id: 'dracula', label: 'Dracula', icon: 'Ghost' },
  { id: 'ocean', label: 'Ocean', icon: 'Waves' },
  { id: 'forest', label: 'Forest', icon: 'Trees' },
  { id: 'royal', label: 'Royal', icon: 'Crown' },
  { id: 'sand', label: 'Sand', icon: 'Sunset' },
  { id: 'mint', label: 'Mint', icon: 'Leaf' },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('openlyst_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = ['dark', 'slate', 'dracula', 'ocean', 'forest'].includes(theme);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('openlyst_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
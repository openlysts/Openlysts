import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, LayoutGrid, TrendingUp, Bookmark, Scale, CornerDownLeft } from 'lucide-react';

const STATIC_ACTIONS = [
  { id: 'home', label: 'Go to Home', icon: Home, path: '/' },
  { id: 'alts', label: 'Browse Alternatives', icon: LayoutGrid, path: '/alternatives' },
  { id: 'trending', label: 'View Trending', icon: TrendingUp, path: '/trending' },
  { id: 'bookmarks', label: 'My Bookmarks', icon: Bookmark, path: '/bookmarks' },
  { id: 'compare', label: 'Compare Tools', icon: Scale, path: '/compare' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      
      if (e.key === 'Tab') {
        const modal = document.getElementById('command-palette-dialog');
        if (!modal) return;
        
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === document.body) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement || document.activeElement === document.body) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    const handleOpenCommand = () => setIsOpen(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenCommand);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenCommand);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      if (previousFocusRef.current) {
        setTimeout(() => previousFocusRef.current?.focus(), 0);
      }
    }
  }, [isOpen]);

  const filteredActions = search.trim() === '' 
    ? STATIC_ACTIONS 
    : STATIC_ACTIONS.filter(action => action.label.toLowerCase().includes(search.toLowerCase()));

  // Add the search fallback action if there's a search term
  if (search.trim() !== '') {
    filteredActions.push({
      id: 'search_query',
      label: `Search for "${search}"...`,
      icon: Search,
      isSearch: true,
      query: search
    });
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleExecute = (action) => {
    setIsOpen(false);
    if (action.isSearch) {
      navigate(`/search?q=${encodeURIComponent(action.query)}`);
    } else if (action.path) {
      navigate(action.path);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        handleExecute(filteredActions[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="command-palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette" className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative w-full max-w-2xl bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-border/50 bg-bg-subtle/30">
              <Search className="w-5 h-5 text-text-muted mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none text-text focus:outline-none focus:ring-0 text-lg placeholder-text-muted"
                autoComplete="off"
                spellCheck="false"
              />
              <div className="flex gap-1 ml-3 flex-shrink-0 border border-border px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted bg-bg shadow-sm">
                ESC
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredActions.map((action, idx) => {
                const Icon = action.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleExecute(action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isSelected ? 'bg-accent/10 text-accent' : 'text-text hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-text-muted'}`} />
                      <span className="font-medium text-sm">{action.label}</span>
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="w-4 h-4 text-accent/70" />
                    )}
                  </button>
                );
              })}
              {filteredActions.length === 0 && (
                <div className="py-8 text-center text-text-muted text-sm">
                  No commands found.
                </div>
              )}
            </div>

            <div className="bg-bg-subtle border-t border-border/50 px-4 py-2 flex items-center gap-4 text-[11px] text-text-muted font-medium">
              <span className="flex items-center gap-1"><kbd className="font-mono bg-bg border border-border px-1 rounded shadow-sm">↑</kbd> <kbd className="font-mono bg-bg border border-border px-1 rounded shadow-sm">↓</kbd> to navigate</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-bg border border-border px-1 rounded shadow-sm">↵</kbd> to select</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

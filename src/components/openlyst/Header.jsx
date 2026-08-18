import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bookmark, Menu, X, Settings as SettingsIcon, Smartphone, Monitor, Search, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';
import { useMobileLayout } from '@/lib/MobileLayoutContext';
import CommandPalette from './CommandPalette';

const NAV = [
{ to: '/discover', label: 'Discover' },
{ to: '/alternatives', label: 'Alternatives' },
{ to: '/trending', label: 'Trending' },
{ to: '/bookmarks', label: 'Bookmarks' },
{ to: '/about', label: 'About' },
{ to: '/contact', label: 'Contact' }];

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const { isMobileLayout, toggleMobileLayout } = useMobileLayout();

  useEffect(() => {
    setBookmarkCount(getBookmarks().length);
    const onUpdate = () => setBookmarkCount(getBookmarks().length);
    window.addEventListener('bookmarks-changed', onUpdate);
    return () => window.removeEventListener('bookmarks-changed', onUpdate);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header role="banner" className="sticky top-0 z-40 backdrop-blur-xl bg-bg/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/discover" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="Openlysts Home">
            <div className="relative w-11 h-11 rounded-lg bg-white shadow-sm overflow-hidden flex items-center justify-center [perspective:1000px]">
              <img src="/logo.png" alt="" className="w-10 h-10 object-contain animate-logo-enter" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-text hidden sm:block bg-gradient-to-r from-text to-text-secondary bg-clip-text">Openlysts</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text hover:bg-bg-hover'}`
                  }>
                  
                  {item.label}
                </Link>);

            })}
          </nav>

          {/* Search (desktop) */}
          {location.pathname !== '/discover' && (
            <div 
              className="relative hidden md:block w-64 group cursor-text"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
              <div className="w-full bg-bg-subtle border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-muted flex items-center justify-between transition-colors group-hover:border-accent/50 group-hover:bg-bg-hover">
                <span>Search openlysts...</span>
                <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] bg-bg border border-border px-1.5 py-0.5 rounded text-text-muted font-medium">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Innovative Welcome Button */}
            <Link 
              to="/" 
              className="relative group flex items-center justify-center p-2 rounded-lg bg-gradient-to-br from-bg-subtle to-bg border border-border hover:border-accent/50 overflow-hidden transition-all duration-500 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
              aria-label="Warp to Welcome Screen"
              title="Welcome Screen"
            >
              <div className="absolute inset-0 bg-accent/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Sparkles className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors relative z-10" />
            </Link>

            <Link to="/bookmarks" className="relative p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors" aria-label="View Bookmarks">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 &&
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-fg text-[10px] font-semibold flex items-center justify-center">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              }
            </Link>
            <Link to="/settings" className="p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors" aria-label="Settings">
              <SettingsIcon className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleMobileLayout}
              className="p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors"
              title={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
              aria-label={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
            >
              {isMobileLayout ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-hover"
              aria-expanded={mobileOpen}
              aria-label="Toggle Navigation Menu">
              
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen &&
        <div className="md:hidden pb-4 space-y-3">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:bg-bg-hover'}`
                  }>
                  
                    {item.label}
                  </Link>);

            })}
            </nav>
          </div>
        }
      </div>
      <CommandPalette />
    </header>);

}
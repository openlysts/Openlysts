import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bookmark, Menu, X, Settings as SettingsIcon, Smartphone, Monitor, Search, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';
import { useMobileLayout } from '@/lib/MobileLayoutContext';
import CommandPalette from './CommandPalette';
import { useAuth } from '@/lib/AuthContext';
import { useLogoEasterEgg } from '@/hooks/useLogoEasterEgg';
import MagneticButton from '@/components/ui/MagneticButton';

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
  const { user } = useAuth();
  const triggerConfetti = useLogoEasterEgg();

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
    <header role="banner" className="sticky top-0 z-40 backdrop-blur-2xl bg-bg/90 border-b border-border shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/discover" onClick={triggerConfetti} className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="Openlysts Home">
            <div className="relative w-10 h-10 rounded-xl bg-bg-card border border-border shadow-sm overflow-hidden flex items-center justify-center backdrop-blur-md group-hover:scale-105 group-hover:border-accent/40 transition-all duration-300">
              <img src="/logo.png" alt="" className="w-8 h-8 object-contain animate-logo-enter filter drop-shadow-sm" />
            </div>
            <span className="text-xl font-black tracking-tight text-text hidden sm:block">Openlysts</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-1.5 text-sm transition-all duration-200 whitespace-nowrap ${
                  active ? 'text-text font-bold' : 'text-text-secondary hover:text-text font-medium'}`
                  }>
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(var(--accent-rgb),0.5)]" />
                  )}
                  {item.label}
                </Link>);

            })}
          </nav>

          {/* Search (desktop) */}
          {location.pathname !== '/discover' && (
            <div 
              className="relative hidden md:block w-44 lg:w-60 xl:w-72 group cursor-text flex-shrink"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
              <div className="w-full bg-bg-subtle border border-border rounded-xl pl-9 pr-3 py-1.5 text-sm text-text-secondary flex items-center justify-between transition-colors group-hover:border-accent/50 group-hover:bg-bg-hover">
                <span className="truncate whitespace-nowrap text-xs sm:text-sm font-medium">Search openlysts...</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 font-mono text-[10px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-secondary font-semibold ml-2 flex-shrink-0">
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
              className="relative group hidden sm:flex items-center justify-center p-2 rounded-lg bg-gradient-to-br from-bg-subtle to-bg border border-border hover:border-accent/50 overflow-hidden transition-all duration-500 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
              aria-label="Warp to Welcome Screen"
              title="Welcome Screen"
            >
              <div className="absolute inset-0 bg-accent/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Sparkles className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors relative z-10" />
            </Link>

            <Link to="/bookmarks" className="relative hidden sm:flex p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors" aria-label="View Bookmarks">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 &&
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-fg text-[10px] font-semibold flex items-center justify-center">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              }
            </Link>
            <Link to="/settings" className="hidden sm:flex p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors" aria-label="Settings">
              <SettingsIcon className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleMobileLayout}
              className="p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors hidden md:block"
              title={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
              aria-label={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
            >
              {isMobileLayout ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
            <ThemeToggle />
            
            {/* Auth Buttons */}
            {user ? (
              <Link to="/profile" className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm hover:bg-accent/30 transition-colors" title="Profile">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1 pl-1 sm:pl-3 border-l border-border/50">
                <Link to="/login" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text transition-colors">Log in</Link>
                <MagneticButton>
                  <Link to="/register" className="text-xs sm:text-sm font-medium bg-accent text-accent-fg px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-accent/90 transition-colors shadow-sm block">Sign up</Link>
                </MagneticButton>
              </div>
            )}

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
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === '/settings' ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:bg-bg-hover'}`
                }>
                Settings
              </Link>
              {!user ? (
                <>
                  <div className="h-px bg-border/50 my-2" />
                  <Link to="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover">Log in</Link>
                  <Link to="/register" className="px-3 py-2 rounded-lg text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20">Sign up</Link>
                </>
              ) : (
                <>
                  <div className="h-px bg-border/50 my-2" />
                  <Link to="/profile" className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover">Profile</Link>
                </>
              )}
            </nav>
          </div>
        }
      </div>
      <CommandPalette />
    </header>);

}
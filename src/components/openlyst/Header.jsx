import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Menu, X, Settings as SettingsIcon, Smartphone, Monitor, Search, Sparkles, RefreshCw, TrendingUp, Layers, HelpCircle, Mail, LogIn, UserPlus, Compass } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';
import { useMobileLayout } from '@/lib/MobileLayoutContext';
import { useAuth } from '@/lib/AuthContext';
import { useLogoEasterEgg } from '@/hooks/useLogoEasterEgg';
import MagneticButton from '@/components/ui/MagneticButton';
import PWAInstallButton from './PWAInstallButton';

const PRIMARY_NAV = [
  { to: '/discover', label: 'Discover', icon: Sparkles },
  { to: '/alternatives', label: 'Alternatives', icon: RefreshCw },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/compare', label: 'Compare', icon: Layers },
  { to: '/guide', label: 'Guide', icon: Compass },
];

const SECONDARY_NAV = [
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/about', label: 'About', icon: HelpCircle },
  { to: '/contact', label: 'Contact', icon: Mail },
];

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
    window.addEventListener('openlyst_bookmarks_updated', onUpdate);
    return () => {
      window.removeEventListener('bookmarks-changed', onUpdate);
      window.removeEventListener('openlyst_bookmarks_updated', onUpdate);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll safely when mobile navigation drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const closeDrawer = () => {
    setMobileOpen(false);
  };

  return (
    <header role="banner" className="sticky top-0 z-40 backdrop-blur-2xl bg-bg/90 border-b border-border shadow-xs transition-colors pt-safe w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4 w-full min-w-0">
          
          {/* Left Group: Logo + Navigation Links */}
          <div className="flex items-center gap-3 xl:gap-6 flex-shrink-0">
            {/* Logo */}
            <Link data-tour="easter-eggs" to="/discover" onClick={triggerConfetti} className="flex items-center gap-2 flex-shrink-0 group touch-target" aria-label="Openlysts Home">
              <div className="relative w-9 h-9 rounded-xl bg-bg-card border border-border shadow-xs overflow-hidden flex items-center justify-center backdrop-blur-md group-hover:scale-105 group-hover:border-accent/40 transition-all duration-300">
                <img src="/logo.png" alt="Openlysts Logo" className="w-7 h-7 object-contain animate-logo-enter filter drop-shadow-xs" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-text hidden sm:block">Openlysts</span>
            </Link>

            {/* Desktop Nav (Core 5 product links on >= 1280px) */}
            <nav className="hidden xl:flex items-center gap-1 flex-shrink-0">
              {PRIMARY_NAV.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative px-3 py-1.5 text-xs xl:text-sm transition-all duration-200 whitespace-nowrap rounded-lg ${
                      active ? 'text-text font-bold' : 'text-text-secondary hover:text-text hover:bg-bg-hover/60 font-medium'
                    }`}
                  >
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--accent-rgb),0.5)]" />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Group: Harmonized Action Icons Cluster & Auth */}
          <div data-tour="auth-menu" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Search Trigger Button (Desktop >= 1536px) */}
            {location.pathname !== '/discover' && (
              <div 
                data-tour="search-bar"
                className="relative hidden 2xl:block w-36 group cursor-text flex-shrink-0"
                onClick={openSearch}
              >
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                <div className="w-full h-9 bg-bg-card/70 border border-border/70 rounded-xl pl-8 pr-2 py-1.5 text-xs text-text-secondary flex items-center justify-between transition-colors group-hover:border-accent/40 group-hover:bg-bg-hover shadow-xs">
                  <span className="truncate whitespace-nowrap font-medium">Search...</span>
                  <kbd className="inline-flex items-center gap-0.5 font-mono text-[9px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-secondary font-semibold ml-1.5 flex-shrink-0">
                    <span>⌘</span>K
                  </kbd>
                </div>
              </div>
            )}

            {/* Quick Search trigger icon for screens < 2xl */}
            {location.pathname !== '/discover' && (
              <button
                onClick={openSearch}
                className="2xl:hidden w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:border-accent/40 hover:text-text transition-all shadow-xs touch-target flex-shrink-0"
                aria-label="Open Search"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Welcome Screen Warp Button */}
            <Link 
              to="/" 
              className="relative group hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-accent transition-all shadow-xs touch-target flex-shrink-0"
              aria-label="Warp to Welcome Screen"
              title="Welcome Screen"
            >
              <Sparkles className="w-4 h-4" />
            </Link>

            {/* Bookmarks Icon Button (Desktop/Tablet) */}
            <Link 
              to="/bookmarks" 
              className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-text transition-all shadow-xs touch-target flex-shrink-0" 
              aria-label="View Bookmarks"
              title="Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-fg text-[9px] font-black flex items-center justify-center shadow-xs">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link 
              to="/settings" 
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-text transition-all shadow-xs touch-target flex-shrink-0" 
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            {/* PWA Install Button (Mobile, Tablet & Desktop) */}
            <PWAInstallButton className="flex" />

            {/* Mobile Layout Simulator Toggle (Desktop only) */}
            <button
              onClick={toggleMobileLayout}
              className="hidden xl:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-text transition-all shadow-xs touch-target flex-shrink-0"
              title={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
              aria-label={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
            >
              {isMobileLayout ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Auth Buttons */}
            {user ? (
              <Link to="/profile" className="ml-1 flex items-center justify-center w-9 h-9 rounded-full bg-accent/20 text-accent font-bold text-xs sm:text-sm hover:bg-accent/30 transition-colors touch-target flex-shrink-0 border border-accent/30" title="Profile">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 ml-1 pl-2 border-l border-border/70 flex-shrink-0">
                <Link to="/login" className="h-9 px-2.5 flex items-center justify-center text-xs sm:text-sm font-medium text-text-secondary hover:text-text transition-colors rounded-xl whitespace-nowrap">
                  Log in
                </Link>
                <MagneticButton>
                  <Link to="/register" className="h-9 px-3.5 flex items-center justify-center text-xs sm:text-sm font-semibold bg-accent text-accent-fg rounded-xl hover:bg-accent/90 transition-colors shadow-xs whitespace-nowrap">
                    Sign up
                  </Link>
                </MagneticButton>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="xl:hidden w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:text-text flex items-center justify-center text-text-secondary transition-all shadow-xs touch-target flex-shrink-0 ml-0.5"
              aria-expanded={mobileOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-accent" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-[100] xl:hidden pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={closeDrawer}
                className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
                aria-hidden="true"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-[300px] sm:max-w-xs bg-bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden pt-safe pb-safe z-10"
              >
                {/* Drawer Header */}
                <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-bg-subtle/50 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center shadow-xs">
                      <img src="/logo.png" alt="Openlysts Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="font-bold text-base text-text tracking-tight">Openlysts</span>
                  </div>

                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="w-9 h-9 rounded-xl bg-bg border border-border text-text-secondary hover:text-text hover:bg-bg-hover active:scale-95 flex items-center justify-center transition-all cursor-pointer z-50 shadow-xs"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar touch-scroll">
                  {/* Primary Nav Links */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-1.5">
                      Navigation
                    </p>
                    {ALL_NAV.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={closeDrawer}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            active
                              ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                              : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {item.to === '/bookmarks' && bookmarkCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-soft text-accent">
                              {bookmarkCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* PWA Install Button in Drawer */}
                  <div className="pt-1">
                    <PWAInstallButton variant="drawer" />
                  </div>
                </div>

                {/* Drawer Footer Auth Section */}
                <div className="p-4 border-t border-border bg-bg-subtle/30 flex-shrink-0 space-y-2">
                  {user ? (
                    <div className="flex items-center gap-3 px-2 py-1.5">
                      <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text truncate">{user.name || 'User'}</p>
                        <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={closeDrawer}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-bg text-xs font-semibold text-text hover:bg-bg-hover transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Log in</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeDrawer}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Sign up</span>
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
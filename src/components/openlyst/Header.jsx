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

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

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
        <div className="flex items-center justify-between h-16 gap-4 w-full min-w-0">
          {/* Left Group: Logo + Navigation Links */}
          <div className="flex items-center gap-4 xl:gap-6 flex-shrink-0">
            {/* Logo */}
            <Link data-tour="easter-eggs" to="/discover" onClick={triggerConfetti} className="flex items-center gap-2 flex-shrink-0 group touch-target" aria-label="Openlysts Home">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-card border border-border shadow-xs overflow-hidden flex items-center justify-center backdrop-blur-md group-hover:scale-105 group-hover:border-accent/40 transition-all duration-300">
                <img src="/logo.png" alt="Openlysts Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain animate-logo-enter filter drop-shadow-xs" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-text hidden sm:block">Openlysts</span>
            </Link>

            {/* Desktop Nav (Core 5 product links on >= 1024px) */}
            <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {PRIMARY_NAV.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm transition-all duration-200 whitespace-nowrap rounded-lg ${
                      active ? 'text-text font-bold' : 'text-text-secondary hover:text-text hover:bg-bg-hover/60 font-medium'
                    }`}
                  >
                    {active && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 xl:left-3 xl:right-3 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--accent-rgb),0.5)]" />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Group: Search Box + Toolbar Actions + Auth */}
          <div data-tour="auth-menu" className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search Trigger Button (Desktop >= 1536px) */}
            {location.pathname !== '/discover' && (
              <div 
                data-tour="search-bar"
                className="relative hidden 2xl:block w-40 group cursor-text flex-shrink-0"
                onClick={openSearch}
              >
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                <div className="w-full bg-bg-subtle/80 border border-border rounded-xl pl-8 pr-2 py-1.5 text-xs text-text-secondary flex items-center justify-between transition-colors group-hover:border-accent/50 group-hover:bg-bg-hover">
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
                className="2xl:hidden p-2 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text transition-colors touch-target"
                aria-label="Open Search"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Welcome Screen Warp Button */}
            <Link 
              to="/" 
              className="relative group hidden sm:flex items-center justify-center p-2 rounded-xl bg-bg-subtle/70 border border-border hover:border-accent/50 overflow-hidden transition-all duration-300 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.25)] touch-target"
              aria-label="Warp to Welcome Screen"
              title="Welcome Screen"
            >
              <Sparkles className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors relative z-10" />
            </Link>

            {/* Bookmarks Icon Button (Desktop/Tablet) */}
            <Link to="/bookmarks" className="relative hidden sm:flex p-2 rounded-xl text-text-secondary hover:bg-bg-hover transition-colors touch-target" aria-label="View Bookmarks">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-fg text-[9px] font-black flex items-center justify-center shadow-xs">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link to="/settings" className="hidden sm:flex p-2 rounded-xl text-text-secondary hover:bg-bg-hover transition-colors touch-target" aria-label="Settings">
              <SettingsIcon className="w-4 h-4" />
            </Link>

            {/* PWA Install Button (Mobile, Tablet & Desktop) */}
            <PWAInstallButton className="flex" />

            {/* Mobile Layout Simulator Toggle (Desktop only) */}
            <button
              onClick={toggleMobileLayout}
              className="p-2 rounded-xl text-text-secondary hover:bg-bg-hover transition-colors hidden xl:block touch-target"
              title={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
              aria-label={isMobileLayout ? "Switch to Desktop Layout" : "Switch to Mobile Layout"}
            >
              {isMobileLayout ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Auth Buttons */}
            {user ? (
              <Link to="/profile" className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-xs sm:text-sm hover:bg-accent/30 transition-colors touch-target flex-shrink-0" title="Profile">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 ml-1 pl-1.5 border-l border-border/50 flex-shrink-0">
                <Link to="/login" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text transition-colors px-2 py-1.5 rounded-lg whitespace-nowrap">Log in</Link>
                <MagneticButton>
                  <Link to="/register" className="text-xs sm:text-sm font-semibold bg-accent text-accent-fg px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors shadow-xs block whitespace-nowrap">Sign up</Link>
                </MagneticButton>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text transition-colors touch-target flex-shrink-0 ml-0.5"
              aria-expanded={mobileOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-accent" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-[100] lg:hidden pointer-events-auto">
              {/* Backdrop — onClick only, no onPointerDown to avoid double-fire */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={closeDrawer}
                className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
                aria-hidden="true"
              />

              {/* Drawer Container — NO drag prop (drag was capturing all touch events on children) */}
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

                  {/* Close (X) Button — onClick only, no onPointerDown */}
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="w-9 h-9 rounded-xl bg-bg border border-border text-text-secondary hover:text-text hover:bg-bg-hover active:scale-95 flex items-center justify-center transition-all cursor-pointer z-50 shadow-xs"
                    aria-label="Close navigation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Navigation Links — no onClick on links (location.pathname useEffect closes drawer on nav) */}
                <div className="px-3 py-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar touch-scroll">
                  <div className="px-2 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Explore
                  </div>
                  {PRIMARY_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text active:bg-bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-accent-fg' : 'text-accent'}`} />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}

                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Community & Tools
                  </div>
                  {SECONDARY_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text active:bg-bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-accent-fg' : 'text-text-muted'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.to === '/bookmarks' && bookmarkCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-black/20 text-white' : 'bg-accent/15 text-accent'}`}>
                            {bookmarkCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  <div className="h-px bg-border/60 my-2" />

                  {/* PWA Install in Mobile Drawer */}
                  <PWAInstallButton variant="drawer" className="mb-1.5" />

                  <Link
                    to="/settings"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === '/settings' ? 'bg-accent text-accent-fg font-semibold shadow-xs' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                    }`}
                  >
                    <SettingsIcon className="w-4 h-4 text-text-muted" />
                    <span>Settings</span>
                  </Link>

                  <Link
                    to="/"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Welcome Screen</span>
                  </Link>
                </div>

                {/* Drawer Auth Footer */}
                <div className="p-3 border-t border-border bg-bg-subtle/50 space-y-2 flex-shrink-0">
                  {user ? (
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg border border-border text-text text-sm font-semibold hover:border-accent/40 transition-all shadow-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <span className="truncate flex-1">{user.name || user.email || 'My Profile'}</span>
                    </Link>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-bg border border-border text-text text-xs sm:text-sm font-semibold hover:bg-bg-hover transition-all shadow-xs"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Log In
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-fg text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-all shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Sign Up
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
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Menu, X, Settings as SettingsIcon, Smartphone, Monitor, Search, Sparkles, RefreshCw, TrendingUp, Layers, HelpCircle, Mail, LogIn, UserPlus } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';
import { useMobileLayout } from '@/lib/MobileLayoutContext';
import { useAuth } from '@/lib/AuthContext';
import { useLogoEasterEgg } from '@/hooks/useLogoEasterEgg';
import MagneticButton from '@/components/ui/MagneticButton';

import PWAInstallButton from './PWAInstallButton';

const NAV = [
  { to: '/discover', label: 'Discover', icon: Sparkles },
  { to: '/alternatives', label: 'Alternatives', icon: RefreshCw },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/compare', label: 'Compare', icon: Layers },
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

  // Lock body scroll when mobile navigation drawer is open and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <header role="banner" className="sticky top-0 z-40 backdrop-blur-2xl bg-bg/90 border-b border-border shadow-sm transition-colors pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link data-tour="easter-eggs" to="/discover" onClick={triggerConfetti} className="flex items-center gap-2 flex-shrink-0 group touch-target" aria-label="Openlysts Home">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-card border border-border shadow-sm overflow-hidden flex items-center justify-center backdrop-blur-md group-hover:scale-105 group-hover:border-accent/40 transition-all duration-300">
              <img src="/logo.png" alt="Openlysts Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain animate-logo-enter filter drop-shadow-sm" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-text hidden sm:block">Openlysts</span>
          </Link>

          {/* Desktop nav (visible on xl: >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-1.5 text-sm transition-all duration-200 whitespace-nowrap ${
                    active ? 'text-text font-bold' : 'text-text-secondary hover:text-text font-medium'
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(var(--accent-rgb),0.5)]" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Button (Desktop) */}
          {location.pathname !== '/discover' && (
            <div 
              data-tour="search-bar"
              className="relative hidden xl:block w-48 2xl:w-64 group cursor-text flex-shrink"
              onClick={openSearch}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
              <div className="w-full bg-bg-subtle border border-border rounded-xl pl-9 pr-3 py-1.5 text-sm text-text-secondary flex items-center justify-between transition-colors group-hover:border-accent/50 group-hover:bg-bg-hover">
                <span className="truncate whitespace-nowrap text-xs font-medium">Search openlysts...</span>
                <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-secondary font-semibold ml-2 flex-shrink-0">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div data-tour="auth-menu" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Search trigger icon for mobile/tablet */}
            <button
              onClick={openSearch}
              className="xl:hidden p-2.5 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text transition-colors touch-target"
              aria-label="Open Search"
              title="Search (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Welcome Screen Warp Button */}
            <Link 
              to="/" 
              className="relative group hidden sm:flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-bg-subtle to-bg border border-border hover:border-accent/50 overflow-hidden transition-all duration-500 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] touch-target"
              aria-label="Warp to Welcome Screen"
              title="Welcome Screen"
            >
              <div className="absolute inset-0 bg-accent/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Sparkles className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors relative z-10" />
            </Link>

            {/* Bookmarks Icon Button (Desktop/Tablet) */}
            <Link to="/bookmarks" className="relative hidden sm:flex p-2 rounded-xl text-text-secondary hover:bg-bg-hover transition-colors touch-target" aria-label="View Bookmarks">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-fg text-[10px] font-bold flex items-center justify-center">
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
              <Link to="/profile" className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm hover:bg-accent/30 transition-colors touch-target" title="Profile">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-border/50">
                <Link to="/login" className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text transition-colors">Log in</Link>
                <MagneticButton>
                  <Link to="/register" className="text-xs sm:text-sm font-medium bg-accent text-accent-fg px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors shadow-sm block">Sign up</Link>
                </MagneticButton>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="xl:hidden p-2 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text transition-colors touch-target"
              aria-expanded={mobileOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Slide-Over Mobile & Tablet Navigation Drawer via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-[100] lg:hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-bg-card border-l border-border flex flex-col shadow-2xl overflow-y-auto custom-scrollbar pt-safe pb-safe z-10"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center">
                      <img src="/logo.png" alt="Openlysts Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="font-bold text-base text-text">Openlysts</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors touch-target"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Navigation Links */}
                <div className="p-4 space-y-1 flex-1">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors touch-target ${
                          active
                            ? 'bg-accent text-accent-fg'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text active:bg-bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${active ? 'text-accent-fg' : 'text-text-muted'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.to === '/bookmarks' && bookmarkCount > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? 'bg-black/20 text-white' : 'bg-accent/10 text-accent'}`}>
                            {bookmarkCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  <div className="h-px bg-border/60 my-3" />

                  {/* PWA Install in Mobile Drawer */}
                  <PWAInstallButton variant="drawer" className="mb-2" />

                  <Link
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors touch-target ${
                      location.pathname === '/settings' ? 'bg-accent text-accent-fg' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                    }`}
                  >
                    <SettingsIcon className="w-4 h-4 text-text-muted" />
                    <span>Settings</span>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-hover hover:text-text transition-colors touch-target"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Welcome Screen</span>
                  </Link>
                </div>

                {/* Drawer Auth Footer */}
                <div className="p-4 border-t border-border bg-bg-subtle/40 space-y-2">
                  {user ? (
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text text-sm font-bold hover:border-accent/40 transition-colors touch-target"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <span className="truncate">{user.name || user.email || 'My Profile'}</span>
                    </Link>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-bg border border-border text-text text-sm font-bold hover:bg-bg-hover transition-colors touch-target"
                      >
                        <LogIn className="w-4 h-4" /> Log In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent/90 transition-colors shadow-sm touch-target"
                      >
                        <UserPlus className="w-4 h-4" /> Sign Up
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
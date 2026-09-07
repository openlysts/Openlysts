import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useModalFocus from '@/hooks/useModalFocus';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Menu, X, Settings as SettingsIcon, Search, Sparkles, RefreshCw, TrendingUp, Layers, HelpCircle, Mail, LogIn, UserPlus, Compass, FolderHeart, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';
import { useAuth } from '@/lib/AuthContext';
import { resolveAvatar } from '@/lib/avatars';
import { useLogoEasterEgg } from '@/hooks/useLogoEasterEgg';
import PWAInstallButton from './PWAInstallButton';

const PRIMARY_NAV = [
  { to: '/discover', label: 'Discover', icon: Sparkles },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/alternatives', label: 'Alternatives', icon: RefreshCw },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/compare', label: 'Compare', icon: Layers },
  { to: '/guide', label: 'Guide', icon: Compass },
  { to: '/about', label: 'Why Openlysts', icon: HelpCircle },
];


const SECONDARY_NAV = [
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

// Renders the user's saved avatar (custom URL → preset archetype → initial)
function UserAvatar({ user, size = 'w-9 h-9', textSize = 'text-xs sm:text-sm' }) {
  const avatar = resolveAvatar(user);
  if (avatar.type === 'url') {
    return (
      <img
        src={avatar.url}
        alt=""
        className={`${size} rounded-full object-cover border border-accent/30 bg-bg-card`}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  const Icon = avatar.preset.icon;
  return (
    <div className={`${size} rounded-full bg-gradient-to-tr ${avatar.preset.bg} flex items-center justify-center text-white border border-accent/30 shadow-xs`}>
      <Icon className="w-1/2 h-1/2" />
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const { user, isAdmin } = useAuth();
  const triggerConfetti = useLogoEasterEgg();
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Trap Tab inside the drawer + restore focus to the hamburger when it closes
  useModalFocus({
    active: mobileOpen,
    containerRef: drawerRef,
    restoreFocusRef: menuButtonRef,
    onClose: () => setMobileOpen(false),
  });

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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4 w-full min-w-0">
          
          {/* Left Group: Logo + Navigation Links */}
          <div className="flex items-center gap-3 xl:gap-4 2xl:gap-6 flex-shrink-0">
            {/* Logo with Fluid React Bits Micro-Physics */}
            <Link data-tour="easter-eggs" to="/discover" onClick={triggerConfetti} className="flex items-center gap-2 flex-shrink-0 group touch-target" aria-label="Openlysts Home">
              {/* tabIndex=-1: framer-motion makes whileTap divs keyboard-focusable; the logo Link is the real control */}
              <motion.div 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                className="relative w-9 h-9 rounded-xl bg-bg-card border border-border shadow-xs overflow-hidden flex items-center justify-center backdrop-blur-md group-hover:border-accent/40"
                tabIndex={-1}
              >
                <img src="/logo.png" alt="Openlysts Logo" className="w-7 h-7 object-contain filter drop-shadow-xs" />
              </motion.div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-text hidden sm:block">Openlysts</span>
            </Link>

            {/* Desktop Nav (Core 5 product links with Water-like Spring Glide) */}
            <nav className="hidden xl:flex items-center gap-1 flex-shrink-0">
              {PRIMARY_NAV.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <motion.div
                    key={item.to}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    tabIndex={-1}
                  >
                    <Link
                      to={item.to}
                      className={`relative px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-sm transition-colors whitespace-nowrap rounded-lg ${
                        active ? 'text-text font-bold' : 'text-text-secondary hover:text-text hover:bg-bg-hover/60 font-medium'
                      }`}
                    >
                      {active && (
                        <motion.span 
                          layoutId="header-active-nav-glow"
                          className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-t-full shadow-[0_-2px_8px_rgba(var(--accent-rgb),0.6)]" 
                        />
                      )}
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Right Group: Harmonized Action Icons Cluster & Auth */}
          <div data-tour="auth-menu" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Search Trigger Button (Desktop >= 1536px) — real button so keyboard users can open it */}
            {location.pathname !== '/discover' && (
              <motion.button
                type="button"
                data-tour="search-bar"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={openSearch}
                aria-label="Open search"
                className="relative hidden 2xl:block w-36 group cursor-pointer flex-shrink-0 bg-transparent border-0 p-0 text-left"
              >
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                <div className="w-full h-9 bg-bg-card/70 border border-border/70 rounded-xl pl-8 pr-2 py-1.5 text-xs text-text-secondary flex items-center justify-between transition-colors group-hover:border-accent/40 group-hover:bg-bg-hover shadow-xs">
                  <span className="truncate whitespace-nowrap font-medium">Search...</span>
                  <kbd className="inline-flex items-center gap-0.5 font-mono text-[9px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-secondary font-semibold ml-1.5 flex-shrink-0">
                    <span>⌘</span>K
                  </kbd>
                </div>
              </motion.button>
            )}

            {/* Quick Search trigger icon for screens < 2xl */}
            {location.pathname !== '/discover' && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                onClick={openSearch}
                className="2xl:hidden w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:border-accent/40 hover:text-text transition-all shadow-xs touch-target flex-shrink-0"
                aria-label="Open Search"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            )}

            {/* Welcome Screen Warp Button */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              tabIndex={-1}
            >
              <Link 
                to="/" 
                className="relative group hidden 2xl:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-accent transition-all shadow-xs touch-target flex-shrink-0"
                aria-label="Warp to Welcome Screen"
                title="Welcome Screen"
              >
                <Sparkles className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Bookmarks Icon Button (Desktop/Tablet) */}              <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              tabIndex={-1}
            >
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
            </motion.div>

            {/* Settings */}              <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              tabIndex={-1}
            >
              <Link 
                to="/settings"  
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-text transition-all shadow-xs touch-target flex-shrink-0" 
                aria-label="Settings"
                title="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* PWA Install Button (Mobile, Tablet & Desktop) */}
            <PWAInstallButton className="flex" />

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Auth Buttons */}
            {user ? (
              <>
                {isAdmin && (
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} tabIndex={-1}>
                    <Link to="/admin" className="flex items-center justify-center w-9 h-9 rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent transition-all shadow-xs touch-target flex-shrink-0" title="Admin Panel" aria-label="Admin Panel">
                      <ShieldCheck className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )}
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} tabIndex={-1}>
                  <Link to="/profile" className="ml-1 flex items-center justify-center touch-target flex-shrink-0" title="Profile">
                    <UserAvatar user={user} />
                  </Link>
                </motion.div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 ml-1 pl-2 border-l border-border/70 flex-shrink-0">
                <Link to="/login" className="h-9 px-2.5 flex items-center justify-center text-xs sm:text-sm font-medium text-text-secondary hover:text-text transition-colors rounded-xl whitespace-nowrap">
                  Log in
                </Link>
                {/* motion.div wrapper (not a <button>) keeps the magnetic feel without nesting an interactive <a> inside a <button>; tabIndex=-1 stops framer's whileTap auto-focus from adding a second tab stop */}
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                  tabIndex={-1}
                >
                  <Link to="/register" className="h-9 px-3.5 flex items-center justify-center text-xs sm:text-sm font-semibold bg-accent text-accent-fg rounded-xl hover:bg-accent/90 transition-colors shadow-xs whitespace-nowrap">
                    Sign up
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="xl:hidden w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:text-text flex items-center justify-center text-text-secondary transition-all shadow-xs touch-target flex-shrink-0 ml-0.5"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-accent" /> : <Menu className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div
              id="mobile-nav-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-0 z-[100] xl:hidden pointer-events-auto"
            >
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
                    <>
                      <div className="flex items-center gap-3 px-2 py-1.5">
                        <UserAvatar user={user} size="w-8 h-8" textSize="text-xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text truncate">{user.name || 'User'}</p>
                          <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={closeDrawer}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-accent/40 bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors touch-target"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </>
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
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, Bookmark, Github, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getBookmarks } from '@/lib/bookmarks';

const NAV = [
  { to: '/', label: 'Discover' },
  { to: '/categories', label: 'Categories' },
  { to: '/trending', label: 'Trending' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    setBookmarkCount(getBookmarks().length);
    const onUpdate = () => setBookmarkCount(getBookmarks().length);
    window.addEventListener('bookmarks-changed', onUpdate);
    return () => window.removeEventListener('bookmarks-changed', onUpdate);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Github className="w-5 h-5 text-accent-fg" />
            </div>
            <span className="text-lg font-bold tracking-tight text-text hidden sm:block">Openlyst</span>
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
                    active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text hover:bg-bg-hover'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search (desktop) */}
          <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search open-source projects..."
                className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/bookmarks" className="relative p-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors" aria-label="Bookmarks">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-fg text-[10px] font-semibold flex items-center justify-center">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-hover"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={submitSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search open-source projects..."
                  className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
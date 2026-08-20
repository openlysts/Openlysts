import { Link, useLocation } from 'react-router-dom';
import { Sparkles, RefreshCw, Search, TrendingUp, Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('openlyst_bookmarks') || '[]');
        setBookmarkCount(saved.length);
      } catch {
        setBookmarkCount(0);
      }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('openlyst_bookmarks_updated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('openlyst_bookmarks_updated', updateCount);
    };
  }, []);

  const NAV_ITEMS = [
    { to: '/discover', label: 'Discover', icon: Sparkles },
    { to: '/alternatives', label: 'Alternatives', icon: RefreshCw },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/trending', label: 'Trending', icon: TrendingUp },
    { to: '/bookmarks', label: 'Saved', icon: Bookmark, badge: bookmarkCount },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card/90 backdrop-blur-2xl border-t border-border/80 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.15)] transition-all duration-300"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to === '/discover' && location.pathname === '/');
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 touch-target ${
                isActive 
                  ? 'text-accent font-bold scale-105' 
                  : 'text-text-muted hover:text-text-secondary active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-fg text-[9px] font-black flex items-center justify-center shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-accent font-black' : 'text-text-muted font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-4 h-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

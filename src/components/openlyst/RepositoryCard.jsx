import { useNavigate, Link } from 'react-router-dom';
import { Star, GitFork, Bookmark, Flame, AlertCircle, GitCompare, ShieldCheck, Activity } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { getLanguageColor } from '@/lib/languageColors';
import { getDifficultyColor } from '@/lib/difficultyColors';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { useState } from 'react';
import { useCompare } from '@/lib/CompareContext';
import LicenseBadge from './LicenseBadge';
import RepoVideoLinks from './RepoVideoLinks';
import { CATEGORIES } from '@/lib/categories';

function formatStars(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function RepositoryCard({ repo, index = 0 }) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(repo?.id));
  const isTrending = (repo?.trending_score || 0) > 10;
  const isAuthority = (repo?.authority_score || 0) > 40;
  const isEngaged = (repo?.engagement_score || 0) > 60;
  const langColor = getLanguageColor(repo?.language);
  const navigate = useNavigate();

  const { selectedForCompare, toggleCompare } = useCompare();
  const isCompared = selectedForCompare.some(r => r.id === repo?.id);

  // Safe owner and name extraction
  const owner = (typeof repo?.owner === 'string' && repo.owner)
    ? repo.owner
    : (repo?.full_name?.includes('/') ? repo.full_name.split('/')[0] : (repo?.owner?.login || ''));
  const name = repo?.name
    ? repo.name
    : (repo?.full_name?.includes('/') ? repo.full_name.split('/')[1] : (repo?.full_name || ''));
  const repoUrl = (owner && name) ? `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}` : '/discover';

  // 3D Parallax logic for desktop
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  
  const rotateXRaw = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateYRaw = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  
  const rotateX = useTransform(rotateXRaw, (val) => `${Math.round(parseFloat(val))}deg`);
  const rotateY = useTransform(rotateYRaw, (val) => `${Math.round(parseFloat(val))}deg`);

  // Sparkle gradient position based on mouse
  const gradientX = useTransform(mouseXSpring, [-0.5, 0.5], [100, 0]);
  const gradientY = useTransform(mouseYSpring, [-0.5, 0.5], [100, 0]);
  const background = useMotionTemplate`radial-gradient(circle at ${gradientX}% ${gradientY}%, rgba(var(--accent-rgb, 100, 200, 100), 0.08) 0%, transparent 60%)`;

  const handleMouseMove = (e) => {
    // Only compute on devices with mouse hover
    if (window.matchMedia('(hover: hover)').matches) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = (mouseX / rect.width) - 0.5;
      const yPct = (mouseY / rect.height) - 0.5;
      x.set(xPct);
      y.set(yPct);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (repo?.id) {
      setBookmarked(toggleBookmark(repo.id));
    }
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking interactive child elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.no-card-nav')) {
      return;
    }
    if (owner && name) {
      navigate(repoUrl);
    }
  };

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (repo) {
      toggleCompare(repo);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className="h-full"
      style={{ perspective: 1000 }}
    >
      <motion.div 
        data-tour="repo-card"
        onClick={handleCardClick} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
        }}
        whileHover={{ 
          y: -6, 
          scale: 1.012,
          transition: { duration: 0.22, ease: [0.25, 1, 0.5, 1] } 
        }}
        whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
        className="card h-full flex flex-col justify-between p-4 relative rounded-xl border border-border bg-bg-card transition-[border-color,box-shadow,background-color] duration-200 hover:border-accent/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.18),0_0_24px_rgba(var(--accent-rgb),0.2)] cursor-pointer group touch-active overflow-hidden select-none"
      >
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{ background }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-between pointer-events-auto">
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {/* Trending badge */}
                {isTrending && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-trending/40 bg-trending/10 text-trending backdrop-blur-md w-fit shadow-[0_0_8px_rgba(255,100,50,0.3)] animate-pulse">
                    <Flame className="w-3 h-3" />
                    Trending
                  </div>
                )}
                {/* Authority badge */}
                {isAuthority && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-blue-500/40 bg-blue-500/10 text-blue-500 backdrop-blur-md w-fit shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                    <ShieldCheck className="w-3 h-3" />
                    Core
                  </div>
                )}
                {/* Engagement badge */}
                {isEngaged && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-green-500/40 bg-green-500/10 text-green-500 backdrop-blur-md w-fit shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                    <Activity className="w-3 h-3" />
                    Active
                  </div>
                )}
              </div>

              {/* Name + owner */}
              <Link 
                to={repoUrl}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-text text-[15px] leading-snug hover:text-accent transition-colors truncate block focus:outline-none focus:underline"
              >
                {name || repo?.name || 'Repository'}
              </Link>
              <p className="text-text-muted text-xs mt-0.5 truncate">{owner || repo?.owner}</p>
            </div>

            {/* Bookmark & Compare Actions */}
            <div className="flex items-center gap-1 z-20 flex-shrink-0 relative -top-1 -right-1">
              <button
                onClick={handleCompareClick}
                className={`p-2 rounded-xl transition-colors touch-target ${
                  isCompared ? 'text-accent bg-accent-soft' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle'
                }`}
                aria-label="Add to compare"
                title="Compare"
              >
                <GitCompare className="w-4 h-4" />
              </button>
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-xl transition-colors touch-target ${
                  bookmarked ? 'text-accent bg-accent-soft' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle'
                }`}
                aria-label="Bookmark"
                title="Bookmark"
              >
                <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
            {repo?.description || 'No description available.'}
          </p>

          {/* Difficulty and Categories */}
          <div className="flex flex-wrap gap-1.5 mb-2.5 no-card-nav" data-tour="repo-tags">
            {repo?.difficulty && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?difficulties=${repo.difficulty}`);
                }}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md border hover:opacity-80 transition-opacity shadow-sm ${getDifficultyColor(repo.difficulty)}`}
              >
                {repo.difficulty}
              </span>
            )}
            {(repo?.categories || []).slice(0, 2).map((cat) => {
              const slug = CATEGORIES.find(c => c.label === cat)?.slug || cat.toLowerCase().replace(/\s+/g, '-');
              return (
                <span
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/search?categories=${slug}`);
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-border/50 bg-bg-subtle/50 text-text-secondary backdrop-blur-md hover:bg-bg-hover transition-colors shadow-sm"
                >
                  {cat}
                </span>
              );
            })}
          </div>

          {/* Topics */}
          {(repo?.topics || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 no-card-nav">
              {(repo.topics || []).slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border border-border/30 bg-bg-card/50 text-text-muted backdrop-blur-md shadow-sm">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-text-muted mb-2.5 flex-wrap" data-tour="repo-stats">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {formatStars(repo?.stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {formatStars(repo?.forks)}
            </span>
            {repo?.language && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
                {repo.language}
              </span>
            )}
            <LicenseBadge repo={repo} />
          </div>

          {/* Footer: updated */}
          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border">
            <span className="text-[11px] text-text-muted">
              {repo?.archived && <AlertCircle className="w-3 h-3 inline mr-1 text-nonoss" />}
              {timeAgo(repo?.github_updated_at)}
            </span>
          </div>

          {/* Video explanation links */}
          <div className="no-card-nav" data-tour="repo-video">
            <RepoVideoLinks repo={repo} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
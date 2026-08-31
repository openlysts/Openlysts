import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, AlertCircle, GitCompare, ShieldCheck, Activity, Github, Globe, Flame, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { getLanguageColor } from '@/lib/languageColors';
import { getDifficultyColor } from '@/lib/difficultyColors';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { useState, useRef } from 'react';
import { useCompare } from '@/lib/CompareContext';
import LicenseBadge from './LicenseBadge';
import RepoVideoLinks from './RepoVideoLinks';
import ParticleExplosion from './ParticleExplosion';
import AnimateDigits from './AnimateDigits';
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

function formatTag(tag) {
  if (!tag) return '';
  return tag
    .replace(/---/g, ' / ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RepositoryCard({ repo, index = 0, view = 'grid', showTrendingBadge = true }) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(repo?.id));
  const cardRef = useRef(null);
  
  const isTrending = showTrendingBadge && (repo?.trending_score || 0) > 80;
  const isAuthority = (repo?.authority_score || 0) > 40;
  const isEngaged = (repo?.engagement_score || 0) > 60;
  const langColor = getLanguageColor(repo?.language);
  const navigate = useNavigate();

  const { selectedForCompare, toggleCompare } = useCompare();
  const isCompared = selectedForCompare.some(r => r.id === repo?.id);

  // Safe owner and name extraction
  const owner = (typeof repo?.owner === 'string' && repo.owner)
    ? repo.owner
    : (repo?.full_name?.includes('/') ? repo.full_name.split('/')[0] : (repo?.owner?.login || 'unknown'));
  const name = repo?.name
    ? repo.name
    : (repo?.full_name?.includes('/') ? repo.full_name.split('/')[1] : (repo?.full_name || ''));

  const isRealGit = repo?.html_url && (repo.html_url.includes('github.com') || repo.html_url.includes('gitlab.com') || repo.html_url.includes('bitbucket.org'));
  const isCatalogItem = (repo?.github_id != null) || (repo?.full_name?.includes('/'));
  const isOpenSourceProduct = !isRealGit && isCatalogItem;
  const isWebsite = !isRealGit && !isOpenSourceProduct;

  const repoUrl = (isOpenSourceProduct || isRealGit) 
    ? ((owner && name && owner !== 'unknown') ? `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}` : '/discover')
    : (repo?.html_url || `https://openalternative.co/${repo?.full_name || ''}`);

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
  const background = useMotionTemplate`radial-gradient(circle at ${gradientX}% ${gradientY}%, rgba(255, 255, 255, 0.6) 0%, rgba(var(--accent-rgb, 100, 200, 100), 0.15) 30%, transparent 70%)`;

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

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (repo) {
      toggleCompare(repo);
    }
  };

  const categoriesList = repo?.categories || [];
  const cleanTopics = (repo?.topics || [])
    .filter(t => !categoriesList.some(c => c.toLowerCase() === t.toLowerCase().replace(/[-_]/g, ' ')))
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className="h-full"
      style={{ perspective: 1000 }}
    >
      <motion.div 
        ref={cardRef}
        data-tour="repo-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className={`card card-hover h-full flex p-4 pt-4.5 relative rounded-xl border bg-bg-card transition-[border-color,box-shadow,background-color] duration-200 group touch-active overflow-hidden select-none ${isTrending ? 'border-trending/40 shadow-[0_0_15px_rgba(255,100,50,0.15)]' : 'border-border'} ${view === 'list' ? 'flex-col md:flex-row items-start gap-4 md:gap-6' : 'flex-col justify-between'}`}
      >
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 mix-blend-overlay"
          style={{ background }}
        />
        {isWebsite ? (
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" aria-label={`Visit ${repo?.name}`} />
        ) : (
          <Link to={repoUrl} className="absolute inset-0 z-10 cursor-pointer" aria-label={`View ${repo?.name}`} />
        )}
        <div className={`relative z-10 flex-1 flex pointer-events-none ${view === 'list' ? 'flex-col md:flex-row justify-between w-full gap-4 md:gap-0' : 'flex-col justify-between'}`}>
          <div className={view === 'list' ? 'flex-1 min-w-0 md:pr-6 flex flex-col' : 'w-full flex-1 flex flex-col justify-start'}>
            <div className={`flex justify-between items-start mb-1.5 gap-2 ${view === 'list' ? 'flex-col sm:flex-row' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2 pointer-events-auto">
                {isWebsite ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-purple-500/30 bg-purple-500/10 text-purple-500 backdrop-blur-md w-fit">
                    <Globe className="w-3 h-3" />
                    Website
                  </div>
                ) : isOpenSourceProduct ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 backdrop-blur-md w-fit shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <Sparkles className="w-3 h-3" />
                    Open Source
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border border-zinc-500/30 bg-zinc-500/10 text-text-secondary backdrop-blur-md w-fit">
                    <Github className="w-3 h-3" />
                    Git
                  </div>
                )}
                {isTrending && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-trending/40 bg-trending/10 text-trending backdrop-blur-md w-fit shadow-[0_0_8px_rgba(255,100,50,0.3)] animate-pulse">
                    <Flame className="w-3 h-3" />
                    Trending
                  </div>
                )}
                {isAuthority && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-blue-500/40 bg-blue-500/10 text-blue-500 backdrop-blur-md w-fit shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                    <ShieldCheck className="w-3 h-3" />
                    Core
                  </div>
                )}
                {isEngaged && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-green-500/40 bg-green-500/10 text-green-500 backdrop-blur-md w-fit shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                    <Activity className="w-3 h-3" />
                    Active
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-text text-[15px] leading-snug group-hover:text-accent transition-colors truncate block">
                {name || 'Project'}
              </h3>
              <p className="text-text-muted text-xs mt-0.5 truncate pointer-events-auto cursor-pointer hover:underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/search?q=${encodeURIComponent(owner)}`); }}>
                {owner}
              </p>
            </div>

            <div className={`flex items-center gap-2 z-20 flex-shrink-0 relative top-0 right-0 pointer-events-auto ${view === 'list' ? 'flex md:hidden' : ''}`}>
                <button
                  onClick={handleCompareClick}
                  className={`p-2.5 w-11 h-11 flex items-center justify-center rounded-xl transition-colors touch-target ${
                    isCompared ? 'text-accent bg-accent-soft' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle'
                  }`}
                  aria-label={`Add ${name} to compare`}
                  title="Compare"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <ParticleExplosion active={bookmarked}>
                  <button
                    onClick={handleBookmark}
                    className={`p-2.5 w-11 h-11 flex items-center justify-center rounded-xl transition-colors touch-target ${
                      bookmarked ? 'text-[#F43F5E] bg-[#F43F5E]/10' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle'
                    }`}
                    aria-label={`Bookmark ${name}`}
                    title="Save"
                  >
                    <Heart className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
                  </button>
                </ParticleExplosion>
              </div>
          </div>

          <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 min-h-[40px] mb-3">
            {repo?.description || 'No description available.'}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2.5 relative z-30 pointer-events-auto" data-tour="repo-tags">
            {repo?.difficulty && (
              <span
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/search?difficulties=${repo.difficulty}`); }}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md border hover:opacity-80 transition-opacity shadow-sm cursor-pointer ${getDifficultyColor(repo.difficulty)}`}
              >
                {repo.difficulty}
              </span>
            )}
            {categoriesList.slice(0, 2).map((cat) => {
              const slug = CATEGORIES.find(c => c.label === cat)?.slug || cat.toLowerCase().replace(/\s+/g, '-');
              return (
                <span
                  key={cat}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/search?categories=${slug}`); }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-border/50 bg-bg-subtle/50 text-text-secondary backdrop-blur-md hover:bg-bg-hover transition-colors shadow-sm truncate max-w-full cursor-pointer"
                  title={cat}
                >
                  {cat}
                </span>
              );
            })}
          </div>

          {cleanTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 relative z-30 pointer-events-none">
              {cleanTopics.map((t) => (
                <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border border-border/30 bg-bg-card/50 text-text-muted backdrop-blur-md shadow-sm truncate max-w-full">
                  {formatTag(t)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-auto pt-3 border-t border-border/50 flex flex-col gap-2 relative z-30 ${view === 'list' ? 'md:border-none md:pt-0 md:mt-0 w-full md:w-auto flex-shrink-0 items-start md:items-end md:justify-center md:min-w-[200px]' : 'w-full'}`}>
          <div className={`flex text-xs text-text-muted gap-2 ${view === 'list' ? 'flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between md:justify-end' : 'items-center justify-between flex-wrap'}`} data-tour="repo-stats">
            <div className={`flex items-center flex-wrap gap-x-3 gap-y-1.5 ${view === 'list' ? 'md:justify-end' : ''}`}>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <AnimateDigits value={formatStars(repo?.stars || repo?.upvotes)} />
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <AnimateDigits value={formatStars(repo?.views || repo?.forks)} />
              </span>
              {repo?.language && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
                  {repo.language}
                </span>
              )}
              <LicenseBadge repo={repo} />
              {!isWebsite && repo?.html_url?.includes('github.com') && (
                <a
                  href={repo.html_url.replace('github.com', 'gitingest.com')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all group/ingest overflow-hidden relative shadow-[0_0_8px_rgba(236,72,153,0.2)] hover:shadow-[0_0_12px_rgba(236,72,153,0.4)] pointer-events-auto border border-pink-500/20 hover:border-pink-500/40"
                  title="Food for AI (Gitingest)"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 group-hover/ingest:opacity-100 opacity-50 transition-opacity"></div>
                  <Sparkles className="w-3 h-3 text-pink-400 relative z-10" />
                  <span className="relative z-10 bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">Food for AI</span>
                </a>
              )}
            </div>
            <span className="text-[11px] text-text-muted">
              {repo?.archived && <AlertCircle className="w-3 h-3 inline mr-1 text-nonoss" />}
              {timeAgo(repo?.github_updated_at)}
            </span>
          </div>

          <div className="relative z-30 pointer-events-auto" data-tour="repo-video">
            <RepoVideoLinks repo={repo} />
          </div>
        </div>

        {view === 'list' && (
          <div className="hidden md:flex flex-col gap-2 items-end justify-start ml-4 border-l border-border pl-4 relative z-30 pointer-events-auto">
            <button onClick={handleCompareClick} className={`p-2.5 rounded-xl transition-colors touch-target flex items-center justify-center border w-11 h-11 ${isCompared ? 'text-accent bg-accent-soft border-accent' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle border-border'}`} aria-label={`Compare ${name}`} title="Compare">
              <GitCompare className="w-5 h-5" />
            </button>
            <ParticleExplosion active={bookmarked}>
              <button
                onClick={handleBookmark}
                className={`p-2.5 rounded-xl transition-colors touch-target flex items-center justify-center border w-11 h-11 ${
                  bookmarked ? 'text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/20' : 'text-text-muted hover:text-text hover:bg-bg-hover active:bg-bg-subtle border-border'
                }`}
                aria-label={`Bookmark ${name}`}
                title="Save"
              >
                <Heart className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </ParticleExplosion>
          </div>
        )}
      </div>
      </motion.div>
    </motion.div>
  );
}
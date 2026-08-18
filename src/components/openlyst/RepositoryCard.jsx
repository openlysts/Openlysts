import { Link, useNavigate } from 'react-router-dom';
import { Star, GitFork, Bookmark, Flame, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLanguageColor } from '@/lib/languageColors';
import { getDifficultyColor } from '@/lib/difficultyColors';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { useState } from 'react';
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
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(repo.id));
  const isTrending = (repo.trending_score || 0) > 10;
  const langColor = getLanguageColor(repo.language);
  const navigate = useNavigate();

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(toggleBookmark(repo.id));
  };

  const handleCardClick = () => {
    navigate(`/repo/${repo.owner}/${repo.name}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}>
      
      <div onClick={handleCardClick} className="block h-full cursor-pointer">
        <div className="card card-hover h-full flex flex-col p-4 relative rounded-lg">
          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
            bookmarked ? 'text-accent bg-accent-soft' : 'text-text-muted hover:text-text hover:bg-bg-hover'}`
            }
            aria-label="Bookmark">
            
            <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Trending badge */}
          {isTrending &&
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-trending-soft text-trending mb-2 w-fit">
              <Flame className="w-3 h-3" />
              Trending
            </div>
          }

          {/* Name + owner */}
          <div className="mb-1.5 pr-8">
            <h3 className="font-semibold text-text text-[15px] leading-snug truncate">{repo.name}</h3>
            <p className="text-text-muted text-xs mt-0.5 truncate">{repo.owner}</p>
          </div>

          {/* Description */}
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
            {repo.description || 'No description available.'}
          </p>

          {/* Difficulty and Categories */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {repo.difficulty && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?difficulties=${repo.difficulty}`);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-bg-card border hover:opacity-80 transition-opacity ${getDifficultyColor(repo.difficulty)}`}
              >
                {repo.difficulty}
              </span>
            )}
            {(repo.categories || []).slice(0, 2).map((cat) => {
              const slug = CATEGORIES.find(c => c.label === cat)?.slug || cat.toLowerCase().replace(/\s+/g, '-');
              return (
                <span
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/search?categories=${slug}`);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-bg-subtle text-text-secondary border border-border hover:bg-bg-hover transition-colors"
                >
                  {cat}
                </span>
              );
            })}
          </div>

          {/* Topics */}
          {(repo.topics || []).length > 0 &&
          <div className="flex flex-wrap gap-1 mb-3">
              {(repo.topics || []).slice(0, 3).map((t) =>
            <span key={t} className="px-1.5 py-0.5 rounded text-[11px] bg-bg-subtle text-text-muted font-mono">
                  {t}
                </span>
            )}
            </div>
          }

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-text-muted mb-2.5">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {formatStars(repo.stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {formatStars(repo.forks)}
            </span>
            {repo.language &&
            <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
                {repo.language}
              </span>
            }
          </div>

          {/* Footer: license + updated */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border">
            <LicenseBadge repo={repo} />
            <span className="text-[11px] text-text-muted">
              {repo.archived && <AlertCircle className="w-3 h-3 inline mr-1 text-nonoss" />}
              {timeAgo(repo.github_updated_at)}
            </span>
          </div>

          {/* Video explanation links */}
          <RepoVideoLinks repo={repo} />
        </div>
      </div>
    </motion.div>);

}
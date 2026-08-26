/**
 * InfiniteDiscoveryFeed.jsx
 * An infinite-scroll, algorithmically-ordered discovery feed.
 * Implements the "variable reward" mechanism — mixing trending, authority, and recently-added
 * repos in an unpredictable but weighted order to maximize engagement and retention.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, TrendingUp, Zap } from 'lucide-react';
import RepositoryCard from './RepositoryCard';
import SkeletonCard from './SkeletonCard';
import { queryRepos } from '@/lib/api';
import { useViewMode } from '@/hooks/useViewMode';

// Weighted shuffle: injects variety into the feed order for variable reward effect
function weightedShuffle(repos) {
  if (!repos || repos.length === 0) return [];
  return [...repos].sort((a, b) => {
    // Score: trending_score (60%) + authority_score (30%) + random noise (10%)
    const scoreA = (a.trending_score || 0) * 0.6 + (a.authority_score || 0) * 0.3 + Math.random() * 15;
    const scoreB = (b.trending_score || 0) * 0.6 + (b.authority_score || 0) * 0.3 + Math.random() * 15;
    return scoreB - scoreA;
  });
}

// Determine which "hook badge" to show based on repo signals
function getHookBadge(repo) {
  if (!repo) return null;
  const hnBoosted = (repo.authority_score || 0) > 50;
  const hotToday = (repo.stars_gained_24h || 0) > 200;
  const risingFast = (repo.stars_gained_7d || 0) > 1000;
  const multiSource = (repo.authority_score || 0) > 30;

  if (hotToday) return { label: '🔥 Hot Today', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' };
  if (hnBoosted) return { label: '⚡ Top Tier Tool', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' };
  if (risingFast) return { label: '📈 Rising Fast', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
  if (multiSource) return { label: '✨ Community Pick', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' };
  return null;
}

// Section header dividers injected between feed items for rhythm and visual variety
const SECTION_DIVIDERS = [
  { after: 8, icon: TrendingUp, label: 'Rising in the Community', color: 'text-emerald-400' },
  { after: 16, icon: Sparkles, label: 'Hand-Curated Picks', color: 'text-purple-400' },
  { after: 24, icon: Zap, label: 'High Velocity Picks', color: 'text-yellow-400' },
];

function FeedDivider({ icon: Icon, label, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-full flex items-center gap-3 py-2 px-1"
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm font-bold tracking-wide uppercase ${color}`}>{label}</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-border/80 to-transparent" />
    </motion.div>
  );
}

export default function InfiniteDiscoveryFeed({ initialFilters = {} }) {
  const [view] = useViewMode();
  const [allRepos, setAllRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef(null);

  // Initial fetch
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['feed-initial', initialFilters],
    queryFn: ({ signal }) => queryRepos({ sort: 'trending', page: 1, ...initialFilters }, { signal }),
    staleTime: 300000,
  });

  // When initial data arrives, populate feed
  useEffect(() => {
    if (initialData?.results) {
      setAllRepos(weightedShuffle(initialData.results));
      setHasMore(initialData.hasMore ?? (initialData.results.length >= 12));
      setPage(2);
    }
  }, [initialData]);

  // Fetch more pages
  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const data = await queryRepos({ sort: 'trending', page, ...initialFilters });
      if (data?.results && data.results.length > 0) {
        // Interleave new results with random noise for variable reward
        const shuffled = weightedShuffle(data.results);
        setAllRepos(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = shuffled.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
        setHasMore(data.hasMore ?? (data.results.length >= 12));
        setPage(p => p + 1);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      // Silently fail — feed continues to show existing items
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, hasMore, isFetchingMore, initialFilters]);

  // IntersectionObserver for infinite scroll trigger
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) {
          fetchMore();
        }
      },
      { rootMargin: '400px' } // Pre-fetch 400px before the user hits the bottom
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, isFetchingMore]);

  if (isLoading) {
    return (
      <div className={view === 'list' ? 'flex flex-col gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} view={view} />)}
      </div>
    );
  }

  if (!allRepos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Sparkles className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-text font-semibold">No projects found.</p>
        <p className="text-text-muted text-sm mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  // Build feed items with section dividers injected at correct positions
  const feedItems = [];
  for (let i = 0; i < allRepos.length; i++) {
    const divider = SECTION_DIVIDERS.find(d => d.after === i);
    if (divider) {
      feedItems.push({ type: 'divider', key: `divider-${i}`, ...divider });
    }
    feedItems.push({ type: 'repo', key: allRepos[i].id, repo: allRepos[i], index: i });
  }

  return (
    <div>
      <div className={view === 'list' ? 'flex flex-col gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
        <AnimatePresence>
          {feedItems.map((item) => {
            if (item.type === 'divider') {
              return (
                <FeedDivider
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                />
              );
            }
            const hookBadge = getHookBadge(item.repo);
            const isFeatured = hookBadge?.label === '⚡ Top Tier Tool' || hookBadge?.label === '🔥 Hot Today';
            // In grid view, featured items take up 2 cols/rows for a staggered bento-box rhythm
            const spanClass = (view === 'list' || !isFeatured) ? '' : 'md:col-span-2 md:row-span-2';

            return (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(item.index * 0.03, 0.3) }}
                className={`relative ${spanClass}`}
              >
                {/* FOMO Hook Badge — floats above the card */}
                {hookBadge && (
                  <div className={`absolute -top-2 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border backdrop-blur-md shadow-sm ${hookBadge.color}`}>
                    {hookBadge.label}
                  </div>
                )}
                <RepositoryCard repo={item.repo} index={item.index} view={view} showTrendingBadge />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Infinite scroll trigger + loading indicator */}
      <div ref={loaderRef} className="mt-8 flex justify-center">
        {isFetchingMore && (
          <div className="flex items-center gap-2 text-text-muted text-sm py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Flame className="w-4 h-4 text-trending" />
            </motion.div>
            Discovering more...
          </div>
        )}
        {!hasMore && allRepos.length > 0 && (
          <p className="text-text-muted text-sm py-4">You've seen it all — for now. Check back soon!</p>
        )}
      </div>
    </div>
  );
}

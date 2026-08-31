/**
 * InfiniteDiscoveryFeed.jsx
 * An infinite-scroll, algorithmically-ordered discovery feed.
 * 2-Row Horizontal Grid with Premium Header Navigation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, TrendingUp, ChevronLeft, ChevronRight, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import RepositoryCard from './RepositoryCard';
import SkeletonCard from './SkeletonCard';
import { queryRepos } from '@/lib/api';

// Weighted shuffle: injects variety into the feed order for variable reward effect
function weightedShuffle(repos) {
  if (!repos || repos.length === 0) return [];
  return [...repos].sort((a, b) => {
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
  if (hnBoosted) return { label: '⚡ Top Tier System', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' };
  if (risingFast) return { label: '📈 Rising Fast', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
  if (multiSource) return { label: '✨ Community Pick', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' };
  return null;
}

export default function InfiniteDiscoveryFeed({ initialFilters = {}, onRefresh, isRefreshing }) {
  const [allRepos, setAllRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef(null);
  const scrollContainerRef = useRef(null);

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
      // Silently fail
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
      { 
        root: loaderRef.current.closest('.grid'),
        rootMargin: '400px' 
      } 
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, isFetchingMore]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -800, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 800, behavior: 'smooth' });
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-trending" />
        <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Trending Now</h2>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`p-1.5 rounded-md text-text-muted hover:text-accent transition-all touch-target ${
              isRefreshing ? 'animate-spin text-accent' : ''
            }`}
            title="Refresh Trending"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/trending"
          className="group flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-accent transition-colors touch-target"
        >
          <span>View all trending</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Premium Navigation Arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={handleScrollLeft}
            className="w-9 h-9 rounded-full border border-border bg-bg-card/50 flex items-center justify-center text-text-muted hover:text-accent hover:border-accent hover:bg-bg-hover transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={handleScrollRight}
            className="w-9 h-9 rounded-full border border-border bg-bg-card/50 flex items-center justify-center text-text-muted hover:text-accent hover:border-accent hover:bg-bg-hover transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <>
        {renderHeader()}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 relative">
          <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4" role="region" aria-label="Loading Feed">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-[300px] sm:w-[340px] snap-start">
                <SkeletonCard view="grid" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!allRepos.length) {
    return (
      <>
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="w-8 h-8 text-text-muted mb-3" />
          <p className="text-text font-semibold">No projects found.</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {renderHeader()}
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 relative">
        {/* 2-Row Horizontal Grid */}
        <div 
          ref={scrollContainerRef} 
          className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-8 pt-2 [mask-image:linear-gradient(to_right,white_85%,transparent_100%)] md:[mask-image:linear-gradient(to_right,white_90%,transparent_100%)]" 
          role="region" 
          aria-label="Discovery Feed"
        >
          <AnimatePresence>
            {allRepos.map((repo, index) => {
              const hookBadge = getHookBadge(repo);

              return (
                <motion.div
                  key={repo.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                  className="w-[300px] sm:w-[340px] snap-start relative h-full"
                >
                  {/* FOMO Hook Badge */}
                  {hookBadge && (
                    <div className={`absolute -top-2 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border backdrop-blur-md shadow-sm ${hookBadge.color}`}>
                      {hookBadge.label}
                    </div>
                  )}
                  <RepositoryCard repo={repo} index={index} view="grid" showTrendingBadge />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Infinite scroll trigger inside grid */}
          <div ref={loaderRef} className="row-span-2 flex flex-col items-center justify-center w-[200px] px-8 snap-start">
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-2 text-text-muted text-sm py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Flame className="w-6 h-6 text-trending" />
                </motion.div>
                <span>Discovering...</span>
              </div>
            )}
            {!hasMore && allRepos.length > 0 && (
              <p className="text-text-muted text-sm py-4 max-w-[150px] text-center">You've seen it all.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

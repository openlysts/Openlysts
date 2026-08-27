import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Wrench, ShieldCheck, Activity, Server, Zap, Database, Clock } from 'lucide-react';
import { queryRepos } from '@/lib/api';

import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import InfiniteDiscoveryFeed from '@/components/openlyst/InfiniteDiscoveryFeed';
import AnimatedSearch from '@/components/openlyst/AnimatedSearch';
import FilterBar from '@/components/openlyst/FilterBar';
import DiscoverLiveMetrics from '@/components/openlyst/DiscoverLiveMetrics';
import { useToast } from '@/components/ui/use-toast';
import { usePlatformStats } from '@/hooks/usePlatformStats';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell', 'Vue', 'HTML', 'Dart'];

const QUICK_CATEGORIES = [
  { id: 'local-ai',            name: 'Local AI',         icon: Cpu },
  { id: 'sovereign-infra',     name: 'Sovereign Infra',  icon: Server },
  { id: 'observability',       name: 'Observability',    icon: Activity },
  { id: 'developer-tools',     name: 'Dev Tools',        icon: Wrench },
  { id: 'workflow-automation', name: 'Automation',       icon: Zap },
  { id: 'data-lakehouse',      name: 'Data & Lakehouse', icon: Database },
  { id: 'security-auth',       name: 'Security',         icon: ShieldCheck },
];

export default function Home() {
  usePageTitle('Discover');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { totalRepositories } = usePlatformStats();
  const heroRef = useRef(null);
  const [viewHistory, setViewHistory] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyPaused, setHistoryPaused] = useState(false);
  
  const [showStickyFilters, setShowStickyFilters] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyFilters(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('openlyst_history');
      if (stored) {
        setViewHistory(JSON.parse(stored));
      }
      setHistoryPaused(localStorage.getItem('openlyst_history_paused') === 'true');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const { data: trending, isLoading: tLoading, refetch: refetchTrending, isRefetching: tRefetching } = useQuery({
    queryKey: ['home-trending'],
    queryFn: ({ signal }) => queryRepos({ sort: 'trending', page: 1 }, { signal }),
    staleTime: 300000,
    refetchInterval: 60000
  });
  const { data: recent, isLoading: rLoading } = useQuery({
    queryKey: ['home-recent'],
    queryFn: ({ signal }) => queryRepos({ sort: 'recent', page: 1 }, { signal }),
    staleTime: 300000,
    refetchInterval: 60000
  });
  const { data: aiPopular, isLoading: aLoading } = useQuery({
    queryKey: ['home-ai'],
    queryFn: ({ signal }) => queryRepos({ categories: ['ai'], sort: 'stars', page: 1 }, { signal }),
    staleTime: 300000,
    refetchInterval: 60000
  });


  const emptyFilters = {
    categories: [],
    languages: [],
    licenses: [],
    difficulties: [],
    minStars: 0,
    updatedWithin: '',
    activity: '',
    sort: 'trending',
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.languages?.length) params.set('languages', newFilters.languages.join(','));
    if (newFilters.licenses?.length) params.set('licenses', newFilters.licenses.join(','));
    if (newFilters.difficulties?.length) params.set('difficulties', newFilters.difficulties.join(','));
    if (newFilters.minStars > 0) params.set('minStars', String(newFilters.minStars));
    if (newFilters.updatedWithin) params.set('updatedWithin', newFilters.updatedWithin);
    if (newFilters.activity) params.set('activity', newFilters.activity);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 rounded-lg relative">
      {/* Dynamic Floating Quick-Filters (Premium Glassmorphism) */}
      <AnimatePresence>
        {showStickyFilters && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 z-50 hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-bg-card/90 backdrop-blur-2xl border border-border shadow-2xl"
          >
            {QUICK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ categories: [cat.id] })}
                  className="group relative px-4 py-2 rounded-full text-sm font-medium text-text-secondary hover:text-accent transition-colors flex items-center gap-2 hover:bg-bg-hover"
                >
                  <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  {cat.name}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with React Bits Variable Proximity Typography */}
      <section ref={heroRef} className="pt-10 sm:pt-16 pb-6 text-center max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.04em] text-text leading-[1.05] mb-5 w-full flex flex-col items-center justify-center sm:whitespace-nowrap">
            <span>Uncover what the top 1%</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-emerald-400 to-cyan-400">
              ship with.
            </span>
          </h1>
          
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
            Stop guessing. We track, rank, and surface explosive open-source systems before they go mainstream.
          </p>
        </motion.div>

        {/* Search Bar (Primary Spotlight Action) */}
        <motion.div
          data-tour="search-bar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="max-w-3xl mx-auto z-30 relative mb-4">
          <AnimatedSearch size="lg" />
        </motion.div>

        {/* Global Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="max-w-3xl mx-auto text-left mb-6"
        >
          <FilterBar filters={emptyFilters} onChange={updateFilters} languages={LANGUAGES} />
        </motion.div>

        {/* 3D Interactive Live Metrics & Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <DiscoverLiveMetrics totalRepos={totalRepositories || 0} categoryCounts={trending?.categoryCounts || {}} />
        </motion.div>
      </section>

      {/* Main Grid: Trending + Recent Tabs */}
      <section className="mb-14">
        <InfiniteDiscoveryFeed 
          onRefresh={() => {
            setIsRefreshing(true);
            refetchTrending().finally(() => setIsRefreshing(false));
          }}
          isRefreshing={isRefreshing || tRefetching}
        />
      </section>

      {/* Popular in AI & Machine Learning */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-text" />
            <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">AI & Agentic Systems</h2>
          </div>
          <Link
            to="/search?categories=ai"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors min-h-[44px] px-2 -mr-2 touch-target"
          >
            <span>Explore AI Systems</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <RepositoryGrid
          repos={aiPopular?.results || []}
          loading={aLoading}
          emptyMessage="No AI systems found."
        />
      </section>

      {/* Recently Added Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Fresh Drops</h2>
          </div>
          <Link
            to="/search?sort=recent"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <span>View all recent</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <RepositoryGrid
          repos={recent?.results || []}
          loading={rLoading}
          emptyMessage="No recent systems found."
        />
      </section>
    </div>
  );
}
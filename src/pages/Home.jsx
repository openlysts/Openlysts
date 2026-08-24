import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, TrendingUp, ArrowRight, Database, RefreshCw, Cpu, Wrench, HardDrive, Bot, Package, Cloud, ShieldCheck } from 'lucide-react';
import { queryRepos } from '@/lib/api';

import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import AnimatedSearch from '@/components/openlyst/AnimatedSearch';
import FilterBar from '@/components/openlyst/FilterBar';
import DiscoverLiveMetrics from '@/components/openlyst/DiscoverLiveMetrics';
import VariableProximity from '@/components/ui/VariableProximity';
import { useToast } from '@/components/ui/use-toast';
import { usePlatformStats } from '@/hooks/usePlatformStats';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell', 'Vue', 'HTML', 'Dart'];

const QUICK_CATEGORIES = [
  { id: 'ai', name: 'AI & LLMs', icon: Cpu },
  { id: 'developer-tools', name: 'Developer Tools', icon: Wrench },
  { id: 'databases', name: 'Databases & RAG', icon: HardDrive },
  { id: 'ai-agents', name: 'AI Agents', icon: Bot },
  { id: 'libraries-frameworks', name: 'Libraries', icon: Package },
  { id: 'cloud-devops', name: 'Cloud & DevOps', icon: Cloud },
  { id: 'security-auth', name: 'Security & Auth', icon: ShieldCheck },
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
  
  const { scrollY } = useScroll();
  const [showStickyFilters, setShowStickyFilters] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 450 && !showStickyFilters) {
      setShowStickyFilters(true);
    } else if (latest <= 450 && showStickyFilters) {
      setShowStickyFilters(false);
    }
  });

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

  const hasData = (trending?.results?.length || 0) > 0 || (recent?.results?.length || 0) > 0;

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
    if (newFilters.sort && newFilters.sort !== 'trending') params.set('sort', newFilters.sort);
    
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
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold mb-4 border border-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            Discover. Filter. Build.
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text leading-tight mb-3">
            <VariableProximity
              label="Discover Everything on GitHub. Without the Noise."
              className="text-4xl sm:text-6xl font-black tracking-tight text-text leading-tight"
              fromFontVariationSettings="'wght' 900"
              toFontVariationSettings="'wght' 900"
              containerRef={heroRef}
              radius={160}
              falloff="gaussian"
            />
          </h1>
          
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed mb-7 max-w-2xl mx-auto">
            <VariableProximity
              label="Surgical filtering, instant SaaS alternatives, and curated intelligence across AI, systems, and open-source."
              className="text-text-secondary text-base sm:text-lg leading-relaxed"
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 600"
              containerRef={heroRef}
              radius={130}
              falloff="gaussian"
            />
          </p>
        </motion.div>

        {/* Search Bar (Primary Spotlight Action) */}
        <motion.div
          data-tour="search-bar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="max-w-2xl mx-auto z-30 relative mb-4">
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
          <DiscoverLiveMetrics totalRepos={totalRepositories || 35476} categoryCounts={trending?.categoryCounts || {}} />
        </motion.div>
      </section>

      {/* Main Grid: Trending + Recent Tabs */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-trending" />
              <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Trending This Week</h2>
            </div>
            <button
              onClick={() => {
                setIsRefreshing(true);
                refetchTrending().finally(() => setIsRefreshing(false));
              }}
              className={`p-1.5 rounded-lg border border-border bg-bg-card text-text-secondary hover:text-accent transition-all ${
                isRefreshing || tRefetching ? 'animate-spin text-accent' : ''
              }`}
              title="Refresh Trending"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link
            to="/trending"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <span>View all trending</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <RepositoryGrid
          repos={trending?.results || []}
          isLoading={tLoading}
          emptyMessage="No trending repositories found."
        />
      </section>

      {/* Popular in AI & Machine Learning */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Top AI & Machine Learning</h2>
          </div>
          <Link
            to="/search?categories=ai"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <span>Explore AI Repos</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <RepositoryGrid
          repos={aiPopular?.results || []}
          isLoading={aLoading}
          emptyMessage="No AI repositories found."
        />
      </section>

      {/* Recently Added Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Recently Added</h2>
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
          isLoading={rLoading}
          emptyMessage="No recent repositories found."
        />
      </section>
    </div>
  );
}
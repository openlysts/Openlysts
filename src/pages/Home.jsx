import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Clock, TrendingUp, ArrowRight, Database, RefreshCw } from 'lucide-react';
import { queryRepos } from '@/lib/api';

import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import AnimatedSearch from '@/components/openlyst/AnimatedSearch';
import FilterBar from '@/components/openlyst/FilterBar';
import { useToast } from '@/components/ui/use-toast';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell', 'Vue', 'HTML', 'Dart'];

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewHistory, setViewHistory] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('openlyst_history');
      if (stored) {
        setViewHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const { data: trending, isLoading: tLoading, refetch: refetchTrending, isRefetching: tRefetching } = useQuery({
    queryKey: ['home-trending'],
    queryFn: () => queryRepos({ sort: 'trending', page: 1 }),
    refetchInterval: 60000
  });
  const { data: recent, isLoading: rLoading } = useQuery({
    queryKey: ['home-recent'],
    queryFn: () => queryRepos({ sort: 'recent', page: 1 }),
    refetchInterval: 60000
  });
  const { data: aiPopular, isLoading: aLoading } = useQuery({
    queryKey: ['home-ai'],
    queryFn: () => queryRepos({ categories: ['ai'], sort: 'stars', page: 1 }),
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
    
    // Navigate to search with the updated filter matrix or sort
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 rounded-lg">
      {/* Hero */}
      <section className="pt-12 sm:pt-20 pb-8 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-medium mb-5">
            <Sparkles className="w-3 h-3" />
            Discover. Filter. Build.
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text leading-tight mb-4">
            Discover everything on GitHub.
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Explore and search high-quality open-source software across AI, developer tools, self-hosting, and the vast expanse of GitHub.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-xl mx-auto z-30 relative mb-8">
          
          <AnimatedSearch size="lg" />
        </motion.div>

        {/* Global Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-4xl mx-auto text-left"
        >
          <FilterBar filters={emptyFilters} onChange={updateFilters} languages={LANGUAGES} />
        </motion.div>
      </section>

      {!hasData && !tLoading && !rLoading ?
      <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
          <Database className="w-10 h-10 text-text-muted mb-3 animate-bounce" />
          <p className="text-text-secondary text-lg font-medium mb-1">Syncing repositories from GitHub...</p>
          <p className="text-text-muted text-sm mb-4">Please wait a few moments while the background worker processes the initial data.</p>
        </div> :

      <div className="space-y-12 pb-12">
          {/* Trending This Week */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-text">
                <TrendingUp className="w-5 h-5 text-trending" />
                Trending This Week
                <button 
                  onClick={async () => {
                    setIsRefreshing(true);
                    toast({ title: 'Refreshing', description: 'Fetching latest repositories from GitHub...', duration: 2000 });
                    try {
                      await fetch('/api/functions/runIngestion', { method: 'POST' });
                      await refetchTrending();
                      toast({ title: 'Success', description: 'Trending repositories updated.', duration: 2000 });
                    } catch (e) {
                      toast({ title: 'Error', description: 'Failed to refresh.', variant: 'destructive', duration: 2000 });
                    } finally {
                      setIsRefreshing(false);
                    }
                  }} 
                  disabled={tRefetching || isRefreshing}
                  className="ml-2 p-1 text-text-muted hover:text-text rounded-md hover:bg-bg-subtle transition-colors"
                  title="Refresh Trending"
                  aria-label="Refresh trending repositories"
                >
                  <RefreshCw className={`w-4 h-4 ${tRefetching || isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </h2>
              <Link to="/trending" className="text-sm text-text-muted hover:text-text flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <RepositoryGrid repos={trending?.results?.slice(0, 12) || []} loading={tLoading} />
          </section>

          {/* Recently Discovered */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-text">
                <Clock className="w-5 h-5 text-accent" />
                Recently Discovered
              </h2>
            </div>
            <RepositoryGrid repos={recent?.results?.slice(0, 12) || []} loading={rLoading} />
          </section>

          {/* Recently Viewed History */}
          {viewHistory.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-xl font-bold text-text">
                  <Clock className="w-5 h-5 text-accent" />
                  Your Viewing History
                </h2>
                <button
                  onClick={() => {
                    localStorage.removeItem('openlyst_history');
                    setViewHistory([]);
                  }}
                  className="text-sm text-text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  Clear History
                </button>
              </div>
              <RepositoryGrid repos={viewHistory.slice(0, 4)} loading={false} />
            </section>
          )}

          {/* Popular in AI */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-text">
                <Sparkles className="w-5 h-5 text-accent" />
                Popular in AI
              </h2>
              <Link to="/search?categories=ai" className="text-sm text-text-muted hover:text-text flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <RepositoryGrid repos={aiPopular?.results?.slice(0, 12) || []} loading={aLoading} />
          </section>
        </div>
      }
    </div>);

}
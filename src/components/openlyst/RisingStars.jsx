import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Star, ArrowRight, Sparkles } from 'lucide-react';
import { getLanguageColor } from '@/lib/languageColors';

export default function RisingStars() {
  const { data, isLoading } = useQuery({
    queryKey: ['rising-stars'],
    queryFn: async () => {
      const res = await fetch('/api/functions/getRisingStars?limit=8');
      if (!res.ok) return { repositories: [] };
      return res.json();
    },
    staleTime: 60000,
  });

  const repos = data?.repositories || [];

  if (!isLoading && repos.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Rising Fast</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles className="w-2.5 h-2.5" /> Breakout Velocity
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">High-momentum repositories gaining breakout adoption before mainstream aggregators.</p>
          </div>
        </div>

        <Link
          to="/trending"
          className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          <span>Explore All Trending</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse bg-bg-card/60">
              <div className="h-4 bg-bg-subtle rounded w-3/4 mb-3" />
              <div className="h-3 bg-bg-subtle rounded w-full mb-2" />
              <div className="h-3 bg-bg-subtle rounded w-5/6 mb-4" />
              <div className="flex justify-between">
                <div className="h-3 bg-bg-subtle rounded w-16" />
                <div className="h-3 bg-bg-subtle rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {repos.map((repo, idx) => {
            const langColor = getLanguageColor(repo.language);
            return (
              <motion.div
                key={repo.id || repo.full_name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  to={`/repo/${repo.full_name || `${repo.owner}/${repo.name}`}`}
                  className="card p-5 h-full flex flex-col justify-between group hover:border-accent/40 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] bg-bg-card/90 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent pointer-events-none rounded-bl-full" />
                  
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">
                        {repo.name}
                      </h3>
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <Flame className="w-2.5 h-2.5" />
                        {repo.velocity_score || 85}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {repo.description || 'Modern high-velocity open source repository.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      {repo.language && (
                        <span className="flex items-center gap-1 text-[11px] font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-yellow-500 font-bold font-mono text-[11px]">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {Number(repo.stars || 0).toLocaleString()}
                      </span>
                      {repo.stars_gained_7d > 0 && (
                        <span className="text-orange-400 font-mono text-[10px] font-semibold">
                          +{repo.stars_gained_7d}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

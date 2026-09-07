import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Star, ArrowRight, Compass } from 'lucide-react';
import { getBookmarks } from '@/lib/bookmarks';
import { getLanguageColor } from '@/lib/languageColors';

export default function PersonalizedFeed() {
  const [interestTags, setInterestTags] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    try {
      const bookmarks = getBookmarks() || [];
      const bookmarkIds = bookmarks.map(b => b.id || b.full_name || b.name).filter(Boolean);
      setBookmarkedIds(bookmarkIds);

      // Extract topics & languages from bookmarked repos and local history
      const tags = new Set();
      bookmarks.forEach(b => {
        if (b.language) tags.add(b.language.toLowerCase());
        if (Array.isArray(b.topics)) b.topics.forEach(t => tags.add(String(t).toLowerCase()));
        if (Array.isArray(b.categories)) b.categories.forEach(c => tags.add(String(c).toLowerCase()));
      });

      const historyRaw = localStorage.getItem('openlyst_history');
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history)) {
          history.slice(0, 10).forEach(h => {
            if (h.language) tags.add(h.language.toLowerCase());
            if (Array.isArray(h.topics)) h.topics.forEach(t => tags.add(String(t).toLowerCase()));
          });
        }
      }

      setInterestTags(Array.from(tags).slice(0, 12));
    } catch (e) {
      console.warn('[PersonalizedFeed] Failed to parse local interests:', e);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['personalized-feed', interestTags.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (interestTags.length > 0) params.set('tags', interestTags.join(','));
      if (bookmarkedIds.length > 0) params.set('exclude', bookmarkedIds.slice(0, 10).join(','));
      params.set('limit', '4');

      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (!res.ok) return { recommendations: [] };
      return res.json();
    },
    staleTime: 120000,
  });

  const recs = data?.recommendations || [];

  if (!isLoading && recs.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent border border-accent/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">Recommended For You</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-accent/10 text-accent border border-accent/20">
                <Compass className="w-2.5 h-2.5" /> Edge Match
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              {interestTags.length > 0
                ? `Algorithmic recommendations tailored to your interest in ${interestTags.slice(0, 3).join(', ')}.`
                : 'Curated high-signal tools aligned with community discovery patterns.'}
            </p>
          </div>
        </div>

        <Link
          to="/trending"
          className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          <span>Discover more</span>
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
          {recs.map((repo, idx) => {
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
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-accent/10 to-transparent pointer-events-none rounded-bl-full" />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">
                        {repo.name}
                      </h3>
                      {repo.recommendationScore && (
                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-soft text-accent border border-accent/20">
                          {repo.recommendationScore}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {repo.description || 'Modern high-performance open-source project.'}
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

                    <span className="flex items-center gap-1 text-yellow-500 font-bold font-mono text-[11px]">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {Number(repo.stars || 0).toLocaleString()}
                    </span>
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

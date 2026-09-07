import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Share2, Download } from 'lucide-react';
import { queryRepos } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import useDebounce from '@/hooks/useDebounce';
import FilterBar from '@/components/openlyst/FilterBar';
import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import Pagination from '@/components/openlyst/Pagination';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell', 'Vue', 'HTML', 'Dart'];

export default function Search() {
  usePageTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(q);
  const debouncedQ = useDebounce(inputVal, 300);
  const { toast } = useToast();

  const parseSearchQuery = (query) => {
    const parsed = { q: '', topics: [], languages: [], minStars: 0, licenses: [] };
    if (!query) return parsed;
    
    // Match tokens (including quoted strings if any)
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const textParts = [];
    
    tokens.forEach(token => {
      const lower = token.toLowerCase();
      if (lower.startsWith('language:')) {
        // e.g. language:python -> Python (we might want case-insensitive matching in backend)
        parsed.languages.push(token.substring(9).replace(/"/g, ''));
      } else if (lower.startsWith('topic:')) {
        parsed.topics.push(token.substring(6).replace(/"/g, '').toLowerCase());
      } else if (lower.startsWith('stars:>')) {
        const val = parseInt(token.substring(7).replace(/"/g, ''), 10);
        if (!isNaN(val)) parsed.minStars = Math.max(parsed.minStars, val);
      } else if (lower.startsWith('license:')) {
        parsed.licenses.push(token.substring(8).replace(/"/g, ''));
      } else {
        textParts.push(token);
      }
    });
    
    parsed.q = textParts.join(' ').replace(/"/g, '');
    return parsed;
  };

  const parsedSyntax = parseSearchQuery(debouncedQ);

  const queryFilters = {
    q: parsedSyntax.q,
    topics: parsedSyntax.topics,
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    languages: Array.from(new Set([...(searchParams.get('languages')?.split(',').filter(Boolean) || []), ...parsedSyntax.languages])),
    licenses: Array.from(new Set([...(searchParams.get('licenses')?.split(',').filter(Boolean) || []), ...parsedSyntax.licenses])),
    difficulties: searchParams.get('difficulties')?.split(',').filter(Boolean) || [],
    minStars: Math.max(parseInt(searchParams.get('minStars') || '0') || 0, parsedSyntax.minStars),
    updatedWithin: searchParams.get('updatedWithin') || '',
    activity: searchParams.get('activity') || '',
    sort: searchParams.get('sort') || 'trending',
    page: parseInt(searchParams.get('page') || '1') || 1,
  };

  const uiFilters = {
    q: q,
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    licenses: searchParams.get('licenses')?.split(',').filter(Boolean) || [],
    difficulties: searchParams.get('difficulties')?.split(',').filter(Boolean) || [],
    minStars: parseInt(searchParams.get('minStars') || '0') || 0,
    updatedWithin: searchParams.get('updatedWithin') || '',
    activity: searchParams.get('activity') || '',
    sort: searchParams.get('sort') || 'trending',
    page: parseInt(searchParams.get('page') || '1') || 1,
  };

  useEffect(() => {
    setInputVal(q);
  }, [q]);

  useEffect(() => {
    if (debouncedQ !== q) {
      const params = new URLSearchParams(searchParams);
      if (debouncedQ) {
        params.set('q', debouncedQ);
      } else {
        params.delete('q');
      }
      params.delete('page');
      setSearchParams(params, { replace: true });
    }
  }, [debouncedQ]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', queryFilters],
    queryFn: ({ signal }) => queryRepos(queryFilters, { signal }),
    staleTime: 300000,
    refetchInterval: 60000,
  });

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.q) params.set('q', newFilters.q);
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.languages?.length) params.set('languages', newFilters.languages.join(','));
    if (newFilters.licenses?.length) params.set('licenses', newFilters.licenses.join(','));
    if (newFilters.difficulties?.length) params.set('difficulties', newFilters.difficulties.join(','));
    if (newFilters.minStars > 0) params.set('minStars', String(newFilters.minStars));
    if (newFilters.updatedWithin) params.set('updatedWithin', newFilters.updatedWithin);
    if (newFilters.activity) params.set('activity', newFilters.activity);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.page > 1) params.set('page', String(newFilters.page));
    setSearchParams(params, { replace: false });
  };

  const onPageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Search URL has been copied to your clipboard.",
      duration: 3000,
    });
  };

  const handleExport = () => {
    if (!data?.results) return;
    const blob = new Blob([JSON.stringify(data.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openlyst_search_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: `Exported ${data.results.length} repositories to JSON.`,
      duration: 3000,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="sr-only">Search open-source repositories</h1>
      {/* Search input */}
      <motion.div whileTap={{ scale: 0.995 }} data-tour="search-input" className="relative max-w-2xl mb-6 group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (!e.target.value) {
              const params = new URLSearchParams(searchParams);
              params.delete('q');
              params.delete('page');
              setSearchParams(params, { replace: true });
            }
          }}
          placeholder="Search open-source projects (e.g. language:python stars:>1000 topic:ai)..."
          className="w-full bg-bg-card/80 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] rounded-2xl pl-12 pr-4 py-4 text-base text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all"
        />
      </motion.div>

      {q && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-bg-card border border-border">
          <p className="text-text-secondary text-sm font-medium">
            {data ? `${data.total} result${data.total !== 1 ? 's' : ''} for` : 'Searching for'} <span className="text-text font-bold">"{q}"</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-bg-subtle border border-border text-text-secondary hover:text-text hover:bg-bg-hover transition-colors font-semibold touch-target"
              title="Share Search"
            >
              <Share2 className="w-3.5 h-3.5" /> <span>Share</span>
            </button>
            <button 
              onClick={handleExport} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-bg-subtle border border-border text-text-secondary hover:text-text hover:bg-bg-hover transition-colors font-semibold touch-target"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" /> <span>Export JSON</span>
            </button>
          </div>
        </div>
      )}

      <div data-tour="search-filters">
        <FilterBar filters={uiFilters} onChange={updateFilters} languages={LANGUAGES} />
      </div>

      <RepositoryGrid
        repos={data?.results || []}
        loading={isLoading}
        emptyMessage={q ? `No repositories found for "${q}"` : (uiFilters.categories?.length > 0 ? 'No matches found. Try adjusting your filters, searching for something else, or contributing a new project.' : 'Start typing to search')}
      />

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
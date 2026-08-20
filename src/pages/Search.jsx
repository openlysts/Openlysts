import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  const filters = {
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

  useEffect(() => {
    if (debouncedQ !== q) {
      const params = new URLSearchParams(searchParams);
      params.set('q', debouncedQ);
      params.delete('page');
      setSearchParams(params, { replace: true });
    }
  }, [debouncedQ]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: ({ signal }) => queryRepos(filters, { signal }),
    staleTime: 300000,
    refetchInterval: 60000,
  });

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    // Only update non-syntax fields, keep q the same
    if (newFilters.q !== undefined) params.set('q', newFilters.q);
    else if (q) params.set('q', q);
    
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    // Do not overwrite syntax-extracted languages if they were passed via filter bar, but we can't easily distinguish.
    // Usually FilterBar gives the full array. Let's just set it.
    if (newFilters.languages?.length) params.set('languages', newFilters.languages.join(','));
    if (newFilters.licenses?.length) params.set('licenses', newFilters.licenses.join(','));
    if (newFilters.difficulties?.length) params.set('difficulties', newFilters.difficulties.join(','));
    if (newFilters.minStars > 0) params.set('minStars', String(newFilters.minStars));
    if (newFilters.updatedWithin) params.set('updatedWithin', newFilters.updatedWithin);
    if (newFilters.activity) params.set('activity', newFilters.activity);
    if (newFilters.sort && newFilters.sort !== 'trending') params.set('sort', newFilters.sort);
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
      {/* Search input */}
      <div className="relative max-w-2xl mb-6">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Search open-source projects (e.g. language:python stars:>1000 topic:ai)..."
          className="w-full bg-bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-base text-text placeholder:text-text-muted focus:border-accent focus:outline-none shadow-sm"
        />
      </div>

      {q && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted text-sm">
            {data ? `${data.total} result${data.total !== 1 ? 's' : ''} for` : 'Searching for'} <span className="text-text font-medium">"{q}"</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-secondary hover:text-text hover:bg-bg-hover transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-secondary hover:text-text hover:bg-bg-hover transition-colors">
              <Download className="w-4 h-4" /> Export JSON
            </button>
          </div>
        </div>
      )}

      <FilterBar filters={filters} onChange={updateFilters} languages={LANGUAGES} />

      <RepositoryGrid
        repos={data?.results || []}
        loading={isLoading}
        emptyMessage={q ? `No repositories found for "${q}"` : (filters.categories?.length > 0 ? 'No matches found. Try adjusting your filters, searching for something else, or contributing a new project.' : 'Start typing to search')}
      />

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
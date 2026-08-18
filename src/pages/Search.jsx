import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { queryRepos } from '@/lib/api';
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

  const filters = {
    q: debouncedQ,
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
    if (debouncedQ !== q) {
      const params = new URLSearchParams(searchParams);
      params.set('q', debouncedQ);
      params.delete('page');
      setSearchParams(params, { replace: true });
    }
  }, [debouncedQ]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => queryRepos(filters),
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Search input */}
      <div className="relative max-w-2xl mb-6">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Search open-source projects..."
          className="w-full bg-bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-base text-text placeholder:text-text-muted focus:border-accent focus:outline-none shadow-sm"
        />
      </div>

      {q && (
        <p className="text-text-muted text-sm mb-4">
          {data ? `${data.total} result${data.total !== 1 ? 's' : ''} for` : 'Searching for'} <span className="text-text font-medium">"{q}"</span>
        </p>
      )}

      <FilterBar filters={filters} onChange={updateFilters} languages={LANGUAGES} />

      <RepositoryGrid
        repos={data?.results || []}
        loading={isLoading}
        emptyMessage={q ? `No repositories found for "${q}"` : 'Start typing to search'}
      />

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
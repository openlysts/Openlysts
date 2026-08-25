import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryRepos } from '@/lib/api';
import FilterBar from '@/components/openlyst/FilterBar';
import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import Pagination from '@/components/openlyst/Pagination';
import { Flame } from 'lucide-react';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell'];

export default function Trending() {
  usePageTitle('Trending');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    licenses: searchParams.get('licenses')?.split(',').filter(Boolean) || [],
    difficulties: searchParams.get('difficulties')?.split(',').filter(Boolean) || [],
    minStars: parseInt(searchParams.get('minStars') || '0') || 0,
    updatedWithin: searchParams.get('updatedWithin') || '',
    activity: searchParams.get('activity') || '',
    sort: 'trending',
    page: parseInt(searchParams.get('page') || '1') || 1,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['trending', filters],
    queryFn: ({ signal }) => queryRepos(filters, { signal }),
    refetchInterval: 60000,
  });

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.categories?.length) params.set('categories', newFilters.categories.join(','));
    if (newFilters.languages?.length) params.set('languages', newFilters.languages.join(','));
    if (newFilters.licenses?.length) params.set('licenses', newFilters.licenses.join(','));
    if (newFilters.difficulties?.length) params.set('difficulties', newFilters.difficulties.join(','));
    if (newFilters.minStars > 0) params.set('minStars', String(newFilters.minStars));
    if (newFilters.updatedWithin) params.set('updatedWithin', newFilters.updatedWithin);
    if (newFilters.activity) params.set('activity', newFilters.activity);
    if (newFilters.page > 1) params.set('page', String(newFilters.page));
    if (newFilters.sort && newFilters.sort !== 'trending') {
      const sp = new URLSearchParams(params);
      sp.set('sort', newFilters.sort);
      navigate(`/search?${sp.toString()}`);
      return;
    }
    setSearchParams(params);
  };

  const onPageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text mb-1">
        <Flame className="w-6 h-6 text-trending" />
        Trending Repositories
      </h1>
      <p className="text-text-secondary text-sm mb-6">Repositories gaining the most stars recently.</p>

      <div data-tour="trending-filters">
        <FilterBar filters={filters} onChange={updateFilters} languages={LANGUAGES} />
      </div>

      <RepositoryGrid repos={data?.results || []} loading={isLoading} emptyMessage="No trending repositories found." showTrendingBadge={false} />

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
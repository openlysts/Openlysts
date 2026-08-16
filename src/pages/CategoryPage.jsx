import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryRepos } from '@/lib/api';
import { getCategory } from '@/lib/categories';
import CategoryPills from '@/components/openlyst/CategoryPills';
import FilterBar from '@/components/openlyst/FilterBar';
import RepositoryGrid from '@/components/openlyst/RepositoryGrid';
import Pagination from '@/components/openlyst/Pagination';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Shell'];

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = getCategory(slug);

  const filters = {
    categories: [slug],
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    licenses: searchParams.get('licenses')?.split(',').filter(Boolean) || [],
    minStars: parseInt(searchParams.get('minStars') || '0') || 0,
    updatedWithin: searchParams.get('updatedWithin') || '',
    activity: searchParams.get('activity') || '',
    sort: searchParams.get('sort') || 'stars',
    page: parseInt(searchParams.get('page') || '1') || 1,
  };

  useEffect(() => {
    if (category) {
      document.title = `Openlyst — ${category.label} | Open-Source Discovery`;
    }
  }, [category]);

  const { data, isLoading } = useQuery({
    queryKey: ['category', filters],
    queryFn: () => queryRepos(filters),
    refetchInterval: 30000,
  });

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.languages?.length) params.set('languages', newFilters.languages.join(','));
    if (newFilters.licenses?.length) params.set('licenses', newFilters.licenses.join(','));
    if (newFilters.minStars > 0) params.set('minStars', String(newFilters.minStars));
    if (newFilters.updatedWithin) params.set('updatedWithin', newFilters.updatedWithin);
    if (newFilters.activity) params.set('activity', newFilters.activity);
    if (newFilters.sort && newFilters.sort !== 'stars') params.set('sort', newFilters.sort);
    if (newFilters.page > 1) params.set('page', String(newFilters.page));
    setSearchParams(params);
  };

  const onPageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-text mb-1">Category not found</h1>
        <p className="text-text-muted text-sm">This category doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-1">{category.label}</h1>
        <p className="text-text-secondary text-sm">{category.description}</p>
      </div>

      <div className="mb-5">
        <CategoryPills active={slug} />
      </div>

      <p className="text-text-muted text-sm mb-4">{data?.total || 0} repositories</p>

      <FilterBar filters={filters} onChange={updateFilters} languages={LANGUAGES} />

      <RepositoryGrid repos={data?.results || []} loading={isLoading} emptyMessage={`No repositories in ${category.label} yet.`} />

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}
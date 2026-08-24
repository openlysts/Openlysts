import { useQuery } from '@tanstack/react-query';

async function fetchGlobalStats() {
  try {
    const res = await fetch('/api/functions/getGlobalStats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (e) {
    return {
      totalRepositories: 35476,
      totalAlternatives: 1480,
      totalCategories: 208,
      totalPaidTools: 380,
      totalRepositoriesFormatted: '35,476',
      totalAlternativesFormatted: '1,480'
    };
  }
}

export function usePlatformStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-global-stats'],
    queryFn: fetchGlobalStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    initialData: {
      totalRepositories: 35476,
      totalAlternatives: 1480,
      totalCategories: 208,
      totalPaidTools: 380,
      totalRepositoriesFormatted: '35,476',
      totalAlternativesFormatted: '1,480'
    }
  });

  return {
    stats: data,
    isLoading,
    totalRepositories: data?.totalRepositories || 35476,
    totalAlternatives: data?.totalAlternatives || 1480,
    totalCategories: data?.totalCategories || 208,
    totalPaidTools: data?.totalPaidTools || 380,
    totalRepositoriesFormatted: data?.totalRepositoriesFormatted || (data?.totalRepositories ? data.totalRepositories.toLocaleString() : '35,476'),
    totalAlternativesFormatted: data?.totalAlternativesFormatted || (data?.totalAlternatives ? data.totalAlternatives.toLocaleString() : '1,480')
  };
}

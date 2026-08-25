import { useQuery } from '@tanstack/react-query';

async function fetchGlobalStats() {
  try {
    const res = await fetch('/api/functions/getGlobalStats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (e) {
    return {
      totalRepositories: 758,
      totalAlternatives: 876,
      totalCategories: 9,
      totalPaidTools: 250,
      totalRepositoriesFormatted: '758',
      totalAlternativesFormatted: '876+'
    };
  }
}

export function usePlatformStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-global-stats'],
    queryFn: fetchGlobalStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: {
      totalRepositories: 758,
      totalAlternatives: 876,
      totalCategories: 9,
      totalPaidTools: 250,
      totalRepositoriesFormatted: '758',
      totalAlternativesFormatted: '876+'
    }
  });

  return {
    stats: data,
    isLoading,
    totalRepositories: data?.totalRepositories || 758,
    totalAlternatives: data?.totalAlternatives || 876,
    totalCategories: data?.totalCategories || 9,
    totalPaidTools: data?.totalPaidTools || 250,
    totalRepositoriesFormatted: data?.totalRepositoriesFormatted || (data?.totalRepositories ? data.totalRepositories.toLocaleString() : '758'),
    totalAlternativesFormatted: data?.totalAlternativesFormatted || (data?.totalAlternatives ? `${data.totalAlternatives.toLocaleString()}+` : '876+')
  };
}

import RepositoryCard from './RepositoryCard';
import SkeletonCard from './SkeletonCard';
import { useViewMode } from '@/hooks/useViewMode';

export default function RepositoryGrid({ repos, loading, emptyMessage = 'No systems found.', showTrendingBadge = true }) {
  const [view] = useViewMode();
  if (loading) {
    return (
      <div 
        aria-live="polite" 
        aria-busy="true"
        className={view === 'list' 
          ? "flex flex-col gap-4" 
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} view={view} />
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/60 bg-bg-card/50">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-bg-subtle border border-border mb-4 shadow-sm">
          <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-text text-base font-semibold mb-1">{emptyMessage}</p>
        <p className="text-text-muted text-sm max-w-sm">No matches found. Try adjusting your filters, searching for something else, or contributing a new project.</p>
      </div>
    );
  }

  return (
    <div className={view === 'list' 
      ? "flex flex-col gap-4" 
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}
    >
      {repos.map((repo, i) => (
        <RepositoryCard key={repo.id} repo={repo} index={i} view={view} showTrendingBadge={showTrendingBadge} />
      ))}
    </div>
  );
}
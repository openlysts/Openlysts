import RepositoryCard from './RepositoryCard';
import SkeletonCard from './SkeletonCard';

export default function RepositoryGrid({ repos, loading, emptyMessage = 'No repositories found.' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary text-lg font-medium mb-1">{emptyMessage}</p>
        <p className="text-text-muted text-sm">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {repos.map((repo, i) => (
        <RepositoryCard key={repo.id} repo={repo} index={i} />
      ))}
    </div>
  );
}
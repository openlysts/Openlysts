import RepositoryCard from './RepositoryCard';

export default function RepositoryGrid({ repos, loading, emptyMessage = 'No repositories found.' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 h-52 animate-pulse">
            <div className="h-4 bg-bg-subtle rounded w-2/3 mb-2" />
            <div className="h-3 bg-bg-subtle rounded w-1/3 mb-4" />
            <div className="h-3 bg-bg-subtle rounded w-full mb-1.5" />
            <div className="h-3 bg-bg-subtle rounded w-5/6 mb-4" />
            <div className="h-3 bg-bg-subtle rounded w-1/2 mt-auto" />
          </div>
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
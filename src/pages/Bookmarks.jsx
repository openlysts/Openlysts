import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { Bookmark, Trash2, X } from 'lucide-react';
import RepositoryCard from '@/components/openlyst/RepositoryCard';
import { getBookmarks, removeBookmark } from '@/lib/bookmarks';

export default function Bookmarks() {
  const [bookmarkIds, setBookmarkIds] = useState([]);

  useEffect(() => {
    const update = () => setBookmarkIds(getBookmarks());
    update();
    window.addEventListener('bookmarks-changed', update);
    return () => window.removeEventListener('bookmarks-changed', update);
  }, []);

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['bookmarks', bookmarkIds],
    queryFn: async () => {
      if (bookmarkIds.length === 0) return [];
      const all = await localClient.entities.Repository.list('-stars', 3000);
      const map = new Map(all.map((r) => [r.id, r]));
      return bookmarkIds.map((id) => map.get(id) || { id, _missing: true });
    },
    enabled: bookmarkIds.length > 0,
  });

  const handleRemove = (id) => {
    removeBookmark(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text mb-1">
        <Bookmark className="w-6 h-6 text-accent" />
        Your Bookmarks
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        {bookmarkIds.length} saved {bookmarkIds.length === 1 ? 'repository' : 'repositories'} · stored locally in your browser
      </p>

      {bookmarkIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-text-secondary text-lg font-medium mb-1">No bookmarks yet</p>
          <p className="text-text-muted text-sm">Click the bookmark icon on any repository to save it here.</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-52 animate-pulse">
              <div className="h-4 bg-bg-subtle rounded w-2/3 mb-2" />
              <div className="h-3 bg-bg-subtle rounded w-full mb-4" />
              <div className="h-3 bg-bg-subtle rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {repos.map((repo) =>
            repo._missing ? (
              <div key={repo.id} className="card p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-muted text-sm font-medium">Repository no longer available</span>
                  <button onClick={() => handleRemove(repo.id)} className="p-1.5 rounded-lg text-text-muted hover:text-nonoss hover:bg-nonoss-soft">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-text-muted text-xs flex-1">This repository has been removed and is no longer in the database.</p>
              </div>
            ) : (
              <div key={repo.id} className="relative">
                <RepositoryCard repo={repo} />
                <button
                  onClick={() => handleRemove(repo.id)}
                  className="absolute bottom-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-nonoss hover:bg-nonoss-soft transition-colors z-10"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderHeart, Sparkles, Plus, Star, Layers, ArrowRight, Tag, X } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/components/ui/use-toast';

export default function Collections() {
  usePageTitle('Collections');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTag, setSelectedTag] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newRepos, setNewRepos] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
      if (!res.ok) return { collections: [] };
      return res.json();
    },
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (/** @type {{ title: string; description: string; tags: string[]; repo_names: string[] }} */ payload) => {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewTags('');
      setNewRepos('');
      toast({
        title: 'Collection Created',
        description: 'Your open-source stack is now published for the community!',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const collections = data?.collections || [];
  const allTags = ['all', ...Array.from(new Set(collections.flatMap(c => c.tags || [])))];

  const filtered = selectedTag === 'all'
    ? collections
    : collections.filter(c => (c.tags || []).includes(selectedTag));

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle.trim(),
      description: newDesc.trim(),
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      repo_names: newRepos.split(',').map(r => r.trim()).filter(Boolean),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-accent-soft text-accent border border-accent/20">
              <Sparkles className="w-3 h-3" /> Community Curation
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight flex items-center gap-3">
            <FolderHeart className="w-8 h-8 text-accent" />
            Curated Collections
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Hand-picked software ecosystems, production stacks, and high-velocity toolchains assembled by open-source maintainers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-sm hover:opacity-90 transition-opacity shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Collection
        </button>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${
              selectedTag === tag
                ? 'bg-text text-bg shadow-sm'
                : 'bg-bg-subtle text-text-secondary hover:text-text hover:bg-bg-hover border border-border/40'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse bg-bg-card/60">
              <div className="h-5 bg-bg-subtle rounded w-2/3 mb-3" />
              <div className="h-4 bg-bg-subtle rounded w-full mb-2" />
              <div className="h-4 bg-bg-subtle rounded w-4/5 mb-6" />
              <div className="space-y-2">
                <div className="h-8 bg-bg-subtle rounded" />
                <div className="h-8 bg-bg-subtle rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-text-muted">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No collections found for "{selectedTag}".</p>
          <p className="text-xs mt-1">Be the first to create one for this category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((col) => (
            <div
              key={col.id || col.slug}
              className="card p-6 flex flex-col justify-between group hover:border-accent/40 transition-all duration-200 hover:shadow-xl bg-bg-card/90 backdrop-blur-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors">
                    {col.title}
                  </h2>
                  <span className="flex-shrink-0 text-xs font-mono font-bold text-text-muted flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    {col.stars_total ? `${(col.stars_total / 1000).toFixed(0)}k` : 'Curated'}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2">
                  {col.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {(col.tags || []).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg-subtle text-text-muted text-[11px] font-mono border border-border/30">
                      <Tag className="w-2.5 h-2.5" /> {t}
                    </span>
                  ))}
                </div>

                {/* Included Repositories List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                    Featured Systems ({col.repositories?.length || col.repo_names?.length || 0})
                  </span>
                  {(col.repositories && col.repositories.length > 0 ? col.repositories : (col.repo_names || []).map(name => ({ name }))).map((repo, rIdx) => (
                    <Link
                      key={rIdx}
                      to={repo.full_name ? `/repo/${repo.full_name}` : `/search?q=${encodeURIComponent(repo.name)}`}
                      className="p-2 rounded-lg bg-bg-subtle/50 hover:bg-bg-subtle border border-border/40 hover:border-accent/40 flex items-center justify-between text-xs transition-colors group/item"
                    >
                      <span className="font-mono font-medium text-text group-hover/item:text-accent truncate max-w-[180px]">
                        {repo.name}
                      </span>
                      {repo.stars > 0 && (
                        <span className="text-yellow-500 text-[11px] font-mono flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-yellow-500" />
                          {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-text-muted">
                <span>Curated by <strong className="text-text">{col.curator || 'Openlysts'}</strong></span>
                <button
                  type="button"
                  onClick={() => setActiveCollection(col)}
                  className="inline-flex items-center gap-1 font-bold text-accent hover:underline cursor-pointer"
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collection Detail Modal */}
      {activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card p-6 sm:p-8 max-w-2xl w-full bg-bg-card border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setActiveCollection(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
              aria-label="Close collection modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <FolderHeart className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-black text-text">{activeCollection.title}</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              {activeCollection.description}
            </p>

            {/* Meta Bar */}
            <div className="flex items-center gap-4 text-xs text-text-muted mb-6 pb-4 border-b border-border/50 flex-wrap">
              <span>Curator: <strong className="text-text">{activeCollection.curator || 'Openlysts'}</strong></span>
              {activeCollection.stars_total && (
                <span className="flex items-center gap-1 text-yellow-500 font-mono font-bold">
                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  {(activeCollection.stars_total / 1000).toFixed(0)}k total ecosystem stars
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {(activeCollection.tags || []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-subtle text-text-muted text-xs font-mono border border-border/40">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>

            {/* Included Repositories List */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Featured Repositories ({activeCollection.repositories?.length || activeCollection.repo_names?.length || 0})
              </h3>
              {(activeCollection.repositories && activeCollection.repositories.length > 0
                ? activeCollection.repositories
                : (activeCollection.repo_names || []).map(name => ({ name }))
              ).map((repo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-bg-subtle/60 border border-border/50 hover:border-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={repo.full_name ? `/repo/${repo.full_name}` : `/search?q=${encodeURIComponent(repo.name)}`}
                        onClick={() => setActiveCollection(null)}
                        className="font-mono font-bold text-sm text-text hover:text-accent truncate transition-colors"
                      >
                        {repo.full_name || repo.name}
                      </Link>
                      {repo.language && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-card border border-border text-text-muted">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {repo.description || 'High-performance open-source utility and infrastructure component.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {repo.stars > 0 && (
                      <span className="text-yellow-500 text-xs font-mono font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
                      </span>
                    )}
                    <Link
                      to={repo.full_name ? `/repo/${repo.full_name}` : `/search?q=${encodeURIComponent(repo.name)}`}
                      onClick={() => setActiveCollection(null)}
                      className="px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Explore in Search Button */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveCollection(null)}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text font-medium"
              >
                Close
              </button>
              <Link
                to={`/search?q=${encodeURIComponent((activeCollection.tags || []).join(' '))}&categories=${activeCollection.tags?.[0] || 'all'}`}
                onClick={() => setActiveCollection(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Search Similar Tools in Catalog <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card p-6 sm:p-8 max-w-lg w-full bg-bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FolderHeart className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-text">Create Open Collection</h2>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Next-Gen Local AI Infrastructure"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-subtle border border-border text-text text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe what makes this toolchain or ecosystem exceptional..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-subtle border border-border text-text text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="ai, llm, local, agents"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-subtle border border-border text-text text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1">
                  Repository Names (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newRepos}
                  onChange={(e) => setNewRepos(e.target.value)}
                  placeholder="ollama, vllm, langfuse, autogen"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-subtle border border-border text-text text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-accent text-accent-fg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Publishing...' : 'Publish Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

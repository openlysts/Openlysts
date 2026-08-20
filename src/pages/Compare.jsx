import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryRepos } from '@/lib/api';
import { motion } from 'framer-motion';
import { Star, GitFork, AlertCircle, X, Plus, Search, Trophy, ArrowRight, Activity, Flame } from 'lucide-react';
import LicenseBadge from '@/components/openlyst/LicenseBadge';
import { getDifficultyColor } from '@/lib/difficultyColors';

function formatStars(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const repoNames = searchParams.get('repos')?.split(',').filter(Boolean) || [];
  
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const { data: repos, isLoading } = useQuery({
    queryKey: ['compareRepos', repoNames],
    queryFn: async () => {
      if (repoNames.length === 0) return [];
      const results = [];
      for (const name of repoNames) {
        const res = await queryRepos({ q: name });
        const match = res?.results?.find(r => r.full_name.toLowerCase() === name.toLowerCase() || r.name.toLowerCase() === name.toLowerCase()) || res?.results?.[0];
        if (match) results.push(match);
      }
      return results;
    },
    enabled: true
  });

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (val.trim().length > 0) {
      try {
        const res = await queryRepos({ q: val.trim() });
        setSearchResults((res?.results || []).slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addRepo = (fullName) => {
    if (!repoNames.includes(fullName) && repoNames.length < 3) {
      const newNames = [...repoNames, fullName];
      setSearchParams({ repos: newNames.join(',') });
    }
    setSearchInput('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeRepo = (fullName) => {
    const newNames = repoNames.filter(n => n !== fullName);
    if (newNames.length > 0) {
      setSearchParams({ repos: newNames.join(',') });
    } else {
      setSearchParams({});
    }
  };

  if (repoNames.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-accent-soft text-accent mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-text mb-3 tracking-tight">Compare Repositories</h1>
        <p className="text-text-muted text-base max-w-md mx-auto mb-8">
          Select up to 3 open-source repositories to benchmark their popularity, activity, licenses, and architecture side-by-side.
        </p>
        
        <div className="relative max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search to add repository (e.g. react, vue)..." 
              value={searchInput}
              onChange={handleSearch}
              className="w-full bg-bg-card border border-border rounded-xl py-3 pl-11 pr-4 text-text placeholder:text-text-muted focus:outline-none focus:border-accent shadow-sm transition-colors"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-30">
              {searchResults.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => addRepo(r.full_name)}
                  className="w-full text-left px-4 py-3 hover:bg-bg-hover flex items-center justify-between transition-colors border-b border-border last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-text text-sm truncate">{r.name}</div>
                    <div className="text-xs text-text-muted truncate">{r.full_name}</div>
                  </div>
                  <Plus className="w-4 h-4 text-accent flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Max stars calculation for comparative bars
  const maxStars = Math.max(...(repos?.map(r => r.stars || 0) || [1]), 1);
  const maxForks = Math.max(...(repos?.map(r => r.forks || 0) || [1]), 1);

  const attributes = [
    { label: 'Description', key: 'description', render: (val) => <span className="text-sm line-clamp-3">{val || '—'}</span> },
    { label: 'Stars', key: 'stars', render: (val) => <span className="font-bold text-accent flex items-center gap-1"><Star className="w-4 h-4" /> {(val || 0).toLocaleString()}</span> },
    { label: 'Forks', key: 'forks', render: (val) => <span className="flex items-center gap-1"><GitFork className="w-4 h-4 text-text-muted" /> {(val || 0).toLocaleString()}</span> },
    { label: 'Issues', key: 'open_issues', render: (val) => <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-text-muted" /> {(val || 0).toLocaleString()}</span> },
    { label: 'Language', key: 'language', render: (val) => val || '—' },
    { label: 'License', key: 'license_status', render: (val, repo) => <LicenseBadge repo={repo} /> },
    { label: 'Trending Score', key: 'trending_score', render: (val) => <span className="text-emerald-500 font-medium">{val?.toFixed(1) || '0.0'}</span> },
    { label: 'Categories', key: 'categories', render: (val) => (val && val.length > 0 ? <div className="flex flex-wrap gap-1">{(val || []).map(c => <span key={c} className="bg-bg-hover text-xs px-2 py-1 rounded-md">{c}</span>)}</div> : '—') },
    { label: 'Created', key: 'github_created_at', render: (val) => <span className="text-sm">{val ? new Date(val).toLocaleDateString() : '—'}</span> },
    { label: 'Last Updated', key: 'github_updated_at', render: (val) => <span className="text-sm">{val ? new Date(val).toLocaleDateString() : '—'}</span> }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">Compare</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-accent-soft text-accent border border-accent/20">
              {repos?.length || repoNames.length}/3 Repos
            </span>
          </div>
          <p className="text-text-muted text-sm mt-1">Side-by-side benchmark of features, activity, and ecosystem metrics</p>
        </div>
        
        {repoNames.length < 3 && (
          <div className="relative w-full sm:w-72 z-20">
            {showSearch ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search repository to add..." 
                  value={searchInput}
                  onChange={handleSearch}
                  onBlur={() => setTimeout(() => setShowSearch(false), 250)}
                  className="w-full bg-bg-card border border-border rounded-xl py-2 pl-9 pr-8 text-sm text-text focus:outline-none focus:border-accent shadow-sm transition-colors"
                />
                <button onClick={() => setShowSearch(false)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  <X className="w-4 h-4" />
                </button>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-60 overflow-y-auto">
                    {searchResults.map(r => (
                      <button 
                        key={r.id} 
                        onMouseDown={() => addRepo(r.full_name)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-bg-hover flex items-center justify-between transition-colors border-b border-border last:border-0 text-sm"
                      >
                        <span className="truncate pr-2 font-medium text-text">{r.full_name}</span>
                        <Plus className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center justify-center gap-2 bg-bg-card hover:bg-bg-hover border border-dashed border-border rounded-xl py-2 px-3 text-sm font-semibold text-text-secondary hover:text-text transition-colors"
              >
                <Plus className="w-4 h-4 text-accent" /> Add Repository ({3 - repoNames.length} left)
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── MOBILE VIEW (< 768px): Industry-Standard Native Comparative Cards ─── */}
          <div className="block md:hidden space-y-5">
            {/* Top Repositories Grid */}
            <div className={`grid gap-2.5 ${repos?.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {repos?.map((repo) => (
                <div key={repo.id} className="relative p-3 rounded-xl border border-border bg-bg-card shadow-sm flex flex-col justify-between">
                  <button 
                    onClick={() => removeRepo(repo.full_name)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-bg-card border border-border shadow text-text-muted hover:text-red-400 flex items-center justify-center"
                    aria-label={`Remove ${repo.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div>
                    <Link to={`/repo/${repo.owner}/${repo.name}`} className="font-extrabold text-sm text-text hover:text-accent line-clamp-1 block">
                      {repo.name}
                    </Link>
                    <span className="text-[11px] text-text-muted block truncate mb-2">{repo.owner}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-accent">
                    <Star className="w-3 h-3 fill-accent" />
                    {formatStars(repo.stars)}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Metrics Battle Cards */}
            <div className="p-4 rounded-2xl border border-border bg-bg-card shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-accent" /> Key Metrics Comparison
              </h2>

              {/* Stars comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-text-secondary">
                  <span>Stars (GitHub Popularity)</span>
                </div>
                <div className="space-y-1.5">
                  {repos?.map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="w-20 text-[11px] font-semibold text-text truncate">{r.name}</span>
                      <div className="flex-1 h-3 bg-bg-subtle rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(8, ((r.stars || 0) / maxStars) * 100)}%` }} 
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-bold text-text">{formatStars(r.stars)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forks comparison */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs font-medium text-text-secondary">
                  <span>Forks (Community Adoption)</span>
                </div>
                <div className="space-y-1.5">
                  {repos?.map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="w-20 text-[11px] font-semibold text-text truncate">{r.name}</span>
                      <div className="flex-1 h-3 bg-bg-subtle rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(8, ((r.forks || 0) / maxForks) * 100)}%` }} 
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-bold text-text">{formatStars(r.forks)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues & Activity Row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                {repos?.map(r => (
                  <div key={r.id} className="p-2.5 rounded-xl bg-bg-subtle/60 border border-border/40">
                    <span className="text-[11px] font-bold text-text block truncate mb-1">{r.name}</span>
                    <div className="text-[11px] text-text-muted space-y-0.5">
                      <div className="flex justify-between">
                        <span>Open Issues:</span>
                        <strong className="text-text">{(r.open_issues || 0).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Trending:</span>
                        <strong className="text-emerald-500">{r.trending_score?.toFixed(1) || '0.0'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Specs & Attributes Cards */}
            <div className="p-4 rounded-2xl border border-border bg-bg-card shadow-sm space-y-3.5">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent" /> Tech Stack & Specifications
              </h2>

              {/* Language & License */}
              <div className="space-y-2">
                {repos?.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-border bg-bg/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-text font-bold">{r.name}</strong>
                      <LicenseBadge repo={r} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      {r.language && (
                        <span className="px-2 py-0.5 rounded-md bg-bg-card border border-border font-medium text-text">
                          {r.language}
                        </span>
                      )}
                      {r.difficulty && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getDifficultyColor(r.difficulty)}`}>
                          {r.difficulty}
                        </span>
                      )}
                      <span className="text-[11px] ml-auto">Updated {timeAgo(r.github_updated_at)}</span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pt-1 border-t border-border/40">
                        {r.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── DESKTOP / TABLET VIEW (>= 768px): Structured Side-by-Side Matrix Table ─── */}
          <div className="hidden md:block overflow-x-auto pb-4 touch-scroll rounded-2xl border border-border bg-bg-card shadow-lg">
            <div className="min-w-[700px] flex">
              {/* Attribute Labels Column */}
              <div className="w-44 lg:w-56 flex-shrink-0 bg-bg-card border-r border-border p-4 pr-5">
                <div className="h-20 flex items-end pb-2 font-extrabold text-xs text-text-muted uppercase tracking-wider">
                  Attributes
                </div>
                {attributes.map(attr => (
                  <div key={attr.key} className="h-16 flex items-center text-xs lg:text-sm font-semibold text-text-secondary border-b border-border/50 last:border-0">
                    {attr.label}
                  </div>
                ))}
              </div>

              {/* Repository Data Columns */}
              {repos?.map((repo) => (
                <motion.div 
                  key={repo.id} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 min-w-[220px] p-4 border-r border-border last:border-0 relative bg-bg/20 hover:bg-bg/40 transition-colors"
                >
                  <button 
                    onClick={() => removeRepo(repo.full_name)}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-bg-hover text-text-muted hover:text-red-400 transition-colors touch-target"
                    title="Remove from comparison"
                    aria-label={`Remove ${repo.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="h-20 flex flex-col justify-center pr-6">
                    <Link to={`/repo/${repo.owner}/${repo.name}`} className="font-extrabold text-base lg:text-lg text-text hover:text-accent transition-colors truncate block">
                      {repo.name}
                    </Link>
                    <span className="text-xs text-text-muted truncate block">{repo.owner}</span>
                  </div>
                  
                  {attributes.map(attr => (
                    <div key={attr.key} className="h-16 flex items-center text-text border-b border-border/50 last:border-0 overflow-hidden text-xs lg:text-sm">
                      {attr.render(repo[attr.key], repo)}
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

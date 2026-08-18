import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Star, GitFork, AlertCircle, X, Plus, Search } from 'lucide-react';
import LicenseBadge from '@/components/openlyst/LicenseBadge';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
        const res = await localClient.entities.Repository.filter({ full_name: name });
        if (res && res.length > 0) results.push(res[0]);
      }
      return results;
    },
    enabled: true
  });

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (val.length > 2) {
      const allRepos = await localClient.entities.Repository.list('-stars', 3000);
      const query = val.toLowerCase();
      const matches = allRepos.filter(r => r.full_name.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)).slice(0, 5);
      setSearchResults(matches);
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
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Compare Repositories</h1>
        <p className="text-text-muted mb-8">Select up to 3 repositories to compare their stats, languages, and activity.</p>
        
        <div className="relative max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search to add repository..." 
              value={searchInput}
              onChange={handleSearch}
              className="w-full bg-bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-10">
              {searchResults.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => addRepo(r.full_name)}
                  className="w-full text-left px-4 py-3 hover:bg-bg-hover flex items-center justify-between transition-colors border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-medium text-text">{r.name}</div>
                    <div className="text-xs text-text-muted">{r.full_name}</div>
                  </div>
                  <Plus className="w-4 h-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Compare</h1>
          <p className="text-text-muted text-sm mt-1">Side-by-side comparison of selected repositories</p>
        </div>
        
        {repoNames.length < 3 && (
          <div className="relative w-full sm:w-72 z-20">
            {showSearch ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search repository..." 
                  value={searchInput}
                  onChange={handleSearch}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  className="w-full bg-bg-card border border-border rounded-lg py-2 pl-9 pr-8 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                />
                <button onClick={() => setShowSearch(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  <X className="w-4 h-4" />
                </button>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    {searchResults.map(r => (
                      <button 
                        key={r.id} 
                        onMouseDown={() => addRepo(r.full_name)}
                        className="w-full text-left px-3 py-2 hover:bg-bg-hover flex items-center justify-between transition-colors border-b border-border last:border-0 text-sm"
                      >
                        <span className="truncate pr-2 text-text">{r.full_name}</span>
                        <Plus className="w-3 h-3 text-text-muted flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center justify-center gap-2 bg-bg-card hover:bg-bg-hover border border-dashed border-border rounded-lg py-2 text-sm text-text-muted hover:text-text transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Repository
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px] flex">
            {/* Headers Column */}
            <div className="w-48 flex-shrink-0 border-r border-border pr-4">
              <div className="h-24"></div> {/* Spacer for repo header */}
              {attributes.map(attr => (
                <div key={attr.key} className="h-16 flex items-center text-sm font-medium text-text-muted border-b border-border/50">
                  {attr.label}
                </div>
              ))}
            </div>

            {/* Repository Columns */}
            {repos?.map((repo) => (
              <motion.div 
                key={repo.id} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-w-[250px] px-4 border-r border-border last:border-0 relative"
              >
                <button 
                  onClick={() => removeRepo(repo.full_name)}
                  className="absolute top-0 right-4 p-1 rounded-full hover:bg-bg-hover text-text-muted hover:text-red-400 transition-colors"
                  title="Remove from comparison"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="h-24 flex flex-col justify-center">
                  <Link to={`/repo/${repo.owner}/${repo.name}`} className="font-bold text-lg text-text hover:text-accent transition-colors truncate block pr-6">
                    {repo.name}
                  </Link>
                  <span className="text-xs text-text-muted truncate block">{repo.owner}</span>
                </div>
                
                {attributes.map(attr => (
                  <div key={attr.key} className="h-16 flex items-center text-text border-b border-border/50 overflow-hidden">
                    {attr.render(repo[attr.key], repo)}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

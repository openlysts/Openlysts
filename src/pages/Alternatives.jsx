import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, ExternalLink, PlayCircle, Info, ChevronRight, Scale, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import RepositoryCard from '@/components/openlyst/RepositoryCard';

async function fetchAlternatives(category, search) {
  const res = await fetch('/api/functions/queryAlternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, search })
  });
  if (!res.ok) throw new Error('Failed to fetch alternatives');
  return res.json();
}

export default function Alternatives() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const navigate = useNavigate();

  // Debounce search
  useMemo(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['alternatives', activeCategory, debouncedSearch],
    queryFn: () => fetchAlternatives(activeCategory, debouncedSearch),
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const categories = useMemo(() => {
    if (data?.categories) {
      return ['All', ...data.categories];
    }
    return ['All'];
  }, [data?.categories]);

  const toggleCompare = (e, alt) => {
    e.stopPropagation();
    if (selectedForCompare.find(s => s.id === alt.id)) {
      setSelectedForCompare(prev => prev.filter(s => s.id !== alt.id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare(prev => [...prev, alt]);
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 relative">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-text mb-2">
            {activeCategory === 'All' ? 'All Open Source Alternatives' : `${activeCategory} Alternatives`}
          </h1>
          <p className="text-text-secondary">
            {data?.total ? `Found ${data.total} tools giving you data ownership without the price tag.` : 'Loading alternatives...'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full sm:w-64 bg-bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
                activeCategory !== 'All' 
                  ? 'bg-accent-soft text-accent border-accent' 
                  : 'bg-bg-card text-text-secondary border-border hover:border-border-strong'
              }`}
            >
              {activeCategory === 'All' ? 'Categories' : activeCategory}
              <ChevronRight className={`w-3 h-3 transition-transform ${categoriesExpanded ? 'rotate-90' : 'rotate-90'}`} />
            </button>
            {categoriesExpanded && (
              <div className="absolute top-full right-0 mt-2 w-64 p-2 rounded-xl border border-border bg-bg-card shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setActiveCategory(c); setCategoriesExpanded(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === c
                          ? 'bg-accent-soft text-accent font-medium'
                          : 'text-text hover:bg-bg-hover'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content (Masonry Grid) */}
      <main>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-text-muted">
            Failed to load alternatives.
          </div>
        )}

        {data?.alternatives && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 auto-rows-max">
            {data.alternatives.map((alt, idx) => (
              <motion.div
                key={alt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                onClick={() => setSelectedAlt(alt)}
                className={`bg-bg-card border ${selectedForCompare.find(s => s.id === alt.id) ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-accent/50'} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group flex flex-col h-full relative`}
              >
                <button
                  onClick={(e) => toggleCompare(e, alt)}
                  className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-sm ${
                    selectedForCompare.find(s => s.id === alt.id)
                      ? 'bg-accent border-bg text-bg scale-100'
                      : 'bg-bg-card border-border text-transparent hover:border-accent/50 group-hover:scale-100 scale-0'
                  }`}
                >
                  ✓
                </button>
                <div className="flex justify-between items-start mb-2">
                  <div className="pr-2">
                    <h3 className="text-base font-bold text-text group-hover:text-accent transition-colors leading-tight">
                      {alt.repo?.name || alt.free_tool_repo.split('/').pop()}
                    </h3>
                    <p className="text-[11px] font-medium text-text-secondary mt-1 flex items-center gap-1">
                      vs <span className="text-text bg-bg-subtle px-1.5 py-0.5 rounded border border-border">{alt.paid_tool_name}</span>
                    </p>
                  </div>
                  {alt.repo && (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/20">
                        ★ {alt.repo.stars >= 1000 ? (alt.repo.stars / 1000).toFixed(1) + 'k' : alt.repo.stars}
                      </div>
                      {alt.feature_parity_score >= 90 && alt.repo.stars >= 10000 && (
                        <div title="Editor's Choice: High feature parity and extremely popular" className="flex items-center gap-1 bg-accent/10 text-accent text-[9px] font-bold px-1.5 py-0.5 rounded border border-accent/20">
                          <Award className="w-3 h-3" /> Editor's Choice
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-text-secondary line-clamp-2 mb-3 flex-grow leading-relaxed">
                  {alt.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                   <div className="flex items-center gap-1.5">
                     <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                       alt.migration_difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                       alt.migration_difficulty === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                       'bg-red-500/10 text-red-500 border-red-500/20'
                     }`}>
                       {alt.migration_difficulty || 'Medium'}
                     </span>
                     <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/20">
                       {alt.feature_parity_score || 85}% Parity
                     </span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </div>
              </motion.div>
            ))}

            {data.alternatives.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-20 text-text-muted border border-dashed border-border rounded-2xl">
                No tools found for this category or search.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Compare Dock */}
      <AnimatePresence>
        {selectedForCompare.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 z-40"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text">
                {selectedForCompare.length} selected to compare
              </span>
              <div className="flex -space-x-2">
                {selectedForCompare.map(s => (
                  <div key={s.id} className="w-8 h-8 rounded-full bg-bg-subtle border-2 border-bg-card flex items-center justify-center text-[10px] font-bold text-text-secondary" title={s.repo?.name || s.free_tool_repo.split('/').pop()}>
                    {(s.repo?.name || s.free_tool_repo.split('/').pop()).charAt(0)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <button 
                onClick={() => setSelectedForCompare([])}
                className="text-xs font-medium text-text-muted hover:text-text transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const repos = selectedForCompare.map(s => s.free_tool_repo).filter(Boolean);
                  if (repos.length > 0) {
                    navigate(`/compare?repos=${repos.join(',')}`);
                  }
                }}
                className="bg-text text-bg px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform"
              >
                Compare Side-by-Side
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal / Expanded View for Educational Hub */}
      <AnimatePresence>
        {selectedAlt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAlt(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
               {/* Modal Header */}
               <div className="p-6 border-b border-border flex justify-between items-start bg-bg-subtle/50">
                  <div>
                    <h2 className="text-3xl font-bold text-text mb-2">{selectedAlt.repo?.name || selectedAlt.free_tool_repo.split('/').pop()}</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        Alternative to <strong className="text-text bg-bg border border-border px-2 py-1 rounded shadow-sm">{selectedAlt.paid_tool_name}</strong>
                      </span>
                      <a 
                        href={selectedAlt.free_tool_repo?.startsWith('http') ? selectedAlt.free_tool_repo : `https://github.com/${selectedAlt.free_tool_repo}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs flex items-center gap-1 text-accent hover:underline bg-accent/10 px-2 py-1 rounded-lg border border-accent/20 transition-colors hover:bg-accent/20"
                      >
                        {selectedAlt.free_tool_repo?.startsWith('http') ? 'View Website' : 'View Repository'} <ExternalLink className="w-3 h-3" />
                      </a>
                      {selectedAlt.repo && (
                        <Link 
                          to={`/compare?repos=${selectedAlt.repo.full_name}`}
                          className="text-xs flex items-center gap-1 text-text-secondary hover:text-text hover:underline bg-bg-subtle px-2 py-1 rounded-lg border border-border transition-colors hover:border-accent/50"
                        >
                          <Scale className="w-3 h-3" /> Compare side-by-side
                        </Link>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlt(null)} className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text transition-colors">
                    ✕
                  </button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Details & Pros/Cons */}
                    <div className="lg:col-span-2 space-y-8">
                       <section>
                         <h3 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                           <Info className="w-5 h-5 text-accent" /> Why It's Better
                         </h3>
                         <p className="text-text-secondary leading-relaxed bg-bg-subtle p-4 rounded-xl border border-border/50">
                           {selectedAlt.why_it_is_better || selectedAlt.description}
                         </p>
                       </section>

                       <section>
                         <h3 className="text-lg font-bold text-text mb-4">Pros & Cons vs {selectedAlt.paid_tool_name}</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                              <h4 className="text-green-500 font-bold mb-3 flex items-center gap-2">
                                <span className="bg-green-500/20 p-1 rounded-full text-xs">👍</span> Pros
                              </h4>
                              <ul className="space-y-2 text-sm text-text-secondary">
                                {selectedAlt.pros_and_cons?.map((pc, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span>{pc.pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                              <h4 className="text-orange-500 font-bold mb-3 flex items-center gap-2">
                                <span className="bg-orange-500/20 p-1 rounded-full text-xs">👎</span> Cons
                              </h4>
                              <ul className="space-y-2 text-sm text-text-secondary">
                                {selectedAlt.pros_and_cons?.map((pc, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    <span>{pc.con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                         </div>
                       </section>

                       {selectedAlt.repo && (
                         <section>
                           <h3 className="text-lg font-bold text-text mb-4">Repository Stats</h3>
                           <RepositoryCard repo={selectedAlt.repo} />
                         </section>
                       )}
                    </div>

                    {/* Right Col: Learning Hub */}
                    <div className="space-y-6">
                      <div className="bg-bg-subtle rounded-2xl p-5 border border-border">
                        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-red-500" /> Learning Hub
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                          Master <strong>{selectedAlt.repo?.name || selectedAlt.free_tool_repo.split('/').pop()}</strong> quickly with these community resources.
                        </p>
                        <a 
                          href={selectedAlt.youtube_tutorial_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <PlayCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-text group-hover:text-red-500 transition-colors">YouTube Crash Courses</div>
                            <div className="text-xs text-text-muted">Find setup guides & tutorials</div>
                          </div>
                        </a>
                      </div>

                      <div className="bg-bg-subtle rounded-2xl p-5 border border-border">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Migration Intel</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-text">Difficulty</span>
                              <span className="font-bold text-accent">{selectedAlt.migration_difficulty || 'Medium'}</span>
                            </div>
                            <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                              <div className={`h-full ${
                                selectedAlt.migration_difficulty === 'Easy' ? 'bg-green-500 w-1/3' :
                                selectedAlt.migration_difficulty === 'Medium' ? 'bg-orange-500 w-2/3' :
                                'bg-red-500 w-full'
                              }`} />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-text">Feature Parity</span>
                              <span className="font-bold text-accent">{selectedAlt.feature_parity_score || 85}%</span>
                            </div>
                            <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                              <div className="h-full bg-accent" style={{ width: `${selectedAlt.feature_parity_score || 85}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

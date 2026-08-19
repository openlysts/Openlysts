import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, Search, ExternalLink, PlayCircle, Info, ChevronRight, ChevronDown, Award, Grid3X3, List, ArrowUpDown, Shield,
  Layers, Filter, X, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RepositoryCard from '@/components/openlyst/RepositoryCard';

async function fetchAlternatives(category, search, sort) {
  const res = await fetch('/api/functions/queryAlternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, search, sort })
  });
  if (!res.ok) throw new Error('Failed to fetch alternatives');
  return res.json();
}

// Score Ring Component
function ScoreRing({ score, size = 44, strokeWidth = 3.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const color = score >= 80 ? 'var(--accent)' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/30" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="absolute text-xs font-black" style={{ color }}>{score}</span>
    </div>
  );
}

// Category Icon mapping
const categoryIcons = {
  'CMS': '📝', 'Notetaking': '📒', 'Project Management': '📋', 'Auth & SSO': '🔐',
  'Internal Tools': '🔧', 'E-commerce': '🛒', 'Platform as a service': '☁️',
  'No-code database': '🗃️', 'Design': '🎨', 'Backend as a service': '⚡',
  'Enterprise Search': '🔍', 'Website analytics': '📊', 'Timeseries database': '📈',
  'Observability and monitoring': '👁️', 'Messaging': '💬', 'Cybersecurity': '🛡️',
  'Communication': '📞', 'Financial Service': '💰', 'API Platform': '🔌',
  'Workflow automation': '⚙️', 'Feature flag and toggle management': '🚩',
  'ELT / ETL': '🔄', 'Password manager': '🔑', 'ML Ops': '🤖',
  'Graph database': '🕸️', 'Video Conferencing': '📹', 'Metrics store': '📉',
  'File Hosting': '📁', 'Customer Engagement': '🤝', 'AI': '🧠',
  'Social Media': '📱', 'Product Analytics': '📐', 'Helpdesk Solution': '🎧',
  'Form Building': '📋', 'Digital Signature': '✍️', 'Customer Data Platform': '👤',
  'Community Platform': '👥', 'Log Management': '📜', 'Email marketing': '📧',
  'Cloud Storage': '💾', 'Business Intelligence': '📊', 'Scheduling': '📅',
  'ERP': '🏢', 'Forum Software': '💭'
};

const sortOptions = [
  { value: 'score', label: 'Openlysts Score' },
  { value: 'stars', label: 'GitHub Stars' },
  { value: 'parity', label: 'Feature Parity' },
  { value: 'name', label: 'Name A→Z' },
  { value: 'difficulty', label: 'Easiest First' },
];

export default function Alternatives() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [sortBy, setSortBy] = useState('score');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const categoryRefs = useRef({});
  const sortRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['alternatives', debouncedSearch, sortBy],
    queryFn: () => fetchAlternatives('All', debouncedSearch, sortBy),
    staleTime: 5 * 60 * 1000,
  });

  // Client-side category filter so sidebar clicks are instant
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (activeCategory === 'All') return data;

    const filtered = data.alternatives.filter(a => a.category === activeCategory);
    const grouped = {};
    for (const alt of filtered) {
      const cat = alt.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = {};
      const paid = alt.paid_tool_name || 'Unknown';
      if (!grouped[cat][paid]) grouped[cat][paid] = [];
      grouped[cat][paid].push(alt);
    }
    
    // Helper to get the value to sort by
    const getSortValue = (alt) => {
      switch (sortBy) {
        case 'score': return alt.openlysts_score || 0;
        case 'stars': return alt.github_stars || 0;
        case 'parity': return alt.feature_parity || 0;
        case 'difficulty': return alt.migration_difficulty === 'Easy' ? 3 : alt.migration_difficulty === 'Medium' ? 2 : 1;
        case 'name': return (alt.free_tool_name || alt.name || '').toLowerCase();
        default: return alt.openlysts_score || 0;
      }
    };
    
    // name and difficulty sort ascending, others descending
    const isAscending = sortBy === 'name' || sortBy === 'difficulty';
    
    const sortAlts = (alts) => {
      return [...alts].sort((a, b) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB);
        }
        return isAscending ? valA - valB : valB - valA;
      });
    };

    const groupedArray = Object.entries(grouped)
      .map(([categoryName, paidGroups]) => {
        const paidGroupsArray = Object.entries(paidGroups)
          .map(([paidName, alts]) => {
            const sortedAlts = sortAlts(alts);
            return {
              paid_tool_name: paidName,
              alternatives: sortedAlts,
              count: sortedAlts.length,
              best_sort_value: getSortValue(sortedAlts[0])
            };
          })
          .sort((a, b) => {
             if (typeof a.best_sort_value === 'string' && typeof b.best_sort_value === 'string') {
               return a.best_sort_value.localeCompare(b.best_sort_value);
             }
             return isAscending ? a.best_sort_value - b.best_sort_value : b.best_sort_value - a.best_sort_value;
          });
          
        return {
          category: categoryName,
          paid_groups: paidGroupsArray,
          total: paidGroupsArray.reduce((sum, g) => sum + g.count, 0)
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      ...data,
      alternatives: filtered,
      grouped: groupedArray,
      stats: { ...data.stats, total_tools: filtered.length }
    };
  }, [data, activeCategory, sortBy]);

  // Auto-expand all categories on load
  useEffect(() => {
    if (data?.grouped) {
      setExpandedCategories(new Set(data.grouped.map(g => g.category)));
    }
  }, [data?.grouped]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const scrollToCategory = (cat) => {
    setActiveCategory('All');
    setTimeout(() => {
      categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setExpandedCategories(prev => new Set([...prev, cat]));
    }, 100);
  };

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

  const getDifficultyColor = (d) => {
    if (d === 'Easy') return 'bg-green-500/15 text-green-400 border-green-500/25';
    if (d === 'Medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    return 'bg-red-500/15 text-red-400 border-red-500/25';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Basic';
  };

  const renderCard = (alt, idx) => (
    <motion.div
      key={alt.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
      onClick={() => setSelectedAlt(alt)}
      className={`group relative bg-bg-card border ${
        selectedForCompare.find(s => s.id === alt.id) 
          ? 'border-accent ring-1 ring-accent/50' 
          : 'border-border hover:border-accent/40'
      } rounded-xl cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 ${
        viewMode === 'list' ? 'flex items-center gap-4 p-3' : 'flex flex-col p-4'
      }`}
    >
      {/* Compare checkbox */}
      <button
        onClick={(e) => toggleCompare(e, alt)}
        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-sm text-xs ${
          selectedForCompare.find(s => s.id === alt.id)
            ? 'bg-accent border-bg text-bg scale-100'
            : 'bg-bg-card border-border text-transparent hover:border-accent/50 group-hover:scale-100 scale-0'
        }`}
      >
        ✓
      </button>

      {viewMode === 'grid' ? (
        <>
          {/* Grid Card Header */}
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">
                {alt.resolved_name}
              </h3>
              <p className="text-[10px] font-medium text-text-muted mt-0.5 flex items-center gap-1">
                replaces <span className="text-text-secondary bg-bg-subtle px-1.5 py-0.5 rounded border border-border text-[10px]">{alt.paid_tool_name}</span>
              </p>
            </div>
            <ScoreRing score={alt.openlysts_score} size={40} strokeWidth={3} />
          </div>

          {/* Description */}
          <p className="text-xs text-text-secondary line-clamp-2 mb-3 flex-grow leading-relaxed">{alt.description}</p>

          {/* Footer Badges */}
          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border/40">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getDifficultyColor(alt.migration_difficulty)}`}>
                {alt.migration_difficulty || 'Medium'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/20">
                {alt.feature_parity_score || 70}% Match
              </span>
              {alt.repo && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-0.5">
                  ★ {alt.repo.stars >= 1000 ? (alt.repo.stars / 1000).toFixed(1) + 'k' : alt.repo.stars || 0}
                </span>
              )}
            </div>
            {alt.openlysts_score >= 80 && alt.repo?.stars >= 5000 && (
              <div title="Top Pick" className="flex items-center gap-0.5 text-accent text-[9px] font-bold">
                <Award className="w-3 h-3" /> Top Pick
              </div>
            )}
          </div>
        </>
      ) : (
        /* List View */
        <>
          <ScoreRing score={alt.openlysts_score} size={36} strokeWidth={3} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">{alt.resolved_name}</h3>
              <span className="text-[10px] text-text-muted">replaces</span>
              <span className="text-[10px] text-text-secondary bg-bg-subtle px-1.5 py-0.5 rounded border border-border">{alt.paid_tool_name}</span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{alt.description}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getDifficultyColor(alt.migration_difficulty)}`}>
              {alt.migration_difficulty || 'Medium'}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/20">
              {alt.feature_parity_score || 70}%
            </span>
            {alt.repo && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                ★ {alt.repo.stars >= 1000 ? (alt.repo.stars / 1000).toFixed(1) + 'k' : alt.repo.stars || 0}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
        </>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 relative">

      {/* ─── Hero Header ─── */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h1 className="text-3xl font-black text-text tracking-tight">
                {activeCategory === 'All' ? 'Open Source Alternatives' : `${activeCategory}`}
              </h1>
            </div>
            <p className="text-sm text-text-secondary max-w-xl">
              Discover {data?.stats?.total_tools || '...'} curated open-source replacements for {data?.stats?.total_paid_tools || '...'} paid tools across {data?.stats?.total_categories || '...'} categories — each scored by the Openlysts algorithm.
            </p>
          </div>

          {/* Stats Pills */}
          {data?.stats && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-bg-card/50 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2 text-center shadow-sm">
                <div className="text-xl font-black text-accent">{data.stats.total_tools}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Tools</div>
              </div>
              <div className="bg-bg-card/50 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2 text-center shadow-sm">
                <div className="text-xl font-black text-text">{data.stats.total_categories}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Categories</div>
              </div>
              <div className="bg-bg-card/50 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2 text-center shadow-sm">
                <div className="text-xl font-black text-amber-400">{data.stats.avg_score}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Avg Score</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Controls Bar ─── */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools, categories, or SaaS products..."
              className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortRef}>
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 bg-bg-card border border-border hover:border-accent/50 rounded-xl px-3 py-2 text-sm text-text-secondary font-medium transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 py-1"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortBy === option.value 
                          ? 'bg-accent/10 text-accent font-bold' 
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-bg-card border border-border rounded-xl overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'}`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl border transition-colors ${sidebarOpen ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-card text-text-muted border-border hover:text-text'}`}
            title="Toggle category sidebar"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Active Category Chip */}
          {activeCategory !== 'All' && (
            <button 
              onClick={() => setActiveCategory('All')}
              className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-3 py-1.5 rounded-full border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              {categoryIcons[activeCategory] || '📂'} {activeCategory}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Layout: Sidebar + Content ─── */}
      <div className="flex gap-5">

        {/* ─── Sidebar ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="w-[220px] sticky top-20">
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Categories
                    </h3>
                  </div>
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                        activeCategory === 'All' ? 'bg-accent/10 text-accent border-l-2 border-accent' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                      }`}
                    >
                      <span>All Tools</span>
                      <span className="text-[10px] bg-bg-subtle px-1.5 py-0.5 rounded font-bold">{data?.stats?.total_tools || 0}</span>
                    </button>
                    {data?.categories?.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-1 ${
                          activeCategory === cat.name 
                            ? 'bg-accent/10 text-accent font-bold border-l-2 border-accent' 
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-sm">{categoryIcons[cat.name] || '📂'}</span>
                          {cat.name}
                        </span>
                        <span className="text-[10px] bg-bg-subtle px-1.5 py-0.5 rounded font-bold flex-shrink-0">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-text-muted">Loading alternatives...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-text-muted">
              Failed to load alternatives. Please try again.
            </div>
          )}

          {/* Flat view when searching or specific category */}
          {data?.alternatives && (activeCategory !== 'All' || debouncedSearch) && (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3' 
              : 'flex flex-col gap-2'
            }>
              {data.alternatives.map((alt, idx) => renderCard(alt, idx))}
              {data.alternatives.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-16 text-text-muted border border-dashed border-border rounded-2xl">
                  <Search className="w-8 h-8 mx-auto mb-3 text-text-muted/50" />
                  <p className="font-medium">No tools found</p>
                  <p className="text-xs mt-1">Try adjusting your search or category filter.</p>
                </div>
              )}
            </div>
          )}

          {/* Grouped view (default: All categories, no search) */}
          {data?.grouped && activeCategory === 'All' && !debouncedSearch && (
            <div className="space-y-4">
              {data.grouped.map((group) => (
                <div 
                  key={group.category} 
                  ref={el => categoryRefs.current[group.category] = el}
                  className="bg-bg-card/50 border border-border rounded-xl overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bg-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{categoryIcons[group.category] || '📂'}</span>
                      <div className="text-left">
                        <h2 className="text-base font-bold text-text">{group.category}</h2>
                        <p className="text-[11px] text-text-muted">
                          {group.total} tool{group.total !== 1 ? 's' : ''} · {group.paid_groups.length} SaaS replacement{group.paid_groups.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted bg-bg-subtle px-2 py-1 rounded-lg border border-border">
                        {group.total}
                      </span>
                      {expandedCategories.has(group.category) 
                        ? <ChevronDown className="w-4 h-4 text-text-muted" />
                        : <ChevronRight className="w-4 h-4 text-text-muted" />
                      }
                    </div>
                  </button>

                  {/* Category Content */}
                  <AnimatePresence>
                    {expandedCategories.has(group.category) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-4">
                          {group.paid_groups.map((pg) => (
                            <div key={pg.paid_tool_name}>
                              {/* Paid Tool Subheader */}
                              <div className="flex items-center gap-2 mb-2.5 mt-1">
                                <div className="h-px flex-1 bg-border/50" />
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 px-2">
                                  <Shield className="w-3 h-3" />
                                  Replaces {pg.paid_tool_name}
                                  <span className="text-accent">({pg.count})</span>
                                </span>
                                <div className="h-px flex-1 bg-border/50" />
                              </div>

                              {/* Cards */}
                              <div className={viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
                                : 'flex flex-col gap-2'
                              }>
                                {pg.alternatives.map((alt, idx) => renderCard(alt, idx))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ─── Floating Compare Dock ─── */}
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
                {selectedForCompare.length} selected
              </span>
              <div className="flex -space-x-2">
                {selectedForCompare.map(s => (
                  <div key={s.id} className="w-8 h-8 rounded-full bg-bg-subtle border-2 border-bg-card flex items-center justify-center text-[10px] font-bold text-text-secondary" title={s.resolved_name}>
                    {(s.resolved_name || '?').charAt(0)}
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

      {/* ─── Detail Modal ─── */}
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
                    <div className="flex items-center gap-3 mb-2">
                      <ScoreRing score={selectedAlt.openlysts_score} size={52} strokeWidth={4} />
                      <div>
                        <h2 className="text-2xl font-black text-text">{selectedAlt.resolved_name}</h2>
                        <span className="text-xs font-bold text-text-muted uppercase">{getScoreLabel(selectedAlt.openlysts_score)} Alternative</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        Replaces <strong className="text-text bg-bg border border-border px-2 py-1 rounded shadow-sm">{selectedAlt.paid_tool_name}</strong>
                      </span>
                      {selectedAlt.category && (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg border border-accent/20">
                          {categoryIcons[selectedAlt.category] || '📂'} {selectedAlt.category}
                        </span>
                      )}
                      <a 
                        href={selectedAlt.free_tool_repo?.startsWith('http') ? selectedAlt.free_tool_repo : `https://github.com/${selectedAlt.free_tool_repo}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs flex items-center gap-1 text-accent hover:underline bg-accent/10 px-2 py-1 rounded-lg border border-accent/20 transition-colors hover:bg-accent/20"
                      >
                        {selectedAlt.free_tool_repo?.startsWith('http') ? 'Visit Website' : 'View Repository'} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlt(null)} className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text transition-colors">
                    ✕
                  </button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col */}
                    <div className="lg:col-span-2 space-y-8">
                       <section>
                         <h3 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                           <Info className="w-5 h-5 text-accent" /> Why Switch?
                         </h3>
                         <p className="text-text-secondary leading-relaxed bg-bg-subtle p-4 rounded-xl border border-border/50">
                           {selectedAlt.why_it_is_better || selectedAlt.description || 'A high-quality open-source alternative with active community support.'}
                         </p>
                       </section>

                       <section>
                         <h3 className="text-lg font-bold text-text mb-4">Pros & Cons vs {selectedAlt.paid_tool_name}</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                              <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                                <span className="bg-green-500/20 p-1 rounded-full text-xs">👍</span> Pros
                              </h4>
                              <ul className="space-y-2 text-sm text-text-secondary">
                                {selectedAlt.pros_and_cons?.map((pc, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-green-400 mt-0.5">•</span>
                                    <span>{pc.pro}</span>
                                  </li>
                                )) || (
                                  <li className="text-text-muted italic">Community-driven and free to use</li>
                                )}
                              </ul>
                            </div>
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                              <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                                <span className="bg-orange-500/20 p-1 rounded-full text-xs">👎</span> Cons
                              </h4>
                              <ul className="space-y-2 text-sm text-text-secondary">
                                {selectedAlt.pros_and_cons?.map((pc, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <span>{pc.con}</span>
                                  </li>
                                )) || (
                                  <li className="text-text-muted italic">May require self-hosting</li>
                                )}
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

                    {/* Right Col */}
                    <div className="space-y-6">
                      {/* Score Breakdown */}
                      <div className="bg-bg-subtle rounded-2xl p-5 border border-border">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent" /> Openlysts Score
                        </h3>
                        <div className="flex items-center justify-center mb-4">
                          <ScoreRing score={selectedAlt.openlysts_score} size={80} strokeWidth={5} />
                        </div>
                        <p className="text-center text-xs text-text-muted mb-4">{getScoreLabel(selectedAlt.openlysts_score)} Alternative</p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-secondary">Feature Parity</span>
                              <span className="font-bold text-text">{selectedAlt.feature_parity_score || 70}%</span>
                            </div>
                            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${selectedAlt.feature_parity_score || 70}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-secondary">Migration Ease</span>
                              <span className="font-bold text-text">{selectedAlt.migration_difficulty || 'Medium'}</span>
                            </div>
                            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                selectedAlt.migration_difficulty === 'Easy' ? 'bg-green-500 w-full' :
                                selectedAlt.migration_difficulty === 'Medium' ? 'bg-amber-500 w-2/3' :
                                'bg-red-500 w-1/3'
                              }`} />
                            </div>
                          </div>
                          {selectedAlt.repo && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-text-secondary">Community</span>
                                <span className="font-bold text-text">★ {selectedAlt.repo.stars?.toLocaleString() || 0}</span>
                              </div>
                              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (selectedAlt.repo.stars || 0) / 500)}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Learning Hub */}
                      <div className="bg-bg-subtle rounded-2xl p-5 border border-border">
                        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-red-500" /> Learning Hub
                        </h3>
                        <a 
                          href={selectedAlt.youtube_tutorial_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedAlt.resolved_name + ' tutorial')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <PlayCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-text group-hover:text-red-500 transition-colors">YouTube Tutorials</div>
                            <div className="text-xs text-text-muted">Find setup guides & tutorials</div>
                          </div>
                        </a>
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

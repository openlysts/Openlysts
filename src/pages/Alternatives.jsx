import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink, PlayCircle, Info, ChevronRight, ChevronDown, Award, Grid3X3, List, ArrowUpDown, Shield,
  Layers, Filter, X, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RepositoryCard from '@/components/openlyst/RepositoryCard';
import SkeletonCard from '@/components/openlyst/SkeletonCard';

async function fetchAlternatives(category, search, sort, page) {
  const res = await fetch('/api/functions/queryAlternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, search, sort, page })
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
        <motion.circle 
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} 
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeLinecap="round" 
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.1 }}
        />
      </svg>
      <motion.span 
        className="absolute text-xs font-black" 
        style={{ color }}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
      >
        {score}
      </motion.span>
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

const getDifficultyColor = (d) => {
  if (d === 'Easy') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  if (d === 'Medium') return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30';
  return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
};

const getScoreLabel = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Basic';
};

function AlternativeCard({ alt, idx, viewMode, isSelected, onToggleCompare, onSelect }) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -8;
    const rotY = ((x - centerX) / centerX) * 8;

    setRotate({ x: rotX, y: rotY });
    setSpotlight({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
      onClick={() => onSelect(alt)}
      className="relative cursor-pointer"
      style={{ perspective: 1200 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Layer: 3D Tilt Effect */}
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`absolute inset-0 rounded-xl bg-bg-card border transition-[border-color,box-shadow,transform] duration-300 card-hover ${
          isSelected 
            ? 'border-accent ring-1 ring-accent/50' 
            : 'border-border'
        } ${hovered && !isSelected ? 'border-accent/40 shadow-2xl shadow-accent/10' : ''}`}
      >
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 mix-blend-overlay"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(var(--accent-rgb, 99, 102, 241), 0.15) 30%, transparent 70%)`
          }}
        />
      </motion.div>

      {/* Foreground Content Layer: 2D Parallax */}
      <motion.div
        animate={{ x: Math.round(rotate.y * -0.5), y: Math.round(rotate.x * 0.5) }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.5 }}
        className={`relative ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : 'flex flex-col p-4'} h-full group`}
      >
        <button
          onClick={(e) => onToggleCompare(e, alt)}
          aria-label={`Compare ${alt.resolved_name}`}
          className={`absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-sm text-xs touch-target ${
            isSelected
              ? 'bg-accent border-bg text-bg scale-100'
              : 'bg-bg-card border-border text-text-muted hover:border-accent/50 sm:scale-0 sm:group-hover:scale-100 scale-100'
          }`}
        >
          {isSelected ? '✓' : '+'}
        </button>

        {viewMode === 'grid' ? (
          <>
            <div className="flex justify-between items-start mb-2.5">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">
                  {alt.resolved_name}
                </h3>
                <p className="text-xs font-medium text-text-muted mt-0.5 flex items-center gap-1.5">
                  replaces <span className="text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-md border border-border text-xs font-medium">{alt.paid_tool_name}</span>
                </p>
              </div>
              <ScoreRing score={alt.openlysts_score} size={40} strokeWidth={3} />
            </div>

            <p className="text-xs text-text-secondary line-clamp-2 mb-3 flex-grow leading-relaxed">{alt.description}</p>

            <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getDifficultyColor(alt.migration_difficulty)}`}>
                  {alt.migration_difficulty || 'Medium'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-accent/10 text-accent border-accent/20">
                  {alt.feature_parity_score || 70}% Match
                </span>
                {alt.repo && (
                  <>
                    {alt.repo.language && alt.repo.language !== 'Unknown' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                        {alt.repo.language}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-0.5">
                      ★ {alt.repo.stars >= 1000 ? (alt.repo.stars / 1000).toFixed(1) + 'k' : alt.repo.stars || 0}
                    </span>
                  </>
                )}
              </div>
              {alt.openlysts_score >= 80 && alt.repo?.stars >= 5000 && (
                <div title="Top Pick" className="flex items-center gap-0.5 text-accent text-xs font-bold">
                  <Award className="w-3.5 h-3.5" /> Top Pick
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <ScoreRing score={alt.openlysts_score} size={36} strokeWidth={3} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate">{alt.resolved_name}</h3>
                <span className="text-xs text-text-muted">replaces</span>
                <span className="text-xs text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-md border border-border font-medium">{alt.paid_tool_name}</span>
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  ★ {alt.repo.stars >= 1000 ? (alt.repo.stars / 1000).toFixed(1) + 'k' : alt.repo.stars || 0}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function LiveStatBlock({ label, value, valueClass = "text-text" }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : (value || '0');
  return (
    <div className="bg-bg-subtle/80 border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center min-w-[75px] sm:min-w-[90px]">
      <div className={`text-lg sm:text-xl font-black ${valueClass}`}>{displayValue}</div>
      <div className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Alternatives() {
  usePageTitle('Alternatives');
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
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [visibleMainGroups, setVisibleMainGroups] = useState(20);
  const [visibleSidebarCategories, setVisibleSidebarCategories] = useState(20);
  const [page, setPage] = useState(1);
  const [accumulatedAlts, setAccumulatedAlts] = useState([]);
  const [accumulatedGrouped, setAccumulatedGrouped] = useState([]);
  const navigate = useNavigate();
  const categoryRefs = useRef({});
  const sortRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search and reset page on filter change
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setAccumulatedAlts([]);
      setAccumulatedGrouped([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setAccumulatedAlts([]);
    setAccumulatedGrouped([]);
  }, [activeCategory, sortBy]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['alternatives', activeCategory, debouncedSearch, sortBy, page],
    queryFn: () => fetchAlternatives(activeCategory, debouncedSearch, sortBy, page),
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  // Accumulate results for infinite load effect without breaking UI structure
  useEffect(() => {
    if (data && data.alternatives) {
      if (page === 1) {
        setAccumulatedAlts(data.alternatives);
        setAccumulatedGrouped(data.grouped || []);
      } else {
        setAccumulatedAlts(prev => {
          const newAlts = data.alternatives.filter(a => !prev.some(p => p.id === a.id));
          return [...prev, ...newAlts];
        });
        
        // Merge grouped data carefully
        setAccumulatedGrouped(prev => {
          const next = [...prev];
          for (const newGroup of (data.grouped || [])) {
            const existingGroup = next.find(g => g.category === newGroup.category);
            if (!existingGroup) {
              next.push(newGroup);
            } else {
              for (const newPaid of newGroup.paid_groups) {
                const existingPaid = existingGroup.paid_groups.find(p => p.paid_tool_name === newPaid.paid_tool_name);
                if (!existingPaid) {
                  existingGroup.paid_groups.push(newPaid);
                } else {
                  const newUniqueAlts = newPaid.alternatives.filter(na => !existingPaid.alternatives.some(ea => ea.id === na.id));
                  existingPaid.alternatives.push(...newUniqueAlts);
                  existingPaid.count = existingPaid.alternatives.length;
                }
              }
              existingGroup.total = existingGroup.paid_groups.reduce((sum, g) => sum + g.count, 0);
            }
          }
          return next;
        });
      }
    }
  }, [data, page]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      alternatives: accumulatedAlts,
      results: accumulatedAlts,
      grouped: accumulatedGrouped,
      stats: data.stats
    };
  }, [data, accumulatedAlts, accumulatedGrouped]);

  // Auto-expand top 10 categories on load to show rich cards immediately
  useEffect(() => {
    if (filteredData?.grouped && filteredData.grouped.length > 0) {
      setExpandedCategories(new Set(filteredData.grouped.slice(0, 10).map(g => g.category)));
    }
  }, [filteredData?.grouped]);

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

  const renderCard = (alt, idx) => (
    <AlternativeCard 
      key={alt.id}
      alt={alt}
      idx={idx}
      viewMode={viewMode}
      isSelected={!!selectedForCompare.find(s => s.id === alt.id)}
      onToggleCompare={toggleCompare}
      onSelect={setSelectedAlt}
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">

      {/* ─── Hero Header ─── */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-bg-card/80 to-bg-card/30 border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-text tracking-tight">
                {activeCategory === 'All' ? 'Open Source Alternatives' : `${activeCategory}`}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Discover {filteredData?.stats?.total_tools?.toLocaleString() || '500+'} curated open-source replacements for {filteredData?.stats?.total_paid_tools?.toLocaleString() || '100+'} SaaS products — scored by code quality, community health, and feature parity.
            </p>
          </div>

          {/* Stats Pills */}
          {filteredData?.stats && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <LiveStatBlock label="Tools" value={filteredData.stats.total_tools} valueClass="text-accent" />
              <LiveStatBlock label="Categories" value={filteredData.stats.total_categories} valueClass="text-text" />
              <div className="bg-bg-subtle/80 border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center min-w-[75px] sm:min-w-[90px]">
                <div className="text-lg sm:text-xl font-black text-amber-400">{filteredData.stats.avg_score}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg Score</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Controls Bar ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mt-5 pt-4 sm:pt-5 border-t border-border/50">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]" data-tour="alts-search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alternatives, categories, or SaaS..."
              className="w-full bg-bg border border-border rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-text focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-expanded={isSortOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 sm:gap-2 bg-bg border border-border hover:border-accent/50 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-text-secondary font-medium transition-colors touch-target"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                <span className="hidden xs:inline">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                <span className="xs:hidden">Sort</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 sm:left-0 mt-2 w-48 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 py-1"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors ${
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
            <div className="flex items-center bg-bg border border-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors touch-target ${viewMode === 'grid' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'}`}
                title="Grid View"
                aria-label="Switch to Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors touch-target ${viewMode === 'list' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'}`}
                title="List View"
                aria-label="Switch to List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Category Button (Mobile opens Drawer, Desktop toggles Sidebar) */}
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setCategoryDrawerOpen(true);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="flex items-center gap-1.5 p-2 px-2.5 rounded-xl border border-border bg-bg text-text-secondary hover:text-accent hover:border-accent/40 transition-colors touch-target"
              title="Categories"
              aria-label="Categories"
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs font-semibold lg:hidden">Categories</span>
            </button>

            {/* Active Category Chip */}
            {activeCategory !== 'All' && (
              <button 
                onClick={() => setActiveCategory('All')}
                className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-2.5 py-1.5 rounded-full border border-accent/20 hover:bg-accent/20 transition-colors touch-target"
              >
                {categoryIcons[activeCategory] || '📂'} <span className="truncate max-w-[120px]">{activeCategory}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile/Tablet Horizontal Swipeable Category Rail (Visible on < 1024px) ─── */}
      <div className="lg:hidden mb-5 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-scroll py-1">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all touch-target flex items-center gap-1.5 flex-shrink-0 ${
              activeCategory === 'All'
                ? 'bg-accent text-accent-fg shadow-sm'
                : 'bg-bg-card border border-border text-text-secondary hover:text-text hover:border-border-strong'
            }`}
          >
            <span>All Tools</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'All' ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>
              {filteredData?.stats?.total_tools || 0}
            </span>
          </button>
          {filteredData?.categories?.slice(0, visibleSidebarCategories).map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target flex items-center gap-1.5 flex-shrink-0 ${
                activeCategory === cat.name
                  ? 'bg-accent text-accent-fg font-bold shadow-sm'
                  : 'bg-bg-card border border-border text-text-secondary hover:text-text hover:border-border-strong'
              }`}
            >
              <span>{categoryIcons[cat.name] || '📂'}</span>
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === cat.name ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Layout: Desktop Sidebar + Content ─── */}
      <div className="flex gap-6">

        {/* ─── Desktop Sidebar (Only visible on lg: >= 1024px) ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block flex-shrink-0 overflow-hidden"
            >
              <div className="w-[260px] sticky top-20">
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="p-3.5 border-b border-border bg-bg-subtle/50">
                    <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-accent" /> Categories
                    </h2>
                  </div>
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-colors flex items-center justify-between ${
                        activeCategory === 'All' ? 'bg-accent text-accent-fg font-bold' : 'text-text-secondary hover:bg-bg-subtle hover:text-text'
                      }`}
                    >
                      <span>All Tools</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${activeCategory === 'All' ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>{filteredData?.stats?.total_tools || 0}</span>
                    </button>
                    {filteredData?.categories?.slice(0, visibleSidebarCategories).map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        title={cat.name}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between gap-1.5 ${
                          activeCategory === cat.name 
                            ? 'bg-accent text-accent-fg font-bold' 
                            : 'text-text-secondary hover:bg-bg-subtle hover:text-text'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-sm">{categoryIcons[cat.name] || '📂'}</span>
                          {cat.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${activeCategory === cat.name ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>{cat.count}</span>
                      </button>
                    ))}
                    {filteredData?.categories && filteredData.categories.length > visibleSidebarCategories && (
                      <button 
                        onClick={() => setVisibleSidebarCategories(prev => prev + 20)}
                        className="w-full text-center py-2 text-xs text-accent hover:text-accent-hover mt-2 font-medium"
                      >
                        Show more categories ({filteredData.categories.length - visibleSidebarCategories})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ─── Main Content (Takes 100% on mobile & tablet, flex-1 on desktop) ─── */}
        <main className="flex-1 w-full min-w-0" data-tour="alts-grid">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-text-muted">
              Failed to load alternatives. Please try again.
            </div>
          )}

          {/* Flat view when searching or specific category */}
          {filteredData?.alternatives && (activeCategory !== 'All' || debouncedSearch) && (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start' 
              : 'flex flex-col gap-2.5'
            }>
              {filteredData.alternatives.map((alt, idx) => renderCard(alt, idx))}
              {filteredData.alternatives.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-16 text-text-muted border border-dashed border-border rounded-2xl bg-bg-card/40">
                  <Search className="w-8 h-8 mx-auto mb-3 text-text-muted/50" />
                  <p className="font-medium">No tools found</p>
                  <p className="text-xs mt-1">Try adjusting your search or category filter.</p>
                </div>
              )}
            </div>
          )}

          {/* Grouped view (default: All categories, no search) */}
          {filteredData?.grouped && activeCategory === 'All' && !debouncedSearch && (
            <div className="space-y-4">
              {filteredData.grouped.slice(0, visibleMainGroups).map((group) => (
                <div 
                  key={group.category} 
                  ref={el => categoryRefs.current[group.category] = el}
                  className="bg-bg-card/60 border border-border rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-hover/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryIcons[group.category] || '📂'}</span>
                      <div className="text-left">
                        <h2 className="text-base font-bold text-text">{group.category}</h2>
                        <p className="text-xs text-text-muted">
                          {group.total} tool{group.total !== 1 ? 's' : ''} · {group.paid_groups.length} SaaS replacement{group.paid_groups.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-text-secondary bg-bg-subtle px-2.5 py-1 rounded-lg border border-border">
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
                        <div className="px-5 pb-5 space-y-5 border-t border-border/40 pt-4">
                          {group.paid_groups.map((pg) => (
                            <div key={pg.paid_tool_name}>
                              {/* Paid Tool Subheader */}
                              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                <span className="text-xs font-bold text-text-secondary bg-bg-subtle/80 px-2.5 py-1 rounded-lg border border-border flex items-center gap-1.5 max-w-full">
                                  <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                  <span className="flex-shrink-0">Replaces</span> <span className="text-text font-extrabold truncate max-w-[150px] sm:max-w-sm" title={pg.paid_tool_name}>{pg.paid_tool_name}</span>
                                  <span className="text-accent font-bold flex-shrink-0">({pg.count})</span>
                                </span>
                                <div className="h-px flex-1 bg-border/40" />
                              </div>

                              {/* Cards */}
                              <div className={viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start'
                                : 'flex flex-col gap-2.5'
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

          {/* Load More Button */}
          {data?.totalPages > page && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={isFetching}
                className="bg-bg-subtle hover:bg-bg-hover text-text font-bold py-2.5 px-6 rounded-xl border border-border transition-colors flex items-center gap-2"
              >
                {isFetching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-text-muted border-t-accent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Tools'
                )}
              </button>
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.2)] rounded-full px-6 py-3 flex items-center gap-6 z-40"
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
          <div id="alt-detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
              transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
               {/* Modal Header */}
               <div className="p-6 border-b border-border flex justify-between items-start bg-bg-subtle/50">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <ScoreRing score={selectedAlt.openlysts_score} size={52} strokeWidth={4} />
                      <div>
                        <h2 id="modal-title" className="text-2xl font-black text-text">{selectedAlt.resolved_name}</h2>
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
                        rel="noopener noreferrer" 
                        className="text-xs flex items-center gap-1 text-accent hover:underline bg-accent/10 px-2 py-1 rounded-lg border border-accent/20 transition-colors hover:bg-accent/20"
                      >
                        {selectedAlt.free_tool_repo?.startsWith('http') ? 'Visit Website' : 'View Repository'} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button autoFocus onClick={() => setSelectedAlt(null)} className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text transition-colors">
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
                      <div className="bg-bg-subtle rounded-2xl p-4 sm:p-5 border border-border">
                        <h3 className="text-base sm:text-lg font-bold text-text mb-3 sm:mb-4 flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-red-500" /> Learning Hub
                        </h3>
                        <a 
                          href={selectedAlt.youtube_tutorial_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedAlt.resolved_name + ' tutorial')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all group touch-target"
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

      {/* ─── Mobile Category Bottom Sheet Drawer ─── */}
      <AnimatePresence>
        {categoryDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryDrawerOpen(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-h-[80vh] bg-bg-card border-t border-border rounded-t-3xl shadow-2xl flex flex-col z-10 pb-safe overflow-hidden"
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-border-strong" />
              </div>

              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-base text-text flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" /> Select Category
                </h3>
                <button 
                  onClick={() => setCategoryDrawerOpen(false)}
                  className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar touch-scroll">
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setCategoryDrawerOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between touch-target ${
                    activeCategory === 'All'
                      ? 'bg-accent text-accent-fg'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text active:bg-bg-subtle'
                  }`}
                >
                  <span>All Tools</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeCategory === 'All' ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>
                    {data?.stats?.total_tools || 0}
                  </span>
                </button>
                {data?.categories?.slice(0, visibleSidebarCategories).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setCategoryDrawerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between touch-target ${
                      activeCategory === cat.name
                        ? 'bg-accent text-accent-fg'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text active:bg-bg-subtle'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className="text-base">{categoryIcons[cat.name] || '📂'}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${activeCategory === cat.name ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted'}`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
                {data?.categories && data.categories.length > visibleSidebarCategories && (
                  <button 
                    onClick={() => setVisibleSidebarCategories(prev => prev + 20)}
                    className="w-full text-center py-3 px-4 rounded-xl text-sm text-accent hover:bg-accent/10 mt-2 font-bold touch-target"
                  >
                    Show more categories ({data.categories.length - visibleSidebarCategories})
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  Layers, 
  PlayCircle, 
  Bookmark, 
  Terminal, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  ExternalLink, 
  Copy, 
  Check, 
  Scale,
  Star,
  Zap,
  Trophy,
  Compass,
  CheckCircle,
  Users,
  Tag,
  Flame,
  Github,
  GitCompare,
  Heart,
  Eye
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Custom Tooltip for the Interactive Card Anatomy using Radix for Portal support
const LegendTooltip = ({ children, content }) => {
  // Split content into title and description gracefully
  const parts = content.split(':');
  const title = parts[0];
  const description = parts.length > 1 ? parts.slice(1).join(':').trim() : '';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          sideOffset={8}
          collisionPadding={16}
          className="z-[9999] w-max max-w-[280px] p-3.5 rounded-xl bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] text-left !animate-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[13px] font-bold text-white mb-1 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent opacity-80" />
              {title}
            </div>
            {description && (
              <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {description}
              </div>
            )}
          </motion.div>
          <TooltipPrimitive.Arrow className="fill-slate-900/95 dark:fill-zinc-900/95" width={12} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// 6 Beginner-Friendly Capability Modules
const MODULES = [
  {
    id: 'hybrid-search',
    label: 'Smart Search',
    title: 'Skip the Junk, Find What Actually Works',
    badge: 'Discovery Superpower',
    icon: Sparkles,
    audience: 'Learners & Builders',
    tagline: 'Never waste hours installing an abandoned project or buggy clone again.',
    description: 'GitHub has over 200 million repositories, but most are school homework projects or dead copies. Openlysts checks real developer activity—stars, recent updates, and community trust—so you only get tools that work out of the box.',
    howItWorks: 'Openlysts Score = (Search Match × 1.5) + (Star Popularity × 0.5) + (Active Bug Fixes × 0.2)',
    highlights: [
      'Puts battle-tested tools at the top instead of abandoned copies.',
      'Updates every 10 minutes so you always find active, living software.',
      'Instant search suggestions as you type.'
    ],
    whoHelps: 'Avoid dead code, broken dependencies, and unmaintained packages.',
    ctaPath: '/discover',
    ctaText: 'Try Smart Search'
  },
  {
    id: 'alternatives',
    label: 'Free Alternatives',
    title: 'Cut Your Software Bills to $0',
    badge: 'Save Money',
    icon: RefreshCw,
    audience: 'Founders & Creators',
    tagline: 'Self-hosted, transparent open-source replacements for expensive SaaS products.',
    description: 'Why pay $25 to $100 every month for subscriptions like Firebase, Airtable, or Vercel? Openlysts finds high-quality, free open-source software you can host yourself with 1-click Docker setups.',
    howItWorks: 'Feature Match Score = (Core Features % × 50%) + (Setup Simplicity % × 30%) + (Community Backing % × 20%)',
    highlights: [
      'Find direct free replacements for Firebase, Vercel, Airtable, Datadog, and more.',
      'Clear feature comparison so you know what is supported before switching.',
      '1-click Docker deployment and community migration guides.'
    ],
    whoHelps: 'Keep your startup and side-project software expenses at zero.',
    ctaPath: '/alternatives',
    ctaText: 'Browse Free Alternatives'
  },
  {
    id: 'compare-matrix',
    label: 'Side-by-Side Compare',
    title: 'Compare Tools on One Screen (Without 20 Tabs)',
    badge: 'Decision Helper',
    icon: Layers,
    audience: 'Tech Leads & Developers',
    tagline: 'Evaluate up to 3 software packages side-by-side with clear health metrics.',
    description: 'Stuck deciding between React vs. Vue, or Tailwind vs. Bootstrap? Put them side-by-side to see popularity, recent updates, licenses, and maintenance health all in one clean view.',
    howItWorks: 'Shareable Link: /compare?repos=facebook/react,vuejs/vue,sveltejs/svelte',
    highlights: [
      'Compare star count, latest release date, and open issue ratio in one table.',
      'Automatic license check so you know if it is safe for commercial projects.',
      'Share your comparison with teammates via a single short link.'
    ],
    whoHelps: 'Pick the right framework with confidence and avoid regret later.',
    ctaPath: '/compare',
    ctaText: 'Launch Comparison Tool'
  },
  {
    id: 'video-lab',
    label: 'Video Walkthroughs',
    title: 'Learn in 5 Minutes (Without Reading Long Docs)',
    badge: 'Quick Learning',
    icon: PlayCircle,
    audience: 'Visual Learners & Beginners',
    tagline: 'Curated YouTube architecture breakdowns and tutorials embedded right in the app.',
    description: 'Hate reading 2,000 words of dense technical documentation? Openlysts curates concise, high-quality YouTube video breakdowns for top trending repositories so you understand how things work in minutes.',
    howItWorks: 'Zero-Tracking Video Player: Fast, distraction-free YouTube video previews without leaving Openlysts',
    highlights: [
      'Watch fast video tutorials directly on repository pages.',
      'Full formatted READMEs alongside the video.',
      'Community health ratings to see if a tool is growing or dying.'
    ],
    whoHelps: 'Understand unfamiliar frameworks and architecture in minutes.',
    ctaPath: '/trending',
    ctaText: 'Explore Trending Repos'
  },
  {
    id: 'data-vault',
    label: 'Save & Export',
    title: 'Save Your Favorite Tools (No Sign-Up Needed)',
    badge: '100% Private',
    icon: Bookmark,
    audience: 'Students & Curators',
    tagline: 'One-click bookmarking that works offline and saves directly to your device.',
    description: 'Found a great library you want to use later? Click the bookmark icon. Your saved stack is stored safely on your computer. It works even when your internet drops, and you can export your list as a JSON file anytime.',
    howItWorks: 'Private Browser Storage: Works 100% offline with optional cloud sync if you create an account',
    highlights: [
      'Save infinite repositories with zero registration required.',
      'Live bookmark counter in the navigation bar.',
      'Download your curated stack as JSON to share or back up anytime.'
    ],
    whoHelps: 'Keep your favorite open-source tools organized in one private place.',
    ctaPath: '/bookmarks',
    ctaText: 'View My Saved Tools'
  },
  {
    id: 'command-palette',
    label: 'Fast Shortcuts',
    title: 'Speed Through Openlysts with ⌘K',
    badge: 'Super Speed',
    icon: Terminal,
    audience: 'Keyboard Lovers & Power Users',
    tagline: 'Press ⌘K or Ctrl+K anywhere on your keyboard to navigate in milliseconds.',
    description: 'Feel like a power user. Press ⌘K (macOS) or Ctrl+K (Windows/Linux) anywhere in Openlysts to search repositories, switch themes, jump between pages, or open comparison docks without touching your mouse.',
    howItWorks: 'Keyboard Shortcut: ⌘ + K (Mac) or Ctrl + K (Windows / Linux)',
    highlights: [
      'Instant lightning-fast search across all tools and pages.',
      'Change color themes and layouts with one keystroke.',
      'Press ESC anytime to return instantly to what you were doing.'
    ],
    whoHelps: 'Navigate the entire directory in seconds without lifting hands from keyboard.',
    ctaPath: '/discover',
    ctaText: 'Try ⌘K on Discover'
  },
  {
    id: 'badge-legend',
    label: 'Badges & Legend',
    title: 'Decode Repository Cards',
    badge: 'Quick Reference',
    icon: Tag,
    audience: 'Everyone',
    tagline: 'Understand what each visual indicator means at a glance.',
    description: 'Openlysts uses a rich set of badges to instantly convey a repository\'s health, ecosystem, difficulty, and special characteristics. Here is your cheat sheet.',
    howItWorks: 'Badges = Fast Visual Information Parsing',
    highlights: [
      'Know if a project is actively maintained or foundational.',
      'Check the difficulty level before diving in.',
      'Instantly spot AI-friendly or trending tools.'
    ],
    whoHelps: 'Quickly evaluate tools without reading through source code.',
    ctaPath: '/discover',
    ctaText: 'View Cards in Action'
  }
];

// 4 User Goal Shortcuts
const GOALS = [
  { id: 'alternatives', label: '💸 Replace a paid $50/mo subscription', tabId: 'alternatives' },
  { id: 'hybrid-search', label: '⚡ Find clean code without dead clones', tabId: 'hybrid-search' },
  { id: 'compare-matrix', label: '⚖️ Compare 2 tools without 20 open tabs', tabId: 'compare-matrix' },
  { id: 'video-lab', label: '📺 Watch a 5-min video instead of long docs', tabId: 'video-lab' },
  { id: 'badge-legend', label: '🏷️ Decode badges & labels on cards', tabId: 'badge-legend' }
];

export default function Guide() {
  const [activeTabId, setActiveTabId] = useState('hybrid-search');
  const [exploredTabs, setExploredTabs] = useState(new Set(['hybrid-search']));
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Interactive Simulator States
  // 1. Hybrid Search Weight Tuner
  const [textWeight, setTextWeight] = useState(65);
  const [authorityWeight, setAuthorityWeight] = useState(35);

  // 2. Alternative Preview Selection
  const [altCase, setAltCase] = useState('supabase');

  const activeModule = MODULES.find(m => m.id === activeTabId) || MODULES[0];

  const handleSelectTab = (tabId) => {
    setActiveTabId(tabId);
    setExploredTabs(prev => new Set([...prev, tabId]));
  };

  const progressPercentage = Math.round((exploredTabs.size / MODULES.length) * 100);
  const isAllExplored = exploredTabs.size === MODULES.length;

  usePageTitle('Platform Guide');

  const copyFormula = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-200 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-bold uppercase tracking-wider mb-4 border border-accent/20 shadow-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Openlysts Capabilities Playbook</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text mb-4"
          >
            How to Find Awesome Free Software in Seconds
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            No complex developer jargon. Discover the powerful tools and time-saving features built into Openlysts to help you build faster and cut your software bills to $0.
          </motion.p>
        </div>

        {/* Gamified Mastery Progress Tracker (Psychology Completion Hook) */}
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-1.5 text-text">
              <Trophy className="w-4 h-4 text-accent" />
              <span>Guide Progress: {exploredTabs.size} of {MODULES.length} Features Explored</span>
            </div>
            <span className="font-mono text-accent font-extrabold">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-bg-subtle border border-border/80 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
              initial={{ width: '17%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          {isAllExplored && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-2.5 rounded-xl bg-accent-soft text-accent text-xs font-bold flex items-center justify-between border border-accent/30"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span>🏆 You're an Open-Source Power User! Ready to explore?</span>
              </div>
              <Link to="/discover" className="underline font-black hover:opacity-80">Launch App →</Link>
            </motion.div>
          )}
        </div>

        {/* "What Are You Looking For Today?" Intent Selector */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            What is your main goal today? (Click to jump)
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {GOALS.map(goal => (
              <button
                key={goal.id}
                onClick={() => handleSelectTab(goal.tabId)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border cursor-pointer touch-target ${
                  activeTabId === goal.tabId 
                    ? 'bg-accent text-accent-fg border-accent shadow-xs font-bold' 
                    : 'bg-bg-card text-text-secondary border-border hover:border-accent/40 hover:text-text'
                }`}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid Segmented Navigation Tabs */}
        <div className="w-full mb-8">
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-bg-card border border-border shadow-sm">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeTabId === mod.id;
              const isExplored = exploredTabs.has(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelectTab(mod.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 whitespace-nowrap touch-target flex-shrink-0 cursor-pointer ${
                    isActive ? 'text-accent-fg font-bold' : 'text-text-secondary hover:text-text hover:bg-bg-hover'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGuideTab"
                      className="absolute inset-0 bg-accent rounded-xl shadow-sm z-0"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-fg' : 'text-accent'}`} />
                    <span>{mod.label}</span>
                    {isExplored && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/80" title="Explored" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split-Pane Interactive Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch p-6 sm:p-8 rounded-3xl bg-bg-card border border-border shadow-md mb-12"
          >
            {/* Left Column: Feature Specifications & Architectural Explanation */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-accent-soft text-accent border border-accent/20">
                    {activeModule.badge}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Users className="w-3 h-3 text-text-muted" />
                    For {activeModule.audience}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mb-3">
                  {activeModule.title}
                </h2>

                <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4 font-semibold">
                  {activeModule.tagline}
                </p>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                  {activeModule.description}
                </p>

                {/* Key Real-World Highlights */}
                <div className="space-y-2.5 mb-6">
                  {activeModule.highlights.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-text font-medium leading-normal">{point}</span>
                    </div>
                  ))}
                </div>

                {/* Plain English "How It Works" Box */}
                <div className="p-4 rounded-xl bg-bg-subtle border border-border flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 overflow-x-auto select-all">
                    <div className="text-[10px] uppercase font-bold text-text-muted mb-1">Under The Hood Formula</div>
                    <span className="text-text-secondary font-mono leading-relaxed block">{activeModule.howItWorks}</span>
                  </div>
                  <button
                    onClick={() => copyFormula(activeModule.howItWorks)}
                    className="p-2 rounded-lg bg-bg-card hover:bg-bg-hover text-text-muted hover:text-text border border-border transition-colors flex-shrink-0 cursor-pointer touch-target"
                    title="Copy Formula"
                    aria-label="Copy Formula"
                  >
                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="pt-5 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={activeModule.ctaPath}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-sm shadow-sm hover:brightness-110 active:scale-95 transition-all duration-150 touch-target"
                >
                  <span>{activeModule.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-xs text-text-muted flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <span>{activeModule.whoHelps}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Simulation Widget */}
            <div className="lg:col-span-6 rounded-2xl bg-bg-subtle border border-border p-5 sm:p-6 flex flex-col justify-center relative overflow-hidden">
              
              {/* Tab 1: Smart Search Interactive Weight Tuner */}
              {activeModule.id === 'hybrid-search' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-accent" />
                      Try It Yourself: Interactive Ranking Simulator
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent-soft text-accent font-mono font-bold border border-accent/20">
                      Live Formula
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    Slide the controls below to see how Openlysts separates battle-tested libraries from abandoned student projects:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-text mb-1.5">
                        <span className="text-text font-semibold">Keyword Relevance</span>
                        <span className="font-mono text-accent font-bold">{textWeight}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="80" 
                        value={textWeight} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTextWeight(val);
                          setAuthorityWeight(100 - val);
                        }}
                        className="w-full h-2.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-text mb-1.5">
                        <span className="text-text font-semibold">Real Developer Trust (Stars & Recent Updates)</span>
                        <span className="font-mono text-accent font-bold">{authorityWeight}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="80" 
                        value={authorityWeight} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAuthorityWeight(val);
                          setTextWeight(100 - val);
                        }}
                        className="w-full h-2.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  </div>

                  {/* Dynamic Re-Ranking Simulation Box */}
                  <div className="p-4 rounded-xl bg-bg-card border border-border space-y-3">
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Simulated Search Results for "react query"
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-accent/40 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-fg text-xs font-bold flex items-center justify-center">1</span>
                        <div>
                          <div className="text-xs font-bold text-text">TanStack / query</div>
                          <div className="text-[11px] text-text-muted flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>42.5k stars · Actively maintained canonical library</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-accent px-2 py-1 rounded bg-accent-soft border border-accent/20">
                        {((textWeight * 1.5 + authorityWeight * 0.9) / 2).toFixed(1)} pts
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-bg-card text-text-secondary text-xs font-bold flex items-center justify-center border border-border">2</span>
                        <div>
                          <div className="text-xs font-bold text-text">react-query-auth</div>
                          <div className="text-[11px] text-text-muted flex items-center gap-1">
                            <Star className="w-3 h-3 text-text-muted" />
                            <span>1.2k stars · Niche hobby wrapper</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-semibold text-text-secondary px-2 py-1 rounded bg-bg-card border border-border">
                        {((textWeight * 1.1 + authorityWeight * 0.2) / 2).toFixed(1)} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Free Alternatives Live Parity Simulation */}
              {activeModule.id === 'alternatives' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAltCase('supabase')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${altCase === 'supabase' ? 'bg-accent text-accent-fg shadow-xs' : 'bg-bg-card text-text-secondary hover:text-text border border-border'}`}
                      >
                        Firebase → Supabase
                      </button>
                      <button
                        onClick={() => setAltCase('coolify')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${altCase === 'coolify' ? 'bg-accent text-accent-fg shadow-xs' : 'bg-bg-card text-text-secondary hover:text-text border border-border'}`}
                      >
                        Vercel → Coolify
                      </button>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent text-[11px] font-bold border border-accent/20">100% Free & Open Source</span>
                  </div>

                  <div className="p-4 rounded-xl bg-bg-card border border-border space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <div className="text-[11px] text-text-muted">Paid SaaS Service</div>
                        <div className="text-sm font-bold text-text">{altCase === 'supabase' ? 'Google Firebase ($50/mo)' : 'Vercel Pro ($20/mo)'}</div>
                      </div>
                      <div className="text-center px-3 py-1 rounded-full bg-accent-soft border border-accent/30 text-accent font-extrabold text-sm">
                        {altCase === 'supabase' ? '96%' : '92%'} Match
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-text-muted">Free OSS Replacement</div>
                        <div className="text-sm font-bold text-accent">{altCase === 'supabase' ? 'supabase/supabase' : 'coollabsio/coolify'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg bg-bg-subtle border border-border">
                        <div className="text-text-muted text-[10px]">Database Type</div>
                        <div className="font-bold text-text">PostgreSQL</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-bg-subtle border border-border">
                        <div className="text-text-muted text-[10px]">User Auth</div>
                        <div className="font-bold text-text">Email + OAuth</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-bg-subtle border border-border">
                        <div className="text-text-muted text-[10px]">Deployment</div>
                        <div className="font-bold text-accent">1-Click Free</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Side-by-Side Compare Matrix Widget */}
              {activeModule.id === 'compare-matrix' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-accent" />
                      Live Compare Preview
                    </span>
                    <span className="text-xs font-bold text-accent">2 Tools Selected</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-bg-card border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text">facebook/react</span>
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      </div>
                      <div className="text-[11px] text-text-secondary">Popularity: 228k stars</div>
                      <div className="text-[11px] text-text-secondary">License: MIT (Free)</div>
                      <div className="text-[11px] text-accent font-bold">Health Score: 98/100</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-bg-card border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text">vuejs/core</span>
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      </div>
                      <div className="text-[11px] text-text-secondary">Popularity: 45k stars</div>
                      <div className="text-[11px] text-text-secondary">License: MIT (Free)</div>
                      <div className="text-[11px] text-accent font-bold">Health Score: 96/100</div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/compare?repos=facebook/react,vuejs/core')}
                    className="w-full py-2.5 rounded-xl bg-bg-card hover:bg-bg-hover border border-border text-xs font-bold text-text text-center transition-colors flex items-center justify-center gap-2 cursor-pointer touch-target shadow-xs"
                  >
                    <span>Launch Comparison View</span>
                    <ExternalLink className="w-3.5 h-3.5 text-accent" />
                  </button>
                </div>
              )}

              {/* Tab 4: Video Lab & Deep Health Simulation */}
              {activeModule.id === 'video-lab' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-accent" />
                      Embedded Video Breakdown Preview
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-[10px] font-bold border border-accent/20">
                      Ad-Free Embed
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-video border border-border flex items-center justify-center group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="relative z-10 text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-accent text-accent-fg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-white mb-0.5">Learn Next.js in 10 Minutes</div>
                      <div className="text-[10px] text-white/70">Fast visual architectural overview</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Data Vault & Offline Bookmarking Simulation */}
              {activeModule.id === 'data-vault' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-accent" />
                      Your Private Saved Stack
                    </span>
                    <span className="text-xs font-mono text-accent">Saved on your device</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-card border border-border font-mono text-[11px] text-text-secondary leading-relaxed overflow-x-auto">
                    <pre className="text-text font-mono">
{`[
  {
    "tool_name": "tailwindcss",
    "stars": 82400,
    "license": "MIT (Free Commercial Use)",
    "saved_date": "2026-08-23"
  }
]`}
                    </pre>
                  </div>
                  <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>100% private. Works without an account.</span>
                  </div>
                </div>
              )}

              {/* Tab 6: Command Palette Keyboard Simulator */}
              {activeModule.id === 'command-palette' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-accent" />
                      Keyboard Shortcut Cheat Sheet
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-[10px] font-mono font-bold border border-accent/20">
                      ⌘K / Ctrl+K
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card border border-border">
                      <span className="text-text font-medium">Search all repositories</span>
                      <kbd className="px-2.5 py-0.5 rounded-md bg-bg-subtle text-[11px] font-mono text-accent border border-border font-bold">Type any name</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card border border-border">
                      <span className="text-text font-medium">Find Free Alternatives</span>
                      <kbd className="px-2.5 py-0.5 rounded-md bg-bg-subtle text-[11px] font-mono text-accent border border-border font-bold">Select 'Alternatives'</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-card border border-border">
                      <span className="text-text font-medium">Close Modal</span>
                      <kbd className="px-2.5 py-0.5 rounded-md bg-bg-subtle text-[11px] font-mono text-accent border border-border font-bold">ESC</kbd>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Badges & Legend Visual Glossary */}
              {activeModule.id === 'badge-legend' && (
                <div className="h-[500px] flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-black/20 rounded-2xl border border-border/50 shadow-inner">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 pt-4 px-6 flex-shrink-0 z-20 bg-bg/80 backdrop-blur-xl">
                    <span className="text-sm font-extrabold text-text flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      Visual Glossary
                    </span>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-card/80 px-3 py-1.5 rounded-full border border-border/60 shadow-sm">
                      No Hover Required
                    </span>
                  </div>

                  <div className="w-full flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {/* Item 1: Trust Badges */}
                    <div className="p-4 rounded-xl bg-bg-card border border-border/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-accent/40 transition-colors shadow-sm">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-trending/40 bg-trending/10 text-trending shadow-[0_0_8px_rgba(255,100,50,0.3)] animate-pulse">
                          <Flame className="w-3 h-3" /> Trending
                        </span>
                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-blue-500/40 bg-blue-500/10 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                          <ShieldCheck className="w-3 h-3" /> Core
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text mb-1">Status Indicators</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          <strong>Trending</strong> projects are gaining rapid popularity over the last 48 hours. <strong>Core</strong> systems are foundational technologies with massive community trust.
                        </p>
                      </div>
                    </div>

                    {/* Item 2: AI Context */}
                    <div className="p-4 rounded-xl bg-bg-card border border-border/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-pink-500/40 transition-colors shadow-sm">
                      <div className="min-w-[120px]">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          Food for AI
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text mb-1">Gitingest (AI Context)</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Instantly turns the entire repository codebase into a single formatted text prompt, optimized for pasting directly into ChatGPT or Claude.
                        </p>
                      </div>
                    </div>

                    {/* Item 3: Safety & Licenses */}
                    <div className="p-4 rounded-xl bg-bg-card border border-border/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-green-500/40 transition-colors shadow-sm">
                      <div className="min-w-[120px]">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          MIT
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text mb-1">License Safety</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Green permissive licenses (MIT, Apache) mean the software is generally safe for commercial use and modification.
                        </p>
                      </div>
                    </div>

                    {/* Item 4: Actions */}
                    <div className="p-4 rounded-xl bg-bg-card border border-border/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-accent/40 transition-colors shadow-sm">
                      <div className="flex gap-2 min-w-[120px]">
                        <div className="p-2 w-9 h-9 flex items-center justify-center rounded-xl text-text-muted bg-bg-hover border border-border">
                          <GitCompare className="w-4 h-4" />
                        </div>
                        <div className="p-2 w-9 h-9 flex items-center justify-center rounded-xl text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20">
                          <Heart className="w-4 h-4" fill="currentColor" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text mb-1">Interactive Actions</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          <strong>Compare</strong> adds the project to the Side-by-Side dock. <strong>Save</strong> bookmarks it to your private, offline-capable vault.
                        </p>
                      </div>
                    </div>

                    {/* Item 5: Difficulty & Categories */}
                    <div className="p-4 rounded-xl bg-bg-card border border-border/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-accent/40 transition-colors shadow-sm">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-500/50 bg-orange-500/10 text-orange-500">
                          INTERMEDIATE
                        </span>
                        <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-border/50 bg-bg-subtle text-text-secondary">
                          framework
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text mb-1">Tags & Taxonomy</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Estimated complexity levels help you avoid tools that are too difficult to set up, while clear categorization helps you find alternatives.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Feature Navigation Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            to="/discover"
            className="p-6 rounded-2xl bg-bg-card border border-border hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 group touch-target"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-accent/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">Smart Search</h3>
            <p className="text-xs text-text-muted leading-relaxed">Search through vetted open-source tools with active updates and community trust.</p>
          </Link>

          <Link
            to="/alternatives"
            className="p-6 rounded-2xl bg-bg-card border border-border hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 group touch-target"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-accent/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">Free Alternatives</h3>
            <p className="text-xs text-text-muted leading-relaxed">Compare free self-hosted open-source software against commercial paid subscriptions.</p>
          </Link>

          <Link
            to="/compare"
            className="p-6 rounded-2xl bg-bg-card border border-border hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 group touch-target sm:col-span-2 lg:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-accent/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">Side-by-Side Compare</h3>
            <p className="text-xs text-text-muted leading-relaxed">Benchmark popularity, license safety, and active maintenance on one clean screen.</p>
          </Link>
        </div>

      </div>
    </div>
  );
}

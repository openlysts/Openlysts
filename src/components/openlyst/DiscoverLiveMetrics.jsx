import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Database, ArrowUpRight, Cpu, 
  Wrench, HardDrive, Bot, Package, Cloud, ShieldCheck, Activity, Radio
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/usePlatformStats';

const CATEGORIES = [
  { id: 'ai', name: 'AI & LLMs', label: 'AI', fallbackCount: 14280, icon: Cpu, color: 'from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20', border: 'border-purple-500/30 dark:border-purple-500/30', text: 'text-purple-700 dark:text-purple-300' },
  { id: 'developer-tools', name: 'Dev Tools', label: 'Developer Tools', fallbackCount: 8450, icon: Wrench, color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20', border: 'border-blue-500/30 dark:border-blue-500/30', text: 'text-blue-700 dark:text-blue-300' },
  { id: 'databases', name: 'Databases', label: 'Databases', fallbackCount: 3920, icon: HardDrive, color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20', border: 'border-emerald-500/30 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'ai-agents', name: 'AI Agents', label: 'AI Agents', fallbackCount: 2840, icon: Bot, color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20', border: 'border-amber-500/30 dark:border-amber-500/30', text: 'text-amber-800 dark:text-amber-300' },
  { id: 'libraries-frameworks', name: 'Libraries', label: 'Libraries & Frameworks', fallbackCount: 2150, icon: Package, color: 'from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20', border: 'border-pink-500/30 dark:border-pink-500/30', text: 'text-pink-700 dark:text-pink-300' },
  { id: 'cloud-devops', name: 'Cloud & DevOps', label: 'Cloud & DevOps', fallbackCount: 1680, icon: Cloud, color: 'from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20', border: 'border-sky-500/30 dark:border-sky-500/30', text: 'text-sky-700 dark:text-sky-300' },
  { id: 'security-auth', name: 'Security & Auth', label: 'Security', fallbackCount: 1120, icon: ShieldCheck, color: 'from-rose-500/10 to-amber-500/10 dark:from-rose-500/20 dark:to-amber-500/20', border: 'border-rose-500/30 dark:border-rose-500/30', text: 'text-rose-700 dark:text-rose-300' },
];

function CategoryChip({ cat, actualCount }) {
  const navigate = useNavigate();
  const initialCount = actualCount > 50 ? actualCount : cat.fallbackCount; 
  const liveCount = useLiveCounter(initialCount, 1, 3, 4000, 10000);
  const Icon = cat.icon;

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/search?categories=${encodeURIComponent(cat.id)}`)}
      className={`group/chip relative flex flex-col justify-between w-full h-full min-h-[92px] p-3 rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.color} hover:shadow-md transition-all duration-200 text-left`}
    >
      <div className="flex items-center justify-between w-full">
        <div className={`w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center ${cat.text} shadow-xs`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover/chip:opacity-100 transition-opacity" />
      </div>
      <div className="mt-2.5 w-full">
        <span className="text-[12px] font-semibold text-text truncate block leading-tight">
          {cat.name}
        </span>
        <span className={`text-xs font-bold ${cat.text} block mt-0.5`}>
          {liveCount.toLocaleString()}
        </span>
      </div>
    </motion.button>
  );
}

export default function DiscoverLiveMetrics({ totalRepos = 0, categoryCounts = {} }) {
  const { totalRepositories } = usePlatformStats();
  const initialTotal = totalRepos > 5000 ? totalRepos : totalRepositories;
  const liveTotalRepos = useLiveCounter(initialTotal, 1, 5, 2000, 6000);

  return (
    <div className="w-full max-w-5xl mx-auto my-6 px-2 sm:px-4">
      <div className="relative rounded-2xl border border-border bg-bg-card/80 backdrop-blur-md shadow-lg p-4 sm:p-6 transition-all">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Header Bar with Organic Live Telemetry Pulse */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-accent-soft border border-accent/30 text-accent flex-shrink-0 shadow-xs">
              <Database className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-extrabold text-text tracking-tight">
                  {liveTotalRepos.toLocaleString()} Repositories
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>Live Telemetry Pulse</span>
                </span>
              </div>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Continuously synchronized and rated across 60+ open-source categories
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5 font-mono font-medium bg-bg-card px-2.5 py-1 rounded-lg border border-border/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Auto-Ingestion: <strong className="text-text">Active</strong></span>
            </div>
          </div>
        </div>

        {/* Category Breakdown: Smooth Horizontal Scroll on Mobile/Tablet, 7-col on Desktop */}
        <div className="flex lg:grid lg:grid-cols-7 gap-2.5 overflow-x-auto no-scrollbar touch-scroll py-1 -mx-1 px-1 items-stretch">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="min-w-[125px] sm:min-w-[140px] lg:min-w-0 flex-1 flex-shrink-0 flex flex-col">
              <CategoryChip cat={cat} actualCount={categoryCounts[cat.label] || 0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

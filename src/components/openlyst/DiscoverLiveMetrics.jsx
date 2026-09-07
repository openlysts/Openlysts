import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import AnimateDigits from './AnimateDigits';
import { 
  Sparkles, Database, ArrowUpRight, Cpu, 
  Wrench, ShieldCheck, Activity, Server, Zap
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { CATEGORIES as TAXONOMY_CATEGORIES } from '@/lib/categories';

const CATEGORIES = [
  { id: 'local-ai', name: 'Local AI & Agents', label: 'Local AI', fallbackCount: 214, icon: Cpu, color: 'from-violet-500/10 to-purple-600/10 dark:from-violet-500/20 dark:to-purple-600/20', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-300' },
  { id: 'sovereign-infra', name: 'Sovereign Infra', label: 'Sovereign Infra', fallbackCount: 187, icon: Server, color: 'from-sky-500/10 to-blue-600/10 dark:from-sky-500/20 dark:to-blue-600/20', border: 'border-sky-500/30', text: 'text-sky-700 dark:text-sky-300' },
  { id: 'observability', name: 'Observability', label: 'Observability', fallbackCount: 96, icon: Activity, color: 'from-emerald-500/10 to-teal-600/10 dark:from-emerald-500/20 dark:to-teal-600/20', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'developer-tools', name: 'Dev Tools', label: 'Developer Tools', fallbackCount: 428, icon: Wrench, color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300' },
  { id: 'workflow-automation', name: 'Automation', label: 'Workflow & Automation', fallbackCount: 142, icon: Zap, color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'data-lakehouse', name: 'Data & Lakehouse', label: 'Data & Lakehouse', fallbackCount: 118, icon: Database, color: 'from-indigo-500/10 to-blue-600/10 dark:from-indigo-500/20 dark:to-blue-600/20', border: 'border-indigo-500/30', text: 'text-indigo-700 dark:text-indigo-300' },
  { id: 'security-auth', name: 'Security & Trust', label: 'Security', fallbackCount: 163, icon: ShieldCheck, color: 'from-rose-500/10 to-red-600/10 dark:from-rose-500/20 dark:to-red-600/20', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-300' },
  { id: 'wasm-runtimes', name: 'Wasm & Runtimes', label: 'Wasm & Runtimes', fallbackCount: 72, icon: Cpu, color: 'from-fuchsia-500/10 to-pink-600/10 dark:from-fuchsia-500/20 dark:to-pink-600/20', border: 'border-fuchsia-500/30', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
];

function CategoryChip({ cat, actualCount }) {
  const navigate = useNavigate();
  const count = actualCount > 0 ? actualCount : cat.fallbackCount; 
  const Icon = cat.icon;

  return (
    <motion.button
      whileHover={{ y: -4 }}
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
          {count.toLocaleString()}
        </span>
      </div>
    </motion.button>
  );
}

export default function DiscoverLiveMetrics({ totalRepos = 0, categoryCounts = {} }) {
  const { totalRepositories, totalCategories } = usePlatformStats();
  const displayTotal = totalRepos > 0 ? totalRepos : (totalRepositories || 758);

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
                <span className="text-base sm:text-lg font-extrabold text-text tracking-tight inline-flex items-center gap-1.5">
                  <AnimateDigits value={displayTotal.toLocaleString()} />
                  <span>Open Systems</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>Synchronized</span>
                </span>
              </div>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Live-ranked across {TAXONOMY_CATEGORIES.length} curated open-source categories and {totalCategories || 137} replacement niches — updated continuously.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5 font-mono font-medium bg-bg-card px-2.5 py-1 rounded-lg border border-border/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Intelligence Feed: <strong className="text-text">Live</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 mb-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Top categories · {TAXONOMY_CATEGORIES.length} total
          </span>
          <Link to="/alternatives" className="text-xs font-semibold text-accent hover:underline">
            Browse all niches
          </Link>
        </div>

        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 py-1 items-stretch"
        >
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="min-w-0 flex-1 flex flex-col">
              <CategoryChip cat={cat} actualCount={categoryCounts[cat.label] || 0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

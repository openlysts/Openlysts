import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Database, Layers, ArrowUpRight, Cpu, 
  Wrench, HardDrive, Bot, Package, Cloud, ShieldCheck, Activity
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ai', name: 'AI & LLMs', count: '1,420+', icon: Cpu, color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  { id: 'developer-tools', name: 'Developer Tools', count: '840+', icon: Wrench, color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  { id: 'databases', name: 'Databases & RAG', count: '390+', icon: HardDrive, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { id: 'ai-agents', name: 'AI Agents', count: '280+', icon: Bot, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
  { id: 'libraries-frameworks', name: 'Libraries', count: '210+', icon: Package, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', text: 'text-pink-400' },
  { id: 'cloud-devops', name: 'Cloud & DevOps', count: '160+', icon: Cloud, color: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30', text: 'text-sky-400' },
  { id: 'security-auth', name: 'Security & Auth', count: '110+', icon: ShieldCheck, color: 'from-red-500/20 to-amber-500/20', border: 'border-red-500/30', text: 'text-red-400' },
];

export default function DiscoverLiveMetrics({ totalRepos = 3000 }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-12deg to +12deg)
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
    <div 
      className="w-full max-w-4xl mx-auto my-6 perspective-[1200px]"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {/* Background Layer: 3D Tilt Effect */}
        <motion.div
          animate={{
            rotateX: rotate.x,
            rotateY: rotate.y,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.5 }}
          className="absolute inset-0 rounded-2xl border border-white/10 dark:border-white/10 bg-surface/60 dark:bg-card/40 backdrop-blur-xl shadow-2xl"
        >
          {/* Dynamic 3D Cursor Spotlight Effect */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.08), transparent 70%)`
            }}
          />
        </motion.div>

        {/* Foreground Content Layer: 2D Parallax (Guarantees Razor Sharp Text) */}
        <motion.div
          animate={{
            x: rotate.y * -0.5,
            y: rotate.x * 0.5,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.5 }}
          className="relative p-5 sm:p-6"
        >
          {/* Ambient Top Glow Line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {/* Header Bar with Live Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center p-2 rounded-xl bg-accent-soft/40 border border-accent/20 text-accent">
                <Database className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-text tracking-tight">
                    {totalRepos.toLocaleString()}+ Repositories
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-3 h-3 animate-pulse" /> Live Neon Sync
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Continuously synchronized and rated across 60+ open-source categories
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Auto-Ingestion: <strong>Active</strong></span>
              </div>
            </div>
          </div>

          {/* Category Breakdown Interactive Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ y: 0 }}
                  onClick={() => navigate(`/search?categories=${encodeURIComponent(cat.id)}`)}
                  className={`group/chip relative flex flex-col items-start p-2.5 rounded-xl border ${cat.border} bg-gradient-to-br ${cat.color} hover:shadow-lg transition-all duration-200 text-left`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className={`p-1 rounded-lg bg-black/20 ${cat.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-text-muted opacity-0 group-hover/chip:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[11px] font-medium text-text-secondary line-clamp-1 group-hover/chip:text-text transition-colors">
                    {cat.name}
                  </span>
                  <span className={`text-xs font-bold ${cat.text}`}>
                    {cat.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

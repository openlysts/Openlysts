import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, BookOpen, MessageSquare, Star, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const SOCIAL_ITEMS = [
  {
    id: 'github',
    label: 'GitHub',
    icon: Github,
    color: 'text-text',
    hoverBg: 'hover:border-accent/40',
    content: (
      <div className="w-64 p-3.5 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-xs text-text flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-accent" />
            openlysts/Openlysts
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-trending bg-trending/10 px-1.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-trending" /> 3.2k
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-snug mb-2">
          100% open-source software discovery engine with live AI telemetry.
        </p>
        <a
          href="https://github.com/openlysts/Openlysts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
        >
          Star on GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    ),
  },
  {
    id: 'guide',
    label: 'Platform Guide',
    icon: BookOpen,
    color: 'text-accent',
    hoverBg: 'hover:border-accent/40',
    content: (
      <div className="w-64 p-3.5 text-left">
        <div className="flex items-center gap-1.5 font-bold text-xs text-text mb-1">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Interactive Capabilities Hub
        </div>
        <p className="text-[11px] text-text-muted leading-snug mb-2">
          Master advanced search formulas, replace paid SaaS tools & compare repositories.
        </p>
        <Link
          to="/guide"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
        >
          Explore Guide <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    icon: MessageSquare,
    color: 'text-blue-400',
    hoverBg: 'hover:border-blue-500/40',
    content: (
      <div className="w-64 p-3.5 text-left">
        <div className="flex items-center gap-1.5 font-bold text-xs text-text mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          Open-Source Builders
        </div>
        <p className="text-[11px] text-text-muted leading-snug mb-2">
          Share your favorite open-source tools and get early access to upcoming features.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:underline"
        >
          Get in Touch <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    ),
  },
];

export default function SocialHoverCards() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="relative inline-flex items-center gap-1 p-1 bg-bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl shadow-lg">
      {SOCIAL_ITEMS.map((item) => {
        const Icon = item.icon;
        const isHovered = hoveredId === item.id;

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              type="button"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isHovered
                  ? 'bg-white/10 dark:bg-white/5 text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span>{item.label}</span>
            </button>

            {/* Morphing Popover Card */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden pointer-events-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-trending/5 pointer-events-none" />
                  {item.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { useCompare } from '@/lib/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { GitCompare, X, Trash2 } from 'lucide-react';

export default function CompareDock() {
  const { selectedForCompare, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();

  if (selectedForCompare.length === 0) return null;
  // Don't show dock on the compare page itself
  if (location.pathname === '/compare') return null;

  const handleCompareClick = () => {
    const reposParams = selectedForCompare.map(r => r.full_name).join(',');
    navigate(`/compare?repos=${reposParams}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        data-tour="compare-dock"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-4 w-[95%] max-w-2xl"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2 text-text flex-shrink-0">
          <GitCompare className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          <span className="font-bold text-xs sm:text-sm whitespace-nowrap">({selectedForCompare.length}/3)</span>
        </div>

        <div className="flex-1 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-scroll py-0.5">
          {selectedForCompare.map(repo => (
            <div key={repo.id} className="flex items-center gap-1.5 bg-bg-subtle px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border min-w-0 max-w-[120px] sm:max-w-[160px] flex-shrink-0">
              <span className="text-xs truncate font-semibold">{repo.name}</span>
              <button 
                onClick={() => removeFromCompare(repo.id)}
                className="text-text-muted hover:text-red-400 p-1 rounded-full hover:bg-bg-hover transition-colors touch-target"
                aria-label={`Remove ${repo.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-border flex-shrink-0">
          <button
            onClick={clearCompare}
            className="p-2 text-text-muted hover:text-red-400 hover:bg-bg-hover rounded-lg transition-colors touch-target"
            title="Clear all"
            aria-label="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCompareClick}
            disabled={selectedForCompare.length < 2}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors touch-target ${
              selectedForCompare.length >= 2
                ? 'bg-accent text-accent-fg hover:bg-accent/90 shadow-sm'
                : 'bg-bg-hover text-text-muted cursor-not-allowed'
            }`}
          >
            Compare
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

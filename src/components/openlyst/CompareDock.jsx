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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bg-card border border-border shadow-2xl rounded-2xl p-3 flex items-center gap-4 w-[90%] max-w-2xl"
      >
        <div className="flex items-center gap-2 px-2 text-text">
          <GitCompare className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm whitespace-nowrap">Compare ({selectedForCompare.length}/3)</span>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {selectedForCompare.map(repo => (
            <div key={repo.id} className="flex items-center gap-2 bg-bg-subtle px-3 py-1.5 rounded-lg border border-border min-w-0 max-w-[150px]">
              <span className="text-xs truncate font-medium">{repo.name}</span>
              <button 
                onClick={() => removeFromCompare(repo.id)}
                className="text-text-muted hover:text-red-400 p-0.5 rounded-full hover:bg-bg-hover transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <button
            onClick={clearCompare}
            className="p-2 text-text-muted hover:text-red-400 hover:bg-bg-hover rounded-lg transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCompareClick}
            disabled={selectedForCompare.length < 2}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedForCompare.length >= 2
                ? 'bg-accent text-white hover:bg-accent-hover'
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

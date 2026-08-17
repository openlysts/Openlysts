import { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'LLM', 'AI agents', 'RAG', 'local AI', 'Ollama', 'llama.cpp',
  'machine learning', 'self-hosted', 'developer tools', 'automation',
  'databases', 'web application', 'Python', 'JavaScript', 'TypeScript',
  'Rust', 'Go', 'framework', 'vector database', 'transformers',
  'LangChain', 'stable diffusion', 'text-to-speech', 'whisper',
  'React', 'Vue', 'Svelte', 'Next.js', 'Docker', 'Kubernetes',
  'open source', 'CLI', 'terminal', 'IDE', 'editor', 'git',
];

export default function AnimatedSearch({ className = '' }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);

  const lowerVal = value.trim().toLowerCase();
  const filtered = lowerVal
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(lowerVal)).slice(0, 6)
    : [];

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (q) => {
    if (q && q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setFocused(false);
      setValue('');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (activeIdx >= 0 && filtered[activeIdx]) submit(filtered[activeIdx]);
      else submit(value);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  const renderSuggestion = (s) => {
    const idx = s.toLowerCase().indexOf(lowerVal);
    if (idx === -1) return s;
    return (
      <>
        {s.substring(0, idx)}
        <span className="text-accent font-medium">{s.substring(idx, idx + lowerVal.length)}</span>
        {s.substring(idx + lowerVal.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <motion.div
        animate={{ scale: focused ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setActiveIdx(-1); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Search open-source projects..."
          className="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none transition-all"
          style={{ boxShadow: focused ? '0 0 0 3px hsl(var(--accent-soft))' : 'none' }}
        />
      </motion.div>

      <AnimatePresence>
        {focused && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-bg-card shadow-lg overflow-hidden z-50"
          >
            {filtered.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); submit(s); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  activeIdx === i ? 'bg-accent-soft text-accent' : 'text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span className="truncate">{renderSuggestion(s)}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-text-muted flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
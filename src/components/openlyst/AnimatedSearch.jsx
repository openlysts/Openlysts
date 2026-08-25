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

export default function AnimatedSearch({ className = '', size = 'default' }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);

  const lowerVal = value.trim().toLowerCase();
  const filtered = lowerVal
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(lowerVal)).slice(0, 6)
    : [];

  const inputRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    };
    const onKeyDown = (e) => {
      // Allow global CommandPalette to handle Ctrl+K instead of intercepting
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
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
        <Search className={`absolute ${size === 'lg' ? 'left-4 w-5 h-5' : 'left-3 w-4 h-4'} top-1/2 -translate-y-1/2 text-text-muted pointer-events-none`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setActiveIdx(-1); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Search open-source projects..."
          aria-label="Search open-source projects"
          className={`w-full bg-bg-card border border-border focus:border-accent focus:outline-none transition-all ${
            size === 'lg' 
              ? 'rounded-xl pl-12 pr-12 py-3.5 text-base shadow-md' 
              : 'rounded-lg pl-9 pr-12 py-2 text-sm'
          } text-text placeholder:text-text-muted`}
          style={{ boxShadow: focused ? '0 0 15px 0px hsl(var(--accent) / 0.4), 0 0 0 2px hsl(var(--accent-soft))' : 'none' }}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${focused ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-command-palette')); }}
            className="flex items-center gap-1 bg-bg-subtle border border-border px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted hover:text-text hover:bg-bg-hover transition-colors shadow-sm cursor-pointer pointer-events-auto"
          >
            ⌘K
          </button>
        </div>
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
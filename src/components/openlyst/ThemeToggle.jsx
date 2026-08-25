import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Cloud, Check, Coffee, Ghost, Waves, Trees, Crown, Sunset, Leaf } from 'lucide-react';
import { useTheme, THEMES } from '@/lib/theme';

const ICONS = { Sun, Moon, Cloud, Coffee, Ghost, Waves, Trees, Crown, Sunset, Leaf };

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const CurrentIcon = ICONS[THEMES.find((t) => t.id === theme)?.icon] || Sun;

  return (
    <div className="relative flex-shrink-0" ref={ref} data-tour="theme-toggle">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 bg-bg-card/70 hover:bg-bg-hover hover:border-accent/40 text-text-secondary hover:text-text transition-all duration-200 shadow-xs touch-target"
        aria-label="Toggle theme"
        title="Toggle Theme"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-border bg-bg-card shadow-2xl overflow-hidden z-50 p-1.5 backdrop-blur-xl">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border/50 mb-1">
            Themes
          </div>
          {THEMES.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  theme === t.id ? 'bg-accent text-accent-fg font-semibold shadow-xs' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {theme === t.id && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
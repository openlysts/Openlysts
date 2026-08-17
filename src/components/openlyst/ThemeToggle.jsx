import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Cloud, Check, Coffee, Ghost, Waves, Trees } from 'lucide-react';
import { useTheme, THEMES } from '@/lib/theme';

const ICONS = { Sun, Moon, Cloud, Coffee, Ghost, Waves, Trees };

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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-bg-card hover:bg-bg-hover transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4 text-text-secondary" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-bg-card shadow-lg overflow-hidden z-50">
          {THEMES.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-bg-hover transition-colors ${
                  theme === t.id ? 'text-accent font-medium' : 'text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {theme === t.id && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
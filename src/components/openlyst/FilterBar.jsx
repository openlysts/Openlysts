import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';

const LICENSES = [
  { value: 'verified_oss', label: 'Verified OSS' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'non_oss', label: 'Non-OSS' },
];

const DIFFICULTIES = [
  { value: 'Beginner', label: 'Beginner Friendly' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Pro', label: 'Pro / Advanced' },
];

const UPDATED_WITHIN = [
  { value: '', label: 'Any time' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '6mo', label: '6 months' },
  { value: '1yr', label: '1 year' },
];

const ACTIVITY = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'recently-active', label: 'Recently Active' },
  { value: 'archived', label: 'Archived' },
];

const SORTS = [
  { value: 'trending', label: 'Trending' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'recent', label: 'Recently Added' },
];

export default function FilterBar({ filters, onChange, languages = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  const toggleArray = (key, val) => {
    const arr = filters[key] || [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    update(key, next);
  };

  const activeCount =
    (filters.categories?.length || 0) +
    (filters.languages?.length || 0) +
    (filters.licenses?.length || 0) +
    (filters.difficulties?.length || 0) +
    (filters.minStars > 0 ? 1 : 0) +
    (filters.updatedWithin ? 1 : 0) +
    (filters.activity ? 1 : 0);

  const reset = () => onChange({ q: filters.q, categories: [], languages: [], licenses: [], difficulties: [], minStars: 0, updatedWithin: '', activity: '', sort: 'trending', page: 1 });

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Sort:</span>
          <select
            value={filters.sort || 'trending'}
            onChange={(e) => update('sort', e.target.value)}
            className="text-sm bg-bg-card border border-border rounded-lg px-2.5 py-1.5 text-text-secondary cursor-pointer hover:border-border-strong"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="relative">
          <button
            onClick={() => { setCategoriesExpanded((v) => !v); setExpanded(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              categoriesExpanded || (filters.categories?.length || 0) > 0
                ? 'bg-accent-soft text-accent border-accent'
                : 'bg-bg-card text-text-secondary border-border hover:border-border-strong'
            }`}
          >
            Categories
            {(filters.categories?.length || 0) > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-fg">
                {filters.categories.length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {categoriesExpanded && (
            <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-xl border border-border bg-bg-card shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((c) => {
                  const active = (filters.categories || []).includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      onClick={() => toggleArray('categories', c.slug)}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'bg-accent text-accent-fg' : 'text-text-secondary hover:bg-bg-subtle hover:text-text'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { setExpanded((v) => !v); setCategoriesExpanded(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            expanded || activeCount > 0
              ? 'bg-accent-soft text-accent border-accent'
              : 'bg-bg-card text-text-secondary border-border hover:border-border-strong'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-fg">{activeCount}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {activeCount > 0 && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-text-muted hover:text-text px-2 py-1.5">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 p-4 rounded-xl border border-border bg-bg-card space-y-4">
          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Language</p>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l) => {
                  const active = (filters.languages || []).includes(l);
                  return (
                    <button
                      key={l}
                      onClick={() => toggleArray('languages', l)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        active ? 'bg-accent text-accent-fg border-accent' : 'bg-bg-subtle text-text-secondary border-border hover:border-border-strong'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* License and Difficulty */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">License</p>
                <div className="flex flex-wrap gap-1.5">
                  {LICENSES.map((l) => {
                    const active = (filters.licenses || []).includes(l.value);
                    return (
                      <button
                        key={l.value}
                        onClick={() => toggleArray('licenses', l.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-fg border-accent' : 'bg-bg-subtle text-text-secondary border-border hover:border-border-strong'
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Difficulty</p>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTIES.map((d) => {
                    const active = (filters.difficulties || []).includes(d.value);
                    return (
                      <button
                        key={d.value}
                        onClick={() => toggleArray('difficulties', d.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-fg border-accent' : 'bg-bg-subtle text-text-secondary border-border hover:border-border-strong'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Min stars */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Min Stars</p>
              <input
                type="number"
                min="0"
                value={filters.minStars || 0}
                onChange={(e) => update('minStars', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-bg-subtle border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* Updated within + Activity */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Updated Within</p>
                <select
                  value={filters.updatedWithin || ''}
                  onChange={(e) => update('updatedWithin', e.target.value)}
                  className="w-full bg-bg-subtle border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-secondary cursor-pointer"
                >
                  {UPDATED_WITHIN.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Activity</p>
                <select
                  value={filters.activity || ''}
                  onChange={(e) => update('activity', e.target.value)}
                  className="w-full bg-bg-subtle border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-secondary cursor-pointer"
                >
                  {ACTIVITY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
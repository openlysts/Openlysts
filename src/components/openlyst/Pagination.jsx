import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-border bg-bg-card text-text-secondary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className="px-3 py-2 rounded-lg text-sm border border-border bg-bg-card text-text-secondary hover:bg-bg-hover">1</button>
          {start > 2 && <span className="px-1 text-text-muted">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
            p === page
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-text-muted">…</span>}
          <button onClick={() => onChange(totalPages)} className="px-3 py-2 rounded-lg text-sm border border-border bg-bg-card text-text-secondary hover:bg-bg-hover">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-border bg-bg-card text-text-secondary hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
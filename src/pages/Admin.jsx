import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { runIngestion, recalculateScores, reclassifyRepos } from '@/lib/api';
import { RefreshCw, Calculator, Tags, Loader2, CheckCircle, AlertCircle, TrendingUp, Database, ShieldCheck } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';

export default function Admin() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(null);
  const [message, setMessage] = useState(null);

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['admin-repos'],
    queryFn: () => localClient.entities.Repository.list('-stars', 2000),
  });
  const { data: runs = [] } = useQuery({
    queryKey: ['admin-runs'],
    queryFn: () => localClient.entities.IngestionRun.list('-started_at', 10),
  });

  const totalRepos = repos.length;
  const verifiedOss = repos.filter((r) => r.license_status === 'verified_oss').length;
  const newToday = repos.filter((r) => r.last_ingested_at && new Date(r.last_ingested_at).getTime() > Date.now() - 86400000).length;
  const topTrending = [...repos].sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0)).slice(0, 10);

  const categoryCounts = {};
  for (const r of repos) {
    for (const c of (r.categories || [])) {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    }
  }

  const lastRun = runs[0];

  const handleAction = async (name, fn) => {
    setRunning(name);
    setMessage(null);
    try {
      const result = await fn();
      setMessage({ type: 'success', text: `${name} complete: ${JSON.stringify(result).slice(0, 200)}` });
      queryClient.invalidateQueries();
    } catch (err) {
      setMessage({ type: 'error', text: `${name} failed: ${err.message}` });
    } finally {
      setRunning(null);
    }
  };

  const toggleFlag = async (repo, flag) => {
    await localClient.entities.Repository.update(repo.id, { [flag]: !repo[flag] });
    queryClient.invalidateQueries({ queryKey: ['admin-repos'] });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-text mb-1">Admin Dashboard</h1>
      <p className="text-text-muted text-sm mb-6">Manage repository ingestion and data operations.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><Database className="w-3.5 h-3.5" /> Total Repos</div>
          <p className="text-2xl font-bold text-text">{totalRepos}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Verified OSS</div>
          <p className="text-2xl font-bold text-text">{verifiedOss}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><TrendingUp className="w-3.5 h-3.5" /> New (24h)</div>
          <p className="text-2xl font-bold text-text">{newToday}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><RefreshCw className="w-3.5 h-3.5" /> Last Run</div>
          <p className="text-sm font-medium text-text">
            {lastRun ? new Date(lastRun.started_at).toLocaleString() : 'Never'}
          </p>
          {lastRun && (
            <span className={`text-xs ${lastRun.status === 'success' ? 'text-oss' : lastRun.status === 'failed' ? 'text-nonoss' : 'text-trending'}`}>
              {lastRun.status}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleAction('Ingestion', runIngestion)}
          disabled={!!running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {running === 'Ingestion' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Run Ingestion
        </button>
        <button
          onClick={() => handleAction('Recalculate Scores', recalculateScores)}
          disabled={!!running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-card text-text-secondary text-sm font-medium hover:bg-bg-hover disabled:opacity-50"
        >
          {running === 'Recalculate Scores' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          Recalculate Scores
        </button>
        <button
          onClick={() => handleAction('Reclassify', reclassifyRepos)}
          disabled={!!running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-card text-text-secondary text-sm font-medium hover:bg-bg-hover disabled:opacity-50"
        >
          {running === 'Reclassify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tags className="w-4 h-4" />}
          Reclassify Repos
        </button>
      </div>

      {message && (
        <div className={`flex items-start gap-2 p-3 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-oss-soft text-oss' : 'bg-nonoss-soft text-nonoss'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="break-all">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-text mb-3">Repos by Category</h3>
          <div className="space-y-2">
            {CATEGORIES.map((c) => {
              const count = categoryCounts[c.label] || 0;
              const pct = totalRepos > 0 ? (count / totalRepos) * 100 : 0;
              return (
                <div key={c.slug} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-32 truncate">{c.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top trending */}
        <div className="card p-5">
          <h3 className="font-semibold text-text mb-3">Top Trending</h3>
          <div className="space-y-2">
            {topTrending.length === 0 ? (
              <p className="text-text-muted text-sm">No data yet.</p>
            ) : topTrending.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="text-text-muted w-5">{i + 1}.</span>
                <span className="text-text font-medium truncate flex-1">{r.name}</span>
                <span className="text-trending text-xs font-medium">+{r.stars_gained_7d || 0}</span>
                <span className="text-text-muted text-xs">{r.trending_score?.toFixed(1) || '0'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-text mb-3">Recent Ingestion Runs</h3>
        {runs.length === 0 ? (
          <p className="text-text-muted text-sm">No runs yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <span className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-oss' : run.status === 'failed' ? 'bg-nonoss' : 'bg-trending'}`} />
                <span className="text-text-secondary">{new Date(run.started_at).toLocaleString()}</span>
                <span className="text-text-muted text-xs">{run.repos_processed} processed</span>
                <span className="text-text-muted text-xs">{run.repos_added} added</span>
                <span className="text-text-muted text-xs">{run.repos_updated} updated</span>
                <span className={`ml-auto text-xs font-medium ${run.status === 'success' ? 'text-oss' : run.status === 'failed' ? 'text-nonoss' : 'text-trending'}`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repo management table */}
      <div className="card p-5">
        <h3 className="font-semibold text-text mb-3">Repository Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="pb-2 pr-4 font-medium">Repository</th>
                <th className="pb-2 pr-4 font-medium">Stars</th>
                <th className="pb-2 pr-4 font-medium">License</th>
                <th className="pb-2 pr-4 font-medium">Hidden</th>
                <th className="pb-2 font-medium">Featured</th>
              </tr>
            </thead>
            <tbody>
              {repos.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">
                    <span className="text-text font-medium">{r.name}</span>
                    <span className="text-text-muted text-xs ml-1.5">{r.owner}</span>
                  </td>
                  <td className="py-2 pr-4 text-text-secondary">{r.stars || 0}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs ${r.license_status === 'verified_oss' ? 'text-oss' : r.license_status === 'non_oss' ? 'text-nonoss' : 'text-unknown'}`}>
                      {r.license_status || 'unknown'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => toggleFlag(r, 'hidden')}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${r.hidden ? 'bg-nonoss-soft text-nonoss' : 'bg-bg-subtle text-text-muted hover:bg-bg-hover'}`}
                    >
                      {r.hidden ? 'Hidden' : 'Visible'}
                    </button>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => toggleFlag(r, 'featured')}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${r.featured ? 'bg-accent-soft text-accent' : 'bg-bg-subtle text-text-muted hover:bg-bg-hover'}`}
                    >
                      {r.featured ? 'Featured' : 'Normal'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {repos.length > 50 && <p className="text-text-muted text-xs mt-3">Showing first 50 of {repos.length} repositories.</p>}
      </div>
    </div>
  );
}
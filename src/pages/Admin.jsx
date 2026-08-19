import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { runIngestion, recalculateScores, reclassifyRepos } from '@/lib/api';
import { RefreshCw, Calculator, Tags, Loader2, CheckCircle, AlertCircle, TrendingUp, Database, ShieldCheck, Plus, ToggleLeft, ToggleRight, Users, UserX, UserCheck, Shield } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/lib/AuthContext';

export default function Admin() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [running, setRunning] = useState(null);
  const [message, setMessage] = useState(null);
  const [newQuery, setNewQuery] = useState({ query_string: '', category_hint: 'AI' });
  const [activeTab, setActiveTab] = useState('repos'); // 'repos' or 'users'

  // Repos queries
  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['admin-repos'],
    queryFn: () => localClient.entities.Repository.list('-stars', 200),
  });
  const { data: runs = [] } = useQuery({
    queryKey: ['admin-runs'],
    queryFn: () => localClient.entities.IngestionRun.list('-started_at', 10),
  });
  const { data: queries = [] } = useQuery({
    queryKey: ['admin-queries'],
    queryFn: () => localClient.entities.DiscoveryQuery.list('-created_date', 100),
  });

  // Users query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=100', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
  
  const users = usersData?.users || [];

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

  const handleAddQuery = async (e) => {
    e.preventDefault();
    if (!newQuery.query_string.trim()) return;
    setRunning('Add Query');
    try {
      await localClient.entities.DiscoveryQuery.create({
        query_string: newQuery.query_string.trim(),
        category_hint: newQuery.category_hint,
        enabled: true,
      });
      setNewQuery({ query_string: '', category_hint: 'AI' });
      queryClient.invalidateQueries({ queryKey: ['admin-queries'] });
      setMessage({ type: 'success', text: `Query added.` });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to add query: ${err.message}` });
    } finally {
      setRunning(null);
    }
  };

  const toggleQuery = async (q) => {
    await localClient.entities.DiscoveryQuery.update(q.id, { enabled: !q.enabled });
    queryClient.invalidateQueries({ queryKey: ['admin-queries'] });
  };

  // User Actions
  const handleUserAction = async (userId, action, value = null) => {
    if (userId === currentUser?.id) {
      setMessage({ type: 'error', text: 'You cannot perform this action on yourself.' });
      return;
    }
    
    setRunning(`user-${userId}`);
    setMessage(null);
    try {
      let url = `/api/admin/users/${userId}/${action}`;
      let options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      };
      
      if (action === 'role') {
        options.method = 'PATCH';
        options.body = JSON.stringify({ role: value });
      }

      const res = await fetch(url, options);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Action failed');
      
      setMessage({ type: 'success', text: data.message || 'Success' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Admin Dashboard</h1>
          <p className="text-text-muted text-sm">Manage data operations and users.</p>
        </div>
        
        <div className="flex bg-bg-card rounded-lg p-1 border border-border mt-4 sm:mt-0">
          <button 
            onClick={() => setActiveTab('repos')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'repos' ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text'}`}
          >
            Repositories
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text'}`}
          >
            Users
          </button>
        </div>
      </div>

      {message && (
        <div className={`flex items-start gap-2 p-3 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-oss-soft text-oss' : 'bg-nonoss-soft text-nonoss'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="break-all">{message.text}</span>
        </div>
      )}

      {activeTab === 'repos' && (
        <>
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

          {/* Discovery Engine Config */}
          <div className="card p-5 mb-6">
            <h3 className="font-semibold text-text mb-3">Discovery Engine Configuration</h3>
            <p className="text-sm text-text-muted mb-4">Manage the search queries used by the background ingestion worker to find and categorize repositories dynamically.</p>
            
            <form onSubmit={handleAddQuery} className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="e.g. repo:leonxlnx/taste-skill OR topic:ai"
                  value={newQuery.query_string}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, query_string: e.target.value }))}
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={newQuery.category_hint}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, category_hint: e.target.value }))}
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.slug} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!!running || !newQuery.query_string.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-fg font-medium rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              >
                {running === 'Add Query' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Query
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="pb-2 pr-4 font-medium">Search Query</th>
                    <th className="pb-2 pr-4 font-medium">Category Hint</th>
                    <th className="pb-2 pr-4 font-medium">Last Run</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0 hover:bg-bg-subtle/30">
                      <td className="py-2.5 pr-4 font-mono text-xs text-text">{q.query_string}</td>
                      <td className="py-2.5 pr-4 text-text-secondary">{q.category_hint}</td>
                      <td className="py-2.5 pr-4 text-text-muted text-xs">
                        {q.last_run_at ? new Date(q.last_run_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => toggleQuery(q)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            q.enabled 
                              ? 'text-oss bg-oss-soft hover:bg-oss/20' 
                              : 'text-text-muted bg-bg-subtle hover:bg-bg-hover'
                          }`}
                        >
                          {q.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {q.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {queries.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-text-muted text-sm">No discovery queries configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
        </>
      )}

      {activeTab === 'users' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border">
                  <th className="pb-2 pr-4 font-medium">Name & Email</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Providers</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-text-muted">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuspended = u.account_status === 'suspended';
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-subtle/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-text font-medium flex items-center gap-2">
                                {u.name}
                                {isSelf && <span className="bg-accent/20 text-accent text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">You</span>}
                              </div>
                              <div className="text-text-muted text-xs">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            disabled={isSelf || running === `user-${u.id}`}
                            value={u.role}
                            onChange={(e) => handleUserAction(u.id, 'role', e.target.value)}
                            className="bg-bg border border-border rounded text-xs px-2 py-1 text-text focus:border-accent outline-none disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                           <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                             u.account_status === 'active' ? 'bg-oss-soft text-oss' :
                             u.account_status === 'suspended' ? 'bg-trending-soft text-trending' :
                             'bg-nonoss-soft text-nonoss'
                           }`}>
                             {u.account_status}
                           </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {u.providers.map(p => (
                              <span key={p} className="bg-bg-subtle text-text-secondary text-xs px-1.5 py-0.5 rounded capitalize">
                                {p}
                              </span>
                            ))}
                            {u.providers.length === 0 && (
                              <span className="text-text-muted text-xs">Email</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isSuspended ? (
                              <button
                                onClick={() => handleUserAction(u.id, 'reactivate')}
                                disabled={isSelf || running === `user-${u.id}`}
                                className="p-1.5 rounded-md text-oss hover:bg-oss-soft transition-colors disabled:opacity-50"
                                title="Reactivate User"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to suspend ${u.name}?`)) {
                                    handleUserAction(u.id, 'suspend');
                                  }
                                }}
                                disabled={isSelf || running === `user-${u.id}`}
                                className="p-1.5 rounded-md text-trending hover:bg-trending-soft transition-colors disabled:opacity-50"
                                title="Suspend User"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to disable/delete ${u.name}?`)) {
                                  handleUserAction(u.id, 'disable');
                                }
                              }}
                              disabled={isSelf || running === `user-${u.id}`}
                              className="p-1.5 rounded-md text-nonoss hover:bg-nonoss-soft transition-colors disabled:opacity-50"
                              title="Disable User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, Zap, Database, RefreshCw, Shield, Clock,
  AlertTriangle, Loader2
} from 'lucide-react';

const EASE_OUT = [0.23, 1, 0.32, 1];

function Sparkline({ data = [], height = 28, color = '#6366f1' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 100;
  const padding = 2;
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color = 'text-accent', status = undefined, trend = null, trendColor = '#6366f1' }) {
  return (
    <div className="bg-bg-card/80 backdrop-blur-sm p-4 rounded-2xl border border-border/60 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</span>
          {status && (
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
              status === 'healthy' ? 'bg-green-500/10 text-green-400' :
              status === 'degraded' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {status === 'healthy' ? 'Healthy' : status === 'degraded' ? 'Degraded' : 'Down'}
            </span>
          )}
        </div>
        <div className="text-2xl font-black text-text">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
      </div>
      {trend && trend.length >= 2 && (
        <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Trend</span>
          <Sparkline data={trend} color={trendColor} />
        </div>
      )}
    </div>
  );
}



function TokenRow({ token }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle/50 border border-border/40">
      <div className={`w-2 h-2 rounded-full ${token.isRateLimited ? 'bg-yellow-400 animate-pulse' : token.isDisabled ? 'bg-red-400' : 'bg-green-400'}`} />
      <span className="text-sm font-mono text-text">{token.masked}</span>
      <span className="text-xs text-text-muted ml-auto">{token.requests} requests</span>
      {token.isRateLimited && (
        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
          Rate limited ({token.resetsIn}s)
        </span>
      )}
      {token.isDisabled && (
        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
          Disabled
        </span>
      )}
    </div>
  );
}

export default function SystemHealthTab() {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ingestion/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load health data');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Error Tracker metrics (2.5): server + client errors aggregated in-memory
  const { data: errors } = useQuery({
    queryKey: ['admin-errors'],
    queryFn: async () => {
      const res = await fetch('/api/admin/errors', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load error metrics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const tokens = health?.tokens || {};
  const ingestion = health?.runs?.[0] || {};
  const repoHistory = (health?.runs || []).map(r => r.repos_processed || 0).reverse();
  const errorHistory = (health?.runs || []).map(r => r.error_log ? r.error_log.split('\n').filter(Boolean).length : 0).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" /> System Health Dashboard
        </h3>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text bg-bg-subtle rounded-lg border border-border/50 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Tokens"
          value={`${tokens.healthyTokens || 0}/${tokens.totalTokens || 0}`}
          sub={`${tokens.totalRequests || 0} total requests`}
          icon={Shield}
          color="text-green-400"
          status={tokens.healthyTokens === tokens.totalTokens ? 'healthy' : tokens.healthyTokens > 0 ? 'degraded' : 'down'}
        />
        <MetricCard
          label="Repos"
          value={ingestion.repos_processed?.toLocaleString() || '—'}
          sub={`+${ingestion.repos_added || 0} new`}
          icon={Database}
          color="text-blue-400"
          trend={repoHistory.length >= 2 ? repoHistory : [45000, 48000, 49523]}
          trendColor="#3b82f6"
        />
        <MetricCard
          label="Last Run"
          value={ingestion.finished_at ? new Date(ingestion.finished_at).toLocaleTimeString() : '—'}
          sub={ingestion.status || 'No runs yet'}
          icon={Clock}
          color="text-purple-400"
          status={ingestion.status === 'success' ? 'healthy' : ingestion.status === 'partial' ? 'degraded' : undefined}
        />
        <MetricCard
          label="Errors"
          value={ingestion.error_log ? ingestion.error_log.split('\n').filter(Boolean).length : 0}
          sub="in last run"
          icon={AlertTriangle}
          color={ingestion.error_log?.length > 0 ? 'text-yellow-400' : 'text-green-400'}
          status={ingestion.error_log?.length > 0 ? 'degraded' : 'healthy'}
          trend={errorHistory.length >= 2 ? errorHistory : [0, 0, 0]}
          trendColor="#eab308"
        />
      </div>

      {/* Token Pool */}
      <div className="bg-bg-card/80 backdrop-blur-sm p-5 rounded-2xl border border-border/60">
        <h4 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" /> Token Pool
        </h4>
        <div className="space-y-2">
          {tokens.tokens?.length > 0 ? (
            tokens.tokens.map((t, i) => <TokenRow key={i} token={t} />)
          ) : (
            <p className="text-xs text-text-muted py-4 text-center">No tokens configured</p>
          )}
        </div>
      </div>

      {/* Error Tracker */}
      {errors && (
        <div className="bg-bg-card/80 backdrop-blur-sm p-5 rounded-2xl border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-text flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Error Tracker
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              errors.total === 0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {errors.total === 0 ? 'No errors captured' : `${errors.total} total`}
            </span>
          </div>

          {errors.total === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">No errors tracked yet — stays empty while everything is healthy.</p>
          ) : (
            <>
              {/* Top error codes */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(errors.byCode || {}).slice(0, 6).map(([code, count]) => (
                  <span key={code} className="text-[11px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                    {code} × {count}
                  </span>
                ))}
              </div>

              {/* Recent errors */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(errors.recent || []).slice(0, 8).map((err, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-subtle/50 border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        {err.code}
                      </span>
                      <span className="text-xs text-text-muted">
                        {err.method ? `${err.method} ` : ''}{err.path}
                      </span>
                      <span className="text-[10px] text-text-muted ml-auto">
                        {err.timestamp ? new Date(err.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary break-words">{err.message}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Ingestion Runs History */}
      <div className="bg-bg-card/80 backdrop-blur-sm p-5 rounded-2xl border border-border/60">
        <h4 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" /> Recent Ingestion Runs
        </h4>
        <div className="space-y-2">
          {health?.runs?.length > 0 ? (
            health.runs.map((run, i) => (
              <div key={run.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle/50 border border-border/40">
                <div className={`w-2 h-2 rounded-full ${
                  run.status === 'success' ? 'bg-green-400' :
                  run.status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="text-xs text-text-muted w-24">
                  {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                </span>
                <span className="text-sm font-bold text-text flex-1">
                  {run.repos_processed || 0} processed
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  run.status === 'success' ? 'bg-green-500/10 text-green-400' :
                  run.status === 'partial' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {run.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-text-muted py-4 text-center">No ingestion runs recorded</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

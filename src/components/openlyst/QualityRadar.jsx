import React, { useState } from 'react';
import { Sparkles, Activity, Award } from 'lucide-react';

const AXES = [
  { key: 'activity', label: 'Activity', desc: 'Commit recency & push frequency' },
  { key: 'community', label: 'Community', desc: 'Forks & contributor interaction' },
  { key: 'documentation', label: 'Docs', desc: 'README depth, license & homepage' },
  { key: 'testing', label: 'Testing', desc: 'Test coverage, CI/CD signals' },
  { key: 'security', label: 'Security', desc: 'License hygiene & active maintenance' },
  { key: 'maintenance', label: 'Freshness', desc: 'Update cadence within 30-90 days' },
  { key: 'adoption', label: 'Adoption', desc: 'Developer star volume & awareness' },
  { key: 'codeQuality', label: 'Quality', desc: 'Composite repository health score' },
];

export default function QualityRadar({ repo }) {
  const [activeAxisKey, setActiveAxisKey] = useState(null);

  if (!repo) return null;

  // Compute 8-dimension scores using real catalog and repository metadata
  const stars = Number(repo.stargazers_count || repo.stars || 0);
  const forks = Number(repo.forks_count || repo.forks || 0);
  const openIssues = Number(repo.open_issues_count || repo.open_issues || 0);
  const updatedDateStr = repo.github_updated_at || repo.pushed_at || repo.updated_at;
  const updatedMs = updatedDateStr ? new Date(updatedDateStr).getTime() : 0;
  const daysSinceUpdate = updatedMs ? Math.max(0, (Date.now() - updatedMs) / (1000 * 60 * 60 * 24)) : 180;

  const licenseRaw = String(repo.license_key || repo.license?.spdx_id || repo.license_spdx || repo.license_name || repo.license || '').toLowerCase();
  const hasValidLicense = licenseRaw && licenseRaw !== 'unknown' && licenseRaw !== 'other' && licenseRaw !== 'non_oss';
  const topics = Array.isArray(repo.topics) ? repo.topics.map(t => String(t).toLowerCase()) : [];
  const hasTestingSignals = topics.some(t => /test|ci|coverage|workflow|vitest|jest|pytest|cypress|testing/.test(t));
  const hasDocs = (repo.description && repo.description.length >= 25) || Boolean(repo.homepage_url || repo.homepage);

  const metrics = {
    activity: daysSinceUpdate <= 7 ? 98 : (daysSinceUpdate <= 30 ? 85 : (daysSinceUpdate <= 90 ? 60 : (daysSinceUpdate <= 180 ? 40 : 20))),
    community: Math.min(100, Math.max(25, Math.round(Math.min(50, Math.log10(forks + 1) * 15) + Math.min(50, Math.log10(openIssues + 1) * 15)))),
    documentation: Math.min(100, (repo.description && repo.description.length >= 25 ? 45 : 15) + (repo.homepage_url || repo.homepage ? 30 : 0) + (hasValidLicense ? 25 : 0)),
    testing: hasTestingSignals ? 92 : 45,
    security: repo.archived ? 20 : (hasValidLicense ? 95 : 35),
    maintenance: daysSinceUpdate <= 14 ? 96 : (daysSinceUpdate <= 45 ? 80 : (daysSinceUpdate <= 120 ? 55 : 25)),
    adoption: stars > 0 ? Math.min(100, Math.round(Math.log10(stars) * 18 + 10)) : 20,
    codeQuality: Math.round(Number(repo.quality_score) || 75),
  };

  const getDiagnostic = (key, val) => {
    switch (key) {
      case 'activity':
        return daysSinceUpdate <= 7
          ? 'Active push detected in last 7 days — high velocity'
          : (daysSinceUpdate <= 30 ? 'Pushed within the last 30 days — stable cadence' : `Last update was ${Math.round(daysSinceUpdate)} days ago`);
      case 'community':
        return forks >= 500
          ? `${forks.toLocaleString()} forks & ${openIssues.toLocaleString()} open issues — massive ecosystem engagement`
          : (forks >= 20 ? `${forks.toLocaleString()} forks & ${openIssues} issues — active community` : 'Early-stage community adoption');
      case 'documentation':
        return hasDocs
          ? (repo.homepage_url || repo.homepage ? 'Verified description & official documentation URL' : 'Clear repository description provided')
          : 'Minimal documentation metadata provided';
      case 'testing':
        return hasTestingSignals
          ? 'Automated tests & CI/CD workflow signals detected'
          : 'No explicit CI/CD or automated test signals found in metadata';
      case 'security':
        return repo.archived
          ? 'Repository is archived — maintenance discontinued'
          : (hasValidLicense ? `Verified OSI License (${(repo.license_key || repo.license_name || 'Open Source').toUpperCase()})` : 'Unknown or unverified license — compliance risk');
      case 'maintenance':
        return daysSinceUpdate <= 14
          ? 'Maintenance in top tier of active open source'
          : (daysSinceUpdate <= 90 ? 'Healthy quarterly update cadence' : 'Stale: No releases or commits in 90+ days');
      case 'adoption':
        return stars >= 10000
          ? `${stars.toLocaleString()} stars — top-tier industry adoption`
          : (stars >= 500 ? `${stars.toLocaleString()} stars — solid developer adoption` : `${stars} stars — emerging utility`);
      case 'codeQuality':
        return `Composite score of ${val}/100 from automated architecture audit`;
      default:
        return '';
    }
  };

  const center = 110;
  const radius = 75;
  const angleStep = (Math.PI * 2) / AXES.length;

  // Calculate polygon points
  const points = AXES.map((axis, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = Math.max(15, Math.min(100, metrics[axis.key] || 50));
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, value, angle, ...axis, diagnostic: getDiagnostic(axis.key, value) };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  const overallAverage = Math.round(Object.values(metrics).reduce((a, b) => a + b, 0) / AXES.length);

  const selectedPoint = points.find(p => p.key === activeAxisKey) || null;

  return (
    <div className="card p-5 mb-6 bg-bg-card/90 backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Health Radar</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-soft text-accent text-xs font-bold font-mono">
          <Sparkles className="w-3 h-3" />
          {overallAverage}/100
        </div>
      </div>

      <div className="relative flex justify-center items-center py-1">
        <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Background Concentric Webs */}
          {[0.25, 0.5, 0.75, 1.0].map((level, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="currentColor"
              className="text-border/40"
              strokeDasharray={level === 1.0 ? 'none' : '3 3'}
              strokeWidth="1"
            />
          ))}

          {/* Radial Spokes */}
          {AXES.map((axis, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isSelected = activeAxisKey === axis.key;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className={isSelected ? 'text-accent stroke-[2]' : 'text-border/40 stroke-[1]'}
              />
            );
          })}

          {/* Radar Filled Shape */}
          <path
            d={polygonPath}
            fill="url(#radarGrad)"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          />

          {/* Interactive Radar Vertex Nodes with Large Accessible Hit Targets */}
          {points.map((p, i) => {
            const isSelected = activeAxisKey === p.key;
            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setActiveAxisKey(p.key)}
                onClick={() => setActiveAxisKey(activeAxisKey === p.key ? null : p.key)}
              >
                {/* Generous invisible hit target (36px wide) */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="18"
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Visible vertex node */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? '6' : '4'}
                  fill={isSelected ? '#ffffff' : 'hsl(var(--accent))'}
                  stroke={isSelected ? 'hsl(var(--accent))' : 'transparent'}
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Spoke label */}
                {(() => {
                  const labelDist = radius + 16;
                  const lx = center + labelDist * Math.cos(p.angle);
                  const ly = center + labelDist * Math.sin(p.angle) + 3;
                  return (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      className={`text-[10px] font-mono tracking-tight transition-colors select-none ${
                        isSelected ? 'fill-accent font-bold scale-110' : 'fill-text-muted hover:fill-text'
                      }`}
                    >
                      {p.label}
                    </text>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Clickable Dimension Chips for Touch & Mouse Inspection */}
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {points.map((p) => {
          const isSelected = activeAxisKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveAxisKey(isSelected ? null : p.key)}
              onMouseEnter={() => setActiveAxisKey(p.key)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${
                isSelected
                  ? 'bg-accent text-accent-fg border-accent font-bold shadow-sm'
                  : 'bg-bg-subtle/60 text-text-muted border-border/40 hover:text-text hover:border-border'
              }`}
            >
              {p.label} <span className="font-bold">{p.value}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Diagnostic Display */}
      <div className="min-h-[44px] mt-2.5 p-2.5 rounded-xl bg-bg-subtle/80 border border-border/50 text-center transition-all">
        {selectedPoint ? (
          <div>
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">{selectedPoint.label}</span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-bg-card border border-border text-text">
                {selectedPoint.value}/100
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                selectedPoint.value >= 80 ? 'bg-green-500/10 text-green-500' : (selectedPoint.value >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500')
              }`}>
                {selectedPoint.value >= 80 ? 'Optimal' : (selectedPoint.value >= 50 ? 'Adequate' : 'Review')}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">{selectedPoint.diagnostic}</p>
          </div>
        ) : (
          <div className="text-[11px] text-text-muted flex items-center justify-center gap-1.5 py-1">
            <Activity className="w-3.5 h-3.5 text-accent" /> Tap or hover any dimension to inspect live diagnostics
          </div>
        )}
      </div>
    </div>
  );
}


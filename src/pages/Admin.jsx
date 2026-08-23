import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Database, RefreshCw, Calculator, Trash2, 
  Search, Plus, CheckCircle, Shield, KeyRound, Copy, Check, Layers, Users, 
  UserCheck, UserX, Eye, EyeOff, Star, Sparkles, Download, 
  Radio, Clock, Cpu, HardDrive, Zap, Loader2, Compass, Play, X, CheckSquare, Square
} from 'lucide-react';
import { localClient } from '@/api/localClient';
import { runIngestion, recalculateScores, reclassifyRepos } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function Admin() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'repositories' | 'alternatives' | 'discovery' | 'users' | 'audit'
  const [runningAction, setRunningAction] = useState(null);
  const [message, setMessage] = useState(null);

  // ─── Telemetry Query ───────────────────────────────────────────────
  const { data: telemetry, isLoading: telemetryLoading, refetch: refetchTelemetry } = useQuery({
    queryKey: ['admin-telemetry'],
    queryFn: async () => {
      const res = await fetch('/api/admin/telemetry', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load telemetry');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // ─── Repositories Query ───────────────────────────────────────────
  const { data: repos = [], isLoading: reposLoading, refetch: refetchRepos } = useQuery({
    queryKey: ['admin-repos'],
    queryFn: () => localClient.entities.Repository.list('-stars', 500),
  });

  // ─── Ingestion Runs Query ─────────────────────────────────────────
  const { data: runs = [] } = useQuery({
    queryKey: ['admin-runs'],
    queryFn: () => localClient.entities.IngestionRun.list('-started_at', 15),
  });

  // ─── Discovery Queries Query ──────────────────────────────────────
  const { data: queries = [], refetch: refetchQueries } = useQuery({
    queryKey: ['admin-queries'],
    queryFn: () => localClient.entities.DiscoveryQuery.list('-created_date', 100),
  });

  // ─── Users Query ──────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?limit=100&search=${encodeURIComponent(userSearch)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
  const users = usersData?.users || [];

  // ─── Audit Logs Query ─────────────────────────────────────────────
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['admin-audit', auditActionFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit?limit=100${auditActionFilter ? `&action=${encodeURIComponent(auditActionFilter)}` : ''}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load audit logs');
      return res.json();
    },
  });
  const auditLogs = auditData?.logs || [];

  // ─── SaaS Alternatives Query ──────────────────────────────────────
  const { data: alternatives = [], isLoading: altsLoading, refetch: refetchAlts } = useQuery({
    queryKey: ['admin-alternatives'],
    queryFn: () => localClient.entities.Alternative.list('-feature_parity_score', 200),
  });

  // ─── Local State for Operations ───────────────────────────────────
  const [syncInput, setSyncInput] = useState('');
  const [syncCategory, setSyncCategory] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Discovery Sandbox
  const [sandboxQuery, setSandboxQuery] = useState('topic:rag stars:>500');
  const [sandboxResults, setSandboxResults] = useState(null);
  const [isSandboxing, setIsSandboxing] = useState(false);
  const [showAltModal, setShowAltModal] = useState(false);
  const [newAlt, setNewAlt] = useState({ paid_tool_name: '', free_tool_name: '', free_tool_repo: '', category: '', migration_difficulty: 'Medium', feature_parity_score: '' });

  // New Discovery Query Form
  const [newQueryString, setNewQueryString] = useState('');
  const [newQueryCategory, setNewQueryCategory] = useState('AI');

  // Repos Table Filters & Bulk Actions
  const [repoSearch, setRepoSearch] = useState('');
  const [repoCatFilter, setRepoCatFilter] = useState('all');
  const [repoLicenseFilter, setRepoLicenseFilter] = useState('all');
  const [selectedRepoIds, setSelectedRepoIds] = useState(new Set());
  const [editingRepo, setEditingRepo] = useState(null);

  // Password Reset Modal
  const [generatedResetLink, setGeneratedResetLink] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtered Repos
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      if (repoSearch) {
        const q = repoSearch.toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchOwner = (r.owner || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchName && !matchOwner && !matchDesc) return false;
      }
      if (repoCatFilter !== 'all' && !(r.categories || []).includes(repoCatFilter)) {
        return false;
      }
      if (repoLicenseFilter !== 'all' && r.license_status !== repoLicenseFilter) {
        return false;
      }
      return true;
    });
  }, [repos, repoSearch, repoCatFilter, repoLicenseFilter]);

  // ─── Actions & Handlers ───────────────────────────────────────────

  const handleGlobalAction = async (name, fn) => {
    setRunningAction(name);
    try {
      const result = await fn();
      toast({
        title: `${name} Complete`,
        description: typeof result === 'object' ? JSON.stringify(result).slice(0, 150) : `${name} executed successfully.`,
      });
      queryClient.invalidateQueries();
    } catch (err) {
      toast({
        title: `${name} Failed`,
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setRunningAction(null);
    }
  };

  const handleFlushCache = async () => {
    setRunningAction('Flush Cache');
    try {
      const res = await fetch('/api/admin/cache/flush', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Cache Flushed', description: data.message });
      queryClient.invalidateQueries();
    } catch (err) {
      toast({ title: 'Flush Failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunningAction(null);
    }
  };

  const handleForceSync = async (e) => {
    e.preventDefault();
    if (!syncInput.trim()) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo: syncInput, category_hint: syncCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sync failed');
      
      if (data.count === 0 && data.errors?.length > 0) {
        throw new Error(data.errors[0]?.error || data.message || 'Failed to ingest repository');
      }

      toast({
        title: 'Ingestion Successful',
        description: `Successfully ingested ${data.count} ${data.count === 1 ? 'repository' : 'repositories'}: ${data.processed?.map(p => p.full_name).join(', ') || ''}`,
      });
      setSyncInput('');
      refetchRepos();
      refetchTelemetry();
    } catch (err) {
      toast({ title: 'Ingestion Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMapAlternative = async (e) => {
    e.preventDefault();
    try {
      await localClient.entities.Alternative.create({
        ...newAlt,
        feature_parity_score: parseFloat(newAlt.feature_parity_score) || 0
      });
      setShowAltModal(false);
      refetchAlts();
      setNewAlt({ paid_tool_name: '', free_tool_name: '', free_tool_repo: '', category: '', migration_difficulty: 'Medium', feature_parity_score: '' });
      toast({ title: 'Success', description: 'Alternative mapped successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRunSandbox = async (e) => {
    e.preventDefault();
    if (!sandboxQuery.trim()) return;
    setIsSandboxing(true);
    try {
      const res = await fetch('/api/admin/discovery/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query_string: sandboxQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sandbox failed');
      setSandboxResults(data);
    } catch (err) {
      toast({ title: 'Sandbox Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSandboxing(false);
    }
  };

  const handleAddDiscoveryQuery = async (e) => {
    e.preventDefault();
    if (!newQueryString.trim()) return;
    try {
      const queries = newQueryString.split('\n').map(q => q.trim()).filter(Boolean);
      await Promise.all(queries.map(q => 
        localClient.entities.DiscoveryQuery.create({
          query_string: q,
          category_hint: newQueryCategory,
          enabled: true,
        })
      ));
      setNewQueryString('');
      refetchQueries();
      toast({ title: 'Queries Created', description: `Added ${queries.length} queries to discovery schedule.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleQuery = async (q) => {
    try {
      await localClient.entities.DiscoveryQuery.update(q.id, { enabled: !q.enabled });
      refetchQueries();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleRepoFlag = async (repo, field) => {
    try {
      const res = await fetch(`/api/admin/repos/${repo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: !repo[field] }),
      });
      if (!res.ok) throw new Error('Update failed');
      refetchRepos();
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteRepo = async (repo) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${repo.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/repos/${repo.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Deleted', description: data.message });
      refetchRepos();
      refetchTelemetry();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRepoIds.size === 0) return;
    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedRepoIds.size} repositories?`)) return;

    try {
      const res = await fetch('/api/admin/repos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: Array.from(selectedRepoIds), action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Bulk Action Complete', description: data.message });
      setSelectedRepoIds(new Set());
      refetchRepos();
      refetchTelemetry();
    } catch (err) {
      toast({ title: 'Bulk Action Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportSelectedRepos = () => {
    const selected = repos.filter(r => selectedRepoIds.has(r.id));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selected, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `openlysts_repos_export_${Date.now()}.json`);
    dl.click();
  };

  const handleSaveRepoEdit = async (e) => {
    e.preventDefault();
    if (!editingRepo) return;
    try {
      const res = await fetch(`/api/admin/repos/${editingRepo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editingRepo.name,
          description: editingRepo.description,
          openlysts_score_boost: parseInt(editingRepo.openlysts_score_boost) || 0,
          featured: editingRepo.featured,
          hidden: editingRepo.hidden,
          staff_pick: editingRepo.staff_pick,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Repository Updated', description: `${editingRepo.name} saved successfully.` });
      setEditingRepo(null);
      refetchRepos();
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleGenerateResetLink = async (user) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-link`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGeneratedResetLink(data);
      setCopiedLink(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Role Updated', description: data.message });
      refetchUsers();
      refetchAudit();
    } catch (err) {
      toast({ title: 'Role Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleUserStatusToggle = async (user, action) => {
    if (user.id === currentUser?.id) {
      toast({ title: 'Action Prohibited', description: 'You cannot suspend or disable yourself.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'Status Updated', description: data.message });
      refetchUsers();
      refetchAudit();
    } catch (err) {
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      toast({ title: 'Action Prohibited', description: 'You cannot delete your own account.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})? All associated bookmarks and sessions will be deleted permanently.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: 'User Deleted', description: data.message });
      refetchUsers();
      refetchAudit();
      refetchTelemetry();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `openlysts_audit_logs_${Date.now()}.json`);
    dl.click();
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* ─── Command Center Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-bg-card/90 to-bg-card/40 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
              Admin Hypervisor
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                God Mode Active
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary">
            Command & control engine: on-demand mining, telemetry vitals, SaaS alternative studio, discovery sandbox, and user governance.
          </p>
        </div>

        {/* Global Action Quick Bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => handleGlobalAction('Full Ingestion', runIngestion)}
            disabled={!!runningAction}
            className="px-3.5 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 touch-target disabled:opacity-50"
          >
            {runningAction === 'Full Ingestion' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Run Ingestion</span>
          </button>

          <button
            onClick={() => handleGlobalAction('Recalculate Scores', recalculateScores)}
            disabled={!!runningAction}
            className="px-3.5 py-2 rounded-xl bg-bg-card border border-border text-text hover:text-accent hover:border-accent/40 text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 touch-target disabled:opacity-50"
          >
            {runningAction === 'Recalculate Scores' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
            <span>Recalculate Scores</span>
          </button>

          <button
            onClick={() => handleGlobalAction('Reclassify Categories', reclassifyRepos)}
            disabled={!!runningAction}
            className="px-3.5 py-2 rounded-xl bg-bg-card border border-border text-text hover:text-accent hover:border-accent/40 text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 touch-target disabled:opacity-50"
          >
            {runningAction === 'Reclassify Categories' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>Reclassify Categories</span>
          </button>

          <button
            onClick={handleFlushCache}
            disabled={!!runningAction}
            className="p-2 rounded-xl bg-bg-card border border-border text-text-muted hover:text-text hover:border-accent/40 shadow-sm active:scale-95 transition-all touch-target"
            title="Flush In-Memory Cache"
            aria-label="Flush In-Memory Cache"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 6-Pillar Navigation Tabs (Touch-scrollable on mobile) ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll bg-bg-card p-1.5 rounded-2xl border border-border shadow-sm">
        {[
          { id: 'telemetry', label: 'Telemetry & Vitals', icon: Activity, badge: telemetry?.githubRateLimit?.remaining !== undefined ? `${telemetry.githubRateLimit.remaining} calls` : null },
          { id: 'repositories', label: 'Repository Studio', icon: Database, badge: `${repos.length}` },
          { id: 'alternatives', label: 'SaaS Alternatives', icon: Layers, badge: `${alternatives.length}` },
          { id: 'discovery', label: 'Discovery Sandbox', icon: Compass, badge: `${queries.length}` },
          { id: 'users', label: 'User Governance', icon: Users, badge: `${users.length}` },
          { id: 'audit', label: 'Security Audit', icon: Shield, badge: `${auditLogs.length}` },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 touch-target ${
                isActive 
                  ? 'bg-accent text-accent-fg shadow-sm' 
                  : 'text-text-secondary hover:text-text hover:bg-bg-subtle'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-black/20 text-white' : 'bg-bg-subtle text-text-muted border border-border/50'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: TELEMETRY & VITALS ─── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Vitals Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="card p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-text-muted text-xs mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"><Radio className="w-3.5 h-3.5 text-accent animate-pulse" /> GitHub Rate Limit</span>
                <span className="text-text-secondary font-mono">{telemetry?.githubRateLimit?.limit || 60} max</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-accent mb-1 font-mono">
                {telemetry?.githubRateLimit?.remaining ?? '—'}
              </div>
              <div className="w-full h-1.5 rounded-full bg-bg-subtle overflow-hidden mt-3">
                <div 
                  className="h-full bg-accent transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((telemetry?.githubRateLimit?.remaining || 0) / (telemetry?.githubRateLimit?.limit || 60)) * 100)}%` }} 
                />
              </div>
            </div>

            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between text-text-muted text-xs mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"><HardDrive className="w-3.5 h-3.5 text-text" /> Repositories Ingested</span>
                <span className="text-oss font-semibold text-[10px]">Verified OSS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-text mb-1">
                {telemetry?.databaseStats?.repositories || repos.length}
              </div>
              <p className="text-xs text-text-muted mt-2 truncate">
                {repos.filter(r => r.license_status === 'verified_oss').length} open-source certified
              </p>
            </div>

            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between text-text-muted text-xs mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"><Cpu className="w-3.5 h-3.5 text-amber-400" /> Server Memory RSS</span>
                <span className="text-text-secondary font-mono text-[10px]">Node {telemetry?.system?.nodeVersion || 'v20'}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 font-mono">
                {telemetry?.system?.memoryRssMb ? `${telemetry.system.memoryRssMb} MB` : '—'}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Heap used: {telemetry?.system?.memoryHeapUsedMb || 0} MB
              </p>
            </div>

            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between text-text-muted text-xs mb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"><Clock className="w-3.5 h-3.5 text-emerald-400" /> System Uptime</span>
                <span className="text-emerald-400 font-semibold text-[10px]">Healthy</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1 font-mono">
                {telemetry?.system?.uptimeSeconds ? `${Math.floor(telemetry.system.uptimeSeconds / 3600)}h ${Math.floor((telemetry.system.uptimeSeconds % 3600) / 60)}m` : '—'}
              </div>
              <p className="text-xs text-text-muted mt-2 truncate">
                Last Run: {runs[0] ? new Date(runs[0].started_at).toLocaleTimeString() : 'Ready'}
              </p>
            </div>
          </div>

          {/* Database Tables Breakdown & Recent Ingestion Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Table Records */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-bold text-text mb-4 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-accent" /> PostgreSQL Storage Telemetry
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Repository Catalog', key: 'repositories', icon: Database, color: 'text-accent' },
                  { label: 'User Accounts', key: 'users', icon: Users, color: 'text-text' },
                  { label: 'Discovery Search Queries', key: 'discoveryQueries', icon: Compass, color: 'text-amber-400' },
                  { label: 'SaaS Alternatives Mappings', key: 'alternatives', icon: Layers, color: 'text-emerald-400' },
                  { label: 'Ingestion Execution Runs', key: 'ingestionRuns', icon: RefreshCw, color: 'text-trending' },
                  { label: 'Security Audit Events', key: 'auditLogs', icon: Shield, color: 'text-purple-400' },
                ].map((row) => {
                  const RowIcon = row.icon;
                  const count = telemetry?.databaseStats?.[row.key] ?? '—';
                  return (
                    <div key={row.key} className="flex items-center justify-between p-2.5 rounded-xl bg-bg-subtle/50 border border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <RowIcon className={`w-4 h-4 ${row.color}`} />
                        <span className="font-medium text-text">{row.label}</span>
                      </div>
                      <span className="font-mono font-bold text-text-secondary bg-bg-card px-2 py-0.5 rounded-md border border-border">
                        {count} records
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ingestion Runs Stream */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-bold text-text mb-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-accent" /> Ingestion Telemetry Stream</span>
                <span className="text-xs font-normal text-text-muted">{runs.length} runs</span>
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {runs.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center">No runs recorded yet.</p>
                ) : (
                  runs.map((run) => (
                    <div key={run.id} className="p-3 rounded-xl bg-bg-subtle/50 border border-border/40 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-medium text-text">
                          <span className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-oss' : 'bg-nonoss'}`} />
                          <span>{new Date(run.started_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {run.repos_processed || 0} processed · {run.repos_added || 0} added · {run.repos_updated || 0} updated
                        </p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${run.status === 'success' ? 'bg-oss-soft text-oss' : 'bg-nonoss-soft text-nonoss'}`}>
                        {run.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: REPOSITORY STUDIO & INGESTION ─── */}
      {activeTab === 'repositories' && (
        <div className="space-y-6">
          {/* On-Demand Force Ingest Studio */}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-accent/5 via-bg-card to-bg-card border-accent/20">
            <h3 className="font-bold text-text text-sm sm:text-base mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Superpower: On-Demand Custom Repo Ingest
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Enter any GitHub repository URL (or multi-line batch) to immediately fetch metadata, verify license, compute Openlysts quality scores, and commit into the live catalog.
            </p>

            <form onSubmit={handleForceSync} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <textarea
                    placeholder="e.g. facebook/react, https://github.com/vllm-project/vllm (or multi-line batch)"
                    value={syncInput}
                    onChange={(e) => setSyncInput(e.target.value)}
                    className="w-full bg-bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent min-h-[42px] max-h-32 resize-y"
                    required
                    rows={1}
                  />
                </div>
                <div className="sm:w-56">
                  <select
                    value={syncCategory}
                    onChange={(e) => setSyncCategory(e.target.value)}
                    className="w-full bg-bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:border-accent"
                  >
                    <option value="">Auto-Classify Category</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.label}>{c.label}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSyncing || !syncInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-xs sm:text-sm font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 touch-target"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Ingest Repository</span>
                </button>
              </div>
            </form>
          </div>

          {/* Repository Management Hub */}
          <div className="card p-5 sm:p-6 space-y-4">
            {/* Toolbar: Search, Filters, Bulk Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search repos by name, owner, description..."
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="w-full bg-bg-subtle border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <select
                  value={repoCatFilter}
                  onChange={(e) => setRepoCatFilter(e.target.value)}
                  className="bg-bg-subtle border border-border rounded-xl px-2.5 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.label}>{c.label}</option>)}
                </select>
                <select
                  value={repoLicenseFilter}
                  onChange={(e) => setRepoLicenseFilter(e.target.value)}
                  className="bg-bg-subtle border border-border rounded-xl px-2.5 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="all">All Licenses</option>
                  <option value="verified_oss">Verified OSS</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Bulk Actions Menu */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRepoIds.size > 0 && (
                  <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-xl px-2.5 py-1 text-xs font-bold text-accent">
                    <span>{selectedRepoIds.size} selected</span>
                    <button onClick={() => handleBulkAction('feature')} className="hover:underline ml-1">Feature</button>
                    <span>·</span>
                    <button onClick={() => handleBulkAction('hide')} className="hover:underline">Hide</button>
                    <span>·</span>
                    <button onClick={() => handleBulkAction('delete')} className="text-nonoss hover:underline">Delete</button>
                    <span>·</span>
                    <button onClick={handleExportSelectedRepos} className="hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Export</button>
                  </div>
                )}
                <span className="text-xs text-text-muted font-medium">
                  Showing {filteredRepos.length} of {repos.length} repos
                </span>
              </div>
            </div>

            {/* Repos Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border font-semibold">
                    <th className="pb-2.5 pl-2 w-8">
                      <button
                        onClick={() => {
                          if (selectedRepoIds.size === filteredRepos.length) setSelectedRepoIds(new Set());
                          else setSelectedRepoIds(new Set(filteredRepos.map(r => r.id)));
                        }}
                        className="text-text-muted hover:text-text"
                      >
                        {selectedRepoIds.size > 0 && selectedRepoIds.size === filteredRepos.length ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="pb-2.5 pr-4">Repository</th>
                    <th className="pb-2.5 pr-4">Score</th>
                    <th className="pb-2.5 pr-4">Stars</th>
                    <th className="pb-2.5 pr-4">License</th>
                    <th className="pb-2.5 pr-4">Categories</th>
                    <th className="pb-2.5 pr-4">Flags</th>
                    <th className="pb-2.5 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {reposLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading repositories...
                      </td>
                    </tr>
                  ) : filteredRepos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted">No repositories found.</td>
                    </tr>
                  ) : (
                    filteredRepos.slice(0, 100).map((r) => {
                      const isSelected = selectedRepoIds.has(r.id);
                      return (
                        <tr key={r.id} className={`hover:bg-bg-subtle/40 transition-colors ${isSelected ? 'bg-accent/5' : ''}`}>
                          <td className="py-2.5 pl-2">
                            <button
                              onClick={() => {
                                const next = new Set(selectedRepoIds);
                                if (next.has(r.id)) next.delete(r.id);
                                else next.add(r.id);
                                setSelectedRepoIds(next);
                              }}
                              className="text-text-muted hover:text-text"
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="font-bold text-text flex items-center gap-1.5">
                              <span>{r.name}</span>
                              <span className="text-[10px] text-text-muted font-normal">/{r.owner}</span>
                              {r.staff_pick && <span className="text-[9px] bg-amber-400/10 text-amber-400 px-1 py-0.2 rounded font-bold">Staff Pick</span>}
                            </div>
                            <p className="text-[10px] text-text-secondary line-clamp-1 max-w-sm mt-0.5">{r.description}</p>
                          </td>
                          <td className="py-2.5 pr-4 font-mono font-bold text-accent">
                            {r.openlysts_score || r.quality_score || 0}
                            {r.openlysts_score_boost ? <span className="text-[9px] text-emerald-400 ml-1">+{r.openlysts_score_boost}</span> : null}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-text-secondary font-semibold">
                            {(r.stars || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              r.license_status === 'verified_oss' ? 'bg-oss-soft text-oss' : 'bg-nonoss-soft text-nonoss'
                            }`}>
                              {r.license_spdx || r.license_status || 'unknown'}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex gap-1 flex-wrap max-w-xs">
                              {(r.categories || []).slice(0, 2).map((c) => (
                                <span key={c} className="text-[9px] bg-bg-subtle px-1.5 py-0.2 rounded text-text-secondary border border-border">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleRepoFlag(r, 'featured')}
                                className={`p-1 rounded text-[10px] font-bold ${r.featured ? 'bg-accent text-accent-fg' : 'bg-bg-subtle text-text-muted'}`}
                                title="Toggle Featured"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleToggleRepoFlag(r, 'hidden')}
                                className={`p-1 rounded text-[10px] font-bold ${r.hidden ? 'bg-nonoss text-white' : 'bg-bg-subtle text-text-muted'}`}
                                title="Toggle Hidden"
                              >
                                {r.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 text-right pr-2">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingRepo({ ...r })}
                                className="px-2 py-1 rounded bg-bg-subtle hover:bg-bg-hover text-text font-bold text-[10px]"
                              >
                                Edit / Boost
                              </button>
                              <button
                                onClick={() => handleDeleteRepo(r)}
                                className="p-1 rounded text-nonoss hover:bg-nonoss-soft"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SAAS ALTERNATIVES STUDIO ─── */}
      {activeTab === 'alternatives' && (
        <div className="space-y-6">
          {/* MAP NEW ALTERNATIVE MODAL */}
          {showAltModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-bg-card border border-border rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-text mb-4">Map New SaaS Alternative</h3>
                <form onSubmit={handleMapAlternative} className="space-y-4">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Proprietary SaaS (e.g. Firebase)</label>
                    <input required className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.paid_tool_name} onChange={e => setNewAlt({...newAlt, paid_tool_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Open Source Repo (e.g. Supabase)</label>
                    <input required className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.free_tool_name} onChange={e => setNewAlt({...newAlt, free_tool_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">GitHub Repo Slug (e.g. supabase/supabase)</label>
                    <input required className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.free_tool_repo} onChange={e => setNewAlt({...newAlt, free_tool_repo: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Category (e.g. Databases & Backend)</label>
                    <input required className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.category} onChange={e => setNewAlt({...newAlt, category: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Migration Difficulty</label>
                      <select className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.migration_difficulty} onChange={e => setNewAlt({...newAlt, migration_difficulty: e.target.value})}>
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Match Score (%)</label>
                      <input required type="number" className="w-full bg-bg border border-border rounded p-2 text-sm text-text" value={newAlt.feature_parity_score} onChange={e => setNewAlt({...newAlt, feature_parity_score: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowAltModal(false)} className="px-4 py-2 rounded text-sm text-text border border-border hover:bg-bg-subtle">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded text-sm bg-emerald-500 text-black font-bold hover:bg-emerald-400">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-emerald-500/5 via-bg-card to-bg-card border-emerald-500/20">
            <h3 className="font-bold text-text text-sm sm:text-base mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-400" /> SaaS Alternative Mapping Studio</span>
              <button onClick={() => setShowAltModal(true)} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
                Map New Alternative
              </button>
            </h3>
            <p className="text-xs text-text-secondary">
              Map and manage curated open-source alternatives for proprietary SaaS products with migration difficulty ratings and feature parity scores.
            </p>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border font-semibold">
                    <th className="pb-2.5 pr-4">Open Source Tool</th>
                    <th className="pb-2.5 pr-4">Replaces SaaS</th>
                    <th className="pb-2.5 pr-4">Category</th>
                    <th className="pb-2.5 pr-4">Score</th>
                    <th className="pb-2.5 pr-4">Migration</th>
                    <th className="pb-2.5 text-right pr-2">Stars</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {altsLoading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted">Loading alternatives...</td></tr>
                  ) : alternatives.map((alt) => (
                    <tr key={alt.id} className="hover:bg-bg-subtle/30">
                      <td className="py-2.5 pr-4 font-bold text-text">{alt.resolved_name || alt.title}</td>
                      <td className="py-2.5 pr-4">
                        <span className="font-bold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded border border-border">
                          {alt.paid_tool_name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">{alt.category}</td>
                      <td className="py-2.5 pr-4 font-mono font-bold text-accent">{alt.openlysts_score || alt.quality_score}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-bg-subtle text-text-secondary border border-border">
                          {alt.migration_difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right pr-2 font-mono font-semibold text-text-secondary">
                        {(alt.stars || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: DISCOVERY SANDBOX & QUERIES ─── */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Query Sandbox */}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-amber-500/5 via-bg-card to-bg-card border-amber-500/20">
            <h3 className="font-bold text-text text-sm sm:text-base mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Superpower: GitHub Discovery Query Sandbox
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Test search syntax against live GitHub Search API before committing to the background schedule. Preview match counts and top repositories.
            </p>

            <form onSubmit={handleRunSandbox} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. topic:rag stars:>500 language:python"
                value={sandboxQuery}
                onChange={(e) => setSandboxQuery(e.target.value)}
                className="flex-1 bg-bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-text font-mono focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={isSandboxing || !sandboxQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm touch-target"
              >
                {isSandboxing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Test Query (Dry Run)</span>
              </button>
            </form>

            {/* Sandbox Results Preview */}
            {sandboxResults && (
              <div className="mt-4 p-4 rounded-xl bg-bg-card border border-border/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-oss" /> Live GitHub Match: {(sandboxResults.total_count || 0).toLocaleString()} repositories
                  </span>
                  <span className="text-text-muted">Top 5 Sample Preview</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sandboxResults.preview?.map((p) => (
                    <div key={p.full_name} className="p-2.5 rounded-lg bg-bg-subtle border border-border/50 text-xs">
                      <div className="font-bold text-text flex items-center justify-between">
                        <span>{p.full_name}</span>
                        <span className="text-accent font-mono font-bold">★ {p.stars}</span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Discovery Query Schedule Manager */}
          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="font-bold text-text text-sm">Scheduled Discovery Queries ({queries.length})</h3>
            
            <form onSubmit={handleAddDiscoveryQuery} className="flex flex-col sm:flex-row gap-3">
              <textarea
                placeholder="New discovery query (e.g. topic:ai-agents stars:>100)&#10;Support multiple separated by newlines."
                value={newQueryString}
                onChange={(e) => setNewQueryString(e.target.value)}
                className="flex-1 bg-bg-subtle border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-accent min-h-[40px] resize-y"
                required
              />
              <select
                value={newQueryCategory}
                onChange={(e) => setNewQueryCategory(e.target.value)}
                className="sm:w-48 bg-bg-subtle border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
              >
                {CATEGORIES.map(c => <option key={c.slug} value={c.label}>{c.label}</option>)}
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-accent text-accent-fg font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 touch-target"
              >
                <Plus className="w-3.5 h-3.5" /> Add Query
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border font-semibold">
                    <th className="pb-2.5 pr-4">Search Query</th>
                    <th className="pb-2.5 pr-4">Category Hint</th>
                    <th className="pb-2.5 pr-4">Last Run</th>
                    <th className="pb-2.5 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {queries.map((q) => (
                    <tr key={q.id} className="hover:bg-bg-subtle/30">
                      <td className="py-2.5 pr-4 font-mono font-bold text-text">{q.query_string}</td>
                      <td className="py-2.5 pr-4 text-text-secondary">{q.category_hint}</td>
                      <td className="py-2.5 pr-4 text-text-muted font-mono">{q.last_run_at ? new Date(q.last_run_at).toLocaleString() : 'Pending'}</td>
                      <td className="py-2.5 text-right pr-2">
                        <button
                          onClick={() => handleToggleQuery(q)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            q.enabled ? 'bg-oss-soft text-oss' : 'bg-bg-subtle text-text-muted'
                          }`}
                        >
                          {q.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: USER GOVERNANCE & SECURITY ─── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
              <div>
                <h3 className="font-bold text-text text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Registered User Accounts ({users.length})
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Manage permissions, instant magic password reset links, and account status.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-bg-subtle border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border font-semibold">
                    <th className="pb-2.5 pr-4">User</th>
                    <th className="pb-2.5 pr-4">Role</th>
                    <th className="pb-2.5 pr-4">Status</th>
                    <th className="pb-2.5 pr-4">Auth Providers</th>
                    <th className="pb-2.5 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {usersLoading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted">Loading users...</td></tr>
                  ) : users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuspended = u.account_status === 'SUSPENDED';
                    return (
                      <tr key={u.id} className="hover:bg-bg-subtle/30">
                        <td className="py-3 pr-4">
                          <div className="font-bold text-text flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.2 rounded uppercase font-bold">You</span>}
                          </div>
                          <p className="text-[11px] text-text-muted font-mono">{u.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            disabled={isSelf}
                            value={u.role?.toUpperCase() || 'USER'}
                            onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                            className="bg-bg-subtle border border-border rounded-lg px-2 py-1 text-xs text-text font-bold focus:border-accent disabled:opacity-50"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.account_status === 'ACTIVE' ? 'bg-oss-soft text-oss' : 'bg-nonoss-soft text-nonoss'
                          }`}>
                            {u.account_status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {u.providers?.map(p => (
                              <span key={p} className="text-[9px] bg-bg-subtle px-1.5 py-0.5 rounded capitalize font-medium text-text-secondary border border-border">
                                {p}
                              </span>
                            ))}
                            {(!u.providers || u.providers.length === 0) && (
                              <span className="text-[9px] text-text-muted">Password</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleGenerateResetLink(u)}
                              className="p-1.5 rounded-lg bg-bg-subtle hover:bg-bg-hover text-accent font-bold text-[10px] flex items-center gap-1"
                              title="Generate One-Time Reset Link"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reset Link</span>
                            </button>

                            {isSuspended ? (
                              <button
                                onClick={() => handleUserStatusToggle(u, 'reactivate')}
                                disabled={isSelf}
                                className="p-1.5 rounded-lg text-oss hover:bg-oss-soft disabled:opacity-50"
                                title="Reactivate"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserStatusToggle(u, 'suspend')}
                                disabled={isSelf}
                                className="p-1.5 rounded-lg text-trending hover:bg-trending-soft disabled:opacity-50"
                                title="Suspend Account"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleUserStatusToggle(u, 'disable')}
                              disabled={isSelf}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 disabled:opacity-50"
                              title="Disable Account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className="p-1.5 rounded-lg text-nonoss hover:bg-nonoss-soft disabled:opacity-50"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: SECURITY AUDIT STREAM ─── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
              <div>
                <h3 className="font-bold text-text text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" /> Real-Time Security Audit Trail
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Chronological security events, role elevations, and ingestion triggers.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-bg-subtle border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
                >
                  <option value="">All Actions</option>
                  <option value="USER_LOGIN">USER_LOGIN</option>
                  <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
                  <option value="USER_SUSPENDED">USER_SUSPENDED</option>
                  <option value="REPO_SYNCED">REPO_SYNCED</option>
                  <option value="REPO_UPDATED">REPO_UPDATED</option>
                  <option value="REPO_DELETED">REPO_DELETED</option>
                </select>

                <button
                  onClick={handleExportAuditLogs}
                  className="px-3 py-1.5 rounded-xl bg-bg-subtle hover:bg-bg-hover text-text text-xs font-bold flex items-center gap-1.5 border border-border"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border font-semibold">
                    <th className="pb-2.5 pr-4">Timestamp</th>
                    <th className="pb-2.5 pr-4">Action</th>
                    <th className="pb-2.5 pr-4">Actor</th>
                    <th className="pb-2.5 pr-4">Target User</th>
                    <th className="pb-2.5 pr-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {auditLoading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted">Loading audit logs...</td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted">No audit events recorded.</td></tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-subtle/30 font-mono text-[11px]">
                        <td className="py-2.5 pr-4 text-text-muted">{new Date(log.created_date).toLocaleString()}</td>
                        <td className="py-2.5 pr-4">
                          <span className="font-bold text-accent bg-accent/10 px-2 py-0.5 rounded text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-text font-sans font-semibold">{log.actor_name || log.actor_id || 'System'}</td>
                        <td className="py-2.5 pr-4 text-text-secondary font-sans">{log.target_name || log.target_user_id || '—'}</td>
                        <td className="py-2.5 pr-4 text-text-muted">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER EDIT / SCORE BOOSTER DRAWER ─── */}
      <AnimatePresence>
        {editingRepo && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-bg-card border-l border-border p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                  <h3 className="font-bold text-text text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" /> Repository Studio
                  </h3>
                  <button onClick={() => setEditingRepo(null)} className="p-1 rounded-lg text-text-muted hover:text-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form id="edit-repo-form" onSubmit={handleSaveRepoEdit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-text mb-1 block">Display Name</label>
                    <input
                      type="text"
                      value={editingRepo.name || ''}
                      onChange={(e) => setEditingRepo({ ...editingRepo, name: e.target.value })}
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-text focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-text mb-1 block">Description</label>
                    <textarea
                      rows={3}
                      value={editingRepo.description || ''}
                      onChange={(e) => setEditingRepo({ ...editingRepo, description: e.target.value })}
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-text focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-text mb-1 block">Categories (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingRepo.categories) ? editingRepo.categories.join(', ') : (editingRepo.categories || '')}
                      onChange={(e) => setEditingRepo({ ...editingRepo, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-text focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-text mb-1 block">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingRepo.tags) ? editingRepo.tags.join(', ') : (editingRepo.tags || '')}
                      onChange={(e) => setEditingRepo({ ...editingRepo, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-text focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-text mb-1 block">Openlysts Score Booster (Editorial Points)</label>
                    <input
                      type="number"
                      min="-20"
                      max="30"
                      value={editingRepo.openlysts_score_boost || 0}
                      onChange={(e) => setEditingRepo({ ...editingRepo, openlysts_score_boost: e.target.value })}
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-text font-mono focus:border-accent outline-none"
                    />
                    <p className="text-[10px] text-text-muted mt-1">Add positive boost points (+5 to +20) for verified excellence.</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editingRepo.staff_pick}
                        onChange={(e) => setEditingRepo({ ...editingRepo, staff_pick: e.target.checked })}
                        className="rounded accent-accent"
                      />
                      <span className="font-bold text-text">Mark as Staff Pick</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editingRepo.featured}
                        onChange={(e) => setEditingRepo({ ...editingRepo, featured: e.target.checked })}
                        className="rounded accent-accent"
                      />
                      <span className="font-bold text-text">Feature on Home Feed</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editingRepo.hidden}
                        onChange={(e) => setEditingRepo({ ...editingRepo, hidden: e.target.checked })}
                        className="rounded accent-accent"
                      />
                      <span className="font-bold text-nonoss">Hide from Public Discovery</span>
                    </label>
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRepo(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text font-bold text-xs hover:bg-bg-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-repo-form"
                  className="flex-1 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-xs hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: ONE-TIME RESET LINK GENERATOR ─── */}
      <AnimatePresence>
        {generatedResetLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 max-w-lg w-full space-y-4 shadow-2xl border-accent/30"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-text text-sm sm:text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-accent" /> One-Time Password Reset Link
                </h3>
                <button onClick={() => setGeneratedResetLink(null)} className="text-text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-text-secondary">
                Generated password reset URL for <strong className="text-text">{generatedResetLink.user?.name}</strong> ({generatedResetLink.user?.email}). Token expires in 1 hour.
              </p>

              <div className="p-3 rounded-xl bg-bg-subtle border border-border flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedResetLink.resetUrl}
                  className="bg-transparent border-0 font-mono text-[11px] text-accent flex-1 outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedResetLink.resetUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-bold flex items-center gap-1 hover:opacity-90 flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setGeneratedResetLink(null)}
                  className="px-4 py-2 rounded-xl bg-bg-subtle text-text text-xs font-bold hover:bg-bg-hover"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
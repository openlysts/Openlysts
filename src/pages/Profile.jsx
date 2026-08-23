import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { localClient } from '@/api/localClient';
import { useToast } from '@/components/ui/use-toast';
import { getBookmarks, removeBookmark } from '@/lib/bookmarks';
import {
  User,
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Github,
  LogOut,
  Sparkles,
  Bookmark,
  Code2,
  Cpu,
  Layers,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Palette,
  Terminal,
  Check,
} from 'lucide-react';

// Neon & Cyberpunk Avatar Presets
const AVATAR_PRESETS = [
  { id: 'cyber-green', name: 'Matrix Hacker', bg: 'from-emerald-500 to-teal-700', icon: Terminal, color: '#10B981' },
  { id: 'quantum-blue', name: 'Quantum Dev', bg: 'from-blue-600 to-indigo-800', icon: Cpu, color: '#3B82F6' },
  { id: 'neon-purple', name: 'Cyberpunk Architect', bg: 'from-purple-600 to-fuchsia-800', icon: Sparkles, color: '#A855F7' },
  { id: 'sunset-amber', name: 'OSS Curator', bg: 'from-amber-500 to-rose-700', icon: Code2, color: '#F59E0B' },
  { id: 'monochrome', name: 'Stealth Engineer', bg: 'from-zinc-700 to-zinc-950', icon: Layers, color: '#71717A' },
];

// Tech Stacks for developer customization
const POPULAR_STACKS = [
  'AI & LLMs', 'React', 'TypeScript', 'Python', 'Rust', 'Go', 
  'Next.js', 'DevOps & Cloud', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'GraphQL'
];

export default function Profile() {
  const { user, logout, authChecked, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'preferences' | 'bookmarks'

  // Handle OAuth query notifications
  useEffect(() => {
    const notice = searchParams.get('notice');
    const provider = searchParams.get('provider') || 'OAuth';
    if (notice === 'oauth_not_configured') {
      toast({
        title: `${provider} OAuth Setup Required`,
        description: `Connecting ${provider} requires ${provider.toUpperCase()}_CLIENT_ID and SECRET in environment variables.`,
        variant: 'info',
      });
      searchParams.delete('notice');
      searchParams.delete('provider');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  // Profile Form States
  const [name, setName] = useState('');
  const [avatarPreset, setAvatarPreset] = useState('quantum-blue');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Preferences States
  const [selectedStacks, setSelectedStacks] = useState([]);
  const [landingView, setLandingView] = useState('discover');

  // Async States
  const [providers, setProviders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      navigate('/login?redirect=%2Fprofile');
    }
  }, [authChecked, isAuthenticated, navigate]);

  // Load User Data & Preferences
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      
      // Parse settings if available
      try {
        const settings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings || {};
        if (settings.avatarPreset) setAvatarPreset(settings.avatarPreset);
        if (settings.customAvatarUrl) setCustomAvatarUrl(settings.customAvatarUrl);
        if (Array.isArray(settings.preferredStacks)) setSelectedStacks(settings.preferredStacks);
        if (settings.landingView) setLandingView(settings.landingView);
      } catch (e) {
        // defaults
      }

      fetchProviders();
      fetchBookmarks();
    }
  }, [user]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/profile/providers', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (err) {
      console.error('Failed to fetch providers', err);
    }
  };

  const fetchBookmarks = async () => {
    setBookmarksLoading(true);
    try {
      const bIds = getBookmarks();
      if (!bIds || bIds.length === 0) {
        setBookmarks([]);
        setBookmarksLoading(false);
        return;
      }
      const repos = await localClient.entities.Repository.list('-stars', 3000);
      const repoMap = new Map(repos.map(r => [r.id, r]));
      const enriched = bIds
        .map(id => repoMap.get(id))
        .filter(Boolean);

      setBookmarks(enriched);
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Live Password Strength Calculation
  const passwordRules = useMemo(() => {
    return [
      { id: 'length', label: 'At least 8 characters', met: newPassword.length >= 8 },
      { id: 'upper', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
      { id: 'number', label: 'At least one number (0-9)', met: /[0-9]/.test(newPassword) },
      { id: 'special', label: 'At least one special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPassword) },
    ];
  }, [newPassword]);

  const passwordScore = useMemo(() => {
    if (!newPassword) return 0;
    const count = passwordRules.filter(r => r.met).length;
    return count;
  }, [passwordRules, newPassword]);

  const passwordStrengthConfig = useMemo(() => {
    if (passwordScore === 0) return { label: 'None', color: 'bg-zinc-700', text: 'text-text-muted', width: '0%' };
    if (passwordScore === 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: '25%' };
    if (passwordScore === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: '50%' };
    if (passwordScore === 3) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: '100%' };
  }, [passwordScore]);

  // Current active avatar preset
  const activePresetConfig = useMemo(() => {
    return AVATAR_PRESETS.find(p => p.id === avatarPreset) || AVATAR_PRESETS[1];
  }, [avatarPreset]);

  // Handlers
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);

    try {
      const newSettings = {
        avatarPreset,
        customAvatarUrl,
        preferredStacks: selectedStacks,
        landingView,
      };

      const res = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          settings: newSettings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      toast({
        title: 'Profile Updated',
        description: 'Your developer identity and settings have been saved.',
        variant: 'success',
      });

      if (refreshUser) refreshUser();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordScore < 4) {
      toast({
        title: 'Password Insecure',
        description: 'Please satisfy all 4 security checklist requirements before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');

      toast({
        title: 'Password Changed',
        description: 'Your security credentials were updated successfully.',
        variant: 'security',
      });

      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast({
        title: 'Password Change Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDisconnectProvider = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;

    try {
      const res = await fetch(`/api/profile/providers/${provider}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disconnect account');

      toast({
        title: 'Account Unlinked',
        description: `${provider} has been disconnected from your account.`,
        variant: 'delete',
      });

      fetchProviders();
    } catch (err) {
      toast({
        title: 'Unlink Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveBookmark = (repoId, repoName) => {
    removeBookmark(repoId);
    setBookmarks(prev => prev.filter(r => r.id !== repoId));
    toast({
      title: 'Bookmark Removed',
      description: `Removed ${repoName} from your saved repositories.`,
      variant: 'delete',
    });
  };

  const handleExportData = () => {
    const userData = {
      profile: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        account_status: user?.account_status,
        created_date: user?.created_date,
      },
      preferences: {
        avatarPreset,
        preferredStacks: selectedStacks,
        landingView,
      },
      connectedProviders: providers,
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        repo: b.full_name || b.name || b.repo?.full_name,
        url: b.html_url || b.repo?.html_url,
        stars: b.stars ?? b.repo?.stars ?? 0,
        saved_at: b.created_date || b.saved_at || b.github_updated_at,
      })),
      exportedAt: new Date().toISOString(),
      generator: 'Openlysts Developer Hub',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `openlysts_developer_vault_${Date.now()}.json`);
    dl.click();

    toast({
      title: 'Data Vault Exported',
      description: 'Your complete account and bookmarks archive has been downloaded.',
      variant: 'info',
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Logged Out',
      description: 'You have been safely signed out.',
      variant: 'default',
    });
    navigate('/discover');
  };

  const toggleStack = (stack) => {
    setSelectedStacks(prev => 
      prev.includes(stack) ? prev.filter(s => s !== stack) : [...prev, stack]
    );
  };

  const AvatarIcon = activePresetConfig.icon;

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      
      {/* ─── HUB HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight flex items-center gap-2">
              <Code2 className="w-7 h-7 text-accent" /> Developer Hub & Settings
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
              {user?.role || 'Developer'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            Fine-tune your Openlysts identity, security credentials, personalized discovery tags, and developer vault.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-nonoss-soft/60 hover:bg-nonoss-soft text-nonoss font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 border border-nonoss/20 touch-target"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* ─── MAIN BENTO GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── LEFT COLUMN: HERO IDENTITY & DATA VAULT (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Hero Identity Card */}
          <div className="card p-6 relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              {/* Dynamic 3D Avatar */}
              <div className="relative group">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${activePresetConfig.bg} p-0.5 shadow-xl flex items-center justify-center text-white cursor-pointer transition-transform group-hover:scale-105`}
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Click to change avatar style"
                >
                  <div className="w-full h-full rounded-[14px] bg-bg-card/40 backdrop-blur-sm flex items-center justify-center">
                    <AvatarIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute -bottom-1 -right-1 p-1 bg-bg-card border border-border rounded-lg text-accent hover:text-text shadow"
                  title="Customize Avatar"
                >
                  <Palette className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-text text-base sm:text-lg truncate">{name || 'OSS Developer'}</h3>
                <p className="text-xs text-text-muted font-mono truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-oss-soft text-oss">
                    {user?.account_status || 'ACTIVE'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Joined {user?.created_date ? new Date(user.created_date).toLocaleDateString() : '2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Preset Studio Drawer */}
            <AnimatePresence>
              {showAvatarPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-bg-subtle/80 border border-border/80 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-text">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> Select Avatar Archetype
                    </span>
                    <button onClick={() => setShowAvatarPicker(false)} className="text-text-muted hover:text-text">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_PRESETS.map((p) => {
                      const PIcon = p.icon;
                      const isSelected = avatarPreset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setAvatarPreset(p.id);
                            handleSaveProfile();
                          }}
                          className={`p-2 rounded-xl bg-gradient-to-tr ${p.bg} flex items-center justify-center text-white transition-all ${
                            isSelected ? 'ring-2 ring-accent scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={p.name}
                        >
                          <PIcon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Developer Vitals Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
              <div className="p-2.5 rounded-xl bg-bg-subtle/60 border border-border/40">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Bookmarks</span>
                <span className="text-base font-black text-accent font-mono">{bookmarks.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-bg-subtle/60 border border-border/40">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Stacks</span>
                <span className="text-base font-black text-oss font-mono">{selectedStacks.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-bg-subtle/60 border border-border/40">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Security</span>
                <span className="text-base font-black text-purple-400 font-mono">100%</span>
              </div>
            </div>
          </div>

          {/* Connected Social Accounts Card */}
          <div className="card p-5 space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" /> Connected Social Logins
            </h4>
            <p className="text-[11px] text-text-muted">
              Link OAuth providers for instant 1-click authentication into Openlysts.
            </p>

            <div className="space-y-2 pt-1">
              {/* GitHub Provider */}
              {(() => {
                const isGithubLinked = providers.some(p => p.provider === 'github');
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-subtle/70 border border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-text" />
                      <span className="font-bold text-text">GitHub</span>
                    </div>
                    {isGithubLinked ? (
                      <button
                        onClick={() => handleDisconnectProvider('github')}
                        className="text-[10px] text-nonoss hover:underline font-bold"
                      >
                        Unlink
                      </button>
                    ) : (
                      <a
                        href="/api/auth/oauth/github"
                        className="text-[10px] text-accent hover:underline font-bold flex items-center gap-1"
                      >
                        + Connect
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Google Provider */}
              {(() => {
                const isGoogleLinked = providers.some(p => p.provider === 'google');
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-subtle/70 border border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text">Google</span>
                    </div>
                    {isGoogleLinked ? (
                      <button
                        onClick={() => handleDisconnectProvider('google')}
                        className="text-[10px] text-nonoss hover:underline font-bold"
                      >
                        Unlink
                      </button>
                    ) : (
                      <a
                        href="/api/auth/oauth/google"
                        className="text-[10px] text-accent hover:underline font-bold flex items-center gap-1"
                      >
                        + Connect
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Data Vault & Privacy Card */}
          <div className="card p-5 space-y-3">
            <h4 className="font-bold text-text text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-accent" /> Data Vault & Export
            </h4>
            <p className="text-[11px] text-text-muted">
              Download your complete profile data, bookmarks, and developer preferences archive.
            </p>

            <button
              onClick={handleExportData}
              className="w-full py-2.5 rounded-xl bg-bg-subtle hover:bg-bg-hover text-text font-bold text-xs flex items-center justify-center gap-2 transition-all border border-border hover:border-accent touch-target"
            >
              <Download className="w-3.5 h-3.5 text-accent" /> Download My Data (JSON)
            </button>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: TABBED HUB (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Tab Navigation Rail */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-bg-subtle/60 border border-border/80 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all touch-target ${
                activeTab === 'security'
                  ? 'bg-accent text-accent-fg shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:text-text hover:bg-bg-card'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Identity & Security
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all touch-target ${
                activeTab === 'preferences'
                  ? 'bg-accent text-accent-fg shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:text-text hover:bg-bg-card'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Developer Stacks
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all touch-target ${
                activeTab === 'bookmarks'
                  ? 'bg-accent text-accent-fg shadow-lg shadow-accent/20'
                  : 'text-text-secondary hover:text-text hover:bg-bg-card'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" /> My Bookmarks ({bookmarks.length})
            </button>
          </div>

          {/* ─── TAB 1: IDENTITY & SECURITY ─── */}
          {activeTab === 'security' && (
            <div className="space-y-6">

              {/* Display Name & Email */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-text text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" /> Profile Identity
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted font-bold block mb-1">Email Address</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="flex-1 bg-bg-subtle/50 border border-border/80 rounded-xl px-3 py-2 text-xs font-mono text-text-muted opacity-75 cursor-not-allowed"
                      />
                      <span className="text-[10px] font-bold text-oss bg-oss-soft px-2 py-1.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text font-bold block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your developer handle..."
                      className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 touch-target disabled:opacity-50"
                  >
                    {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Identity
                  </button>
                </form>
              </div>

              {/* Change Password Studio with Live Strength Meter */}
              <div className="card p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div>
                    <h3 className="font-bold text-text text-sm flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-accent" /> Change Password
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Ensure your account is fortified with cryptographic entropy.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="text-xs text-text font-bold block mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 pr-10 text-xs text-text focus:outline-none focus:border-accent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs text-text font-bold block mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter robust new passphrase..."
                        className="w-full bg-bg-subtle border border-border rounded-xl px-3 py-2 pr-10 text-xs text-text focus:outline-none focus:border-accent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {newPassword.length > 0 && (
                      <div className="mt-3 space-y-2 p-3 rounded-xl bg-bg-subtle/70 border border-border/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-muted font-medium">Security Strength:</span>
                          <span className={`font-bold font-mono ${passwordStrengthConfig.text}`}>
                            {passwordStrengthConfig.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            className={`h-full ${passwordStrengthConfig.color} rounded-full`}
                            animate={{ width: passwordStrengthConfig.width }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>

                        {/* 4-Rule Interactive Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                          {passwordRules.map((rule) => (
                            <div key={rule.id} className="flex items-center gap-1.5 text-[11px]">
                              {rule.met ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                              )}
                              <span className={rule.met ? 'text-text font-medium' : 'text-text-muted'}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || passwordScore < 4}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 touch-target disabled:opacity-50"
                  >
                    {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Update Password
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ─── TAB 2: DEVELOPER STACKS & PERSONALIZATION ─── */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <div>
                  <h3 className="font-bold text-text text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-accent" /> Preferred Tech Stacks & Languages
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Select your primary development languages and tools to prioritize relevant repository discoveries.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {POPULAR_STACKS.map((stack) => {
                    const isSelected = selectedStacks.includes(stack);
                    return (
                      <button
                        key={stack}
                        onClick={() => toggleStack(stack)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-accent text-accent-fg shadow-md shadow-accent/20 scale-105'
                            : 'bg-bg-subtle text-text-secondary hover:text-text border border-border/80 hover:border-accent/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {stack}
                      </button>
                    );
                  })}
                </div>

                {/* Default Landing Page Selector */}
                <div className="pt-4 border-t border-border/50 space-y-2">
                  <label className="text-xs font-bold text-text block">Default Startup View</label>
                  <select
                    value={landingView}
                    onChange={(e) => setLandingView(e.target.value)}
                    className="w-full sm:w-64 bg-bg-subtle border border-border rounded-xl px-3 py-2 text-xs text-text font-bold focus:border-accent"
                  >
                    <option value="discover">Discover Catalog</option>
                    <option value="alternatives">SaaS Alternatives</option>
                    <option value="trending">Trending Velocity</option>
                    <option value="compare">Compare Matrix</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 touch-target disabled:opacity-50"
                >
                  {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Developer Preferences
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB 3: BOOKMARKS QUICK HUB ─── */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-text text-sm flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-accent" /> Saved Repositories ({bookmarks.length})
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">Quick access to projects you have starred or bookmarked.</p>
                  </div>
                  <Link
                    to="/bookmarks"
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    Open Full Library <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {bookmarksLoading ? (
                  <div className="py-12 text-center text-text-muted text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading bookmarks...
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="py-12 text-center text-text-muted text-xs">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
                    No bookmarked repositories yet. Discover great open-source tools!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bookmarks.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-bg-subtle/80 border border-border/70 hover:border-accent/40 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-text text-xs truncate">{r.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-accent flex items-center gap-1 flex-shrink-0">
                              <Star className="w-3 h-3 fill-accent text-accent" />
                              {(r.stars || 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted line-clamp-2 mt-1">
                            {r.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
                          <span className="font-bold text-text-secondary">
                            {r.language || 'Open Source'}
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={r.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-text-muted hover:text-text"
                              title="Open GitHub"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleRemoveBookmark(r.id, r.name)}
                              className="p-1 rounded text-nonoss hover:bg-nonoss-soft"
                              title="Remove Bookmark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

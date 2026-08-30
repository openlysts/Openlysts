import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Github, Eye, EyeOff, Save, Trash2,
  Check, BookmarkX, RotateCcw, SlidersHorizontal, KeyRound, Info,
  Shield, Smartphone, Fingerprint, Plus, X, Download, UserMinus
} from 'lucide-react';
import { getSettings, saveSettings, clearSettings } from '@/lib/settings';
import { updateConfig } from '@/lib/api';
import { clearBookmarks } from '@/lib/bookmarks';
import { useToast } from '@/components/ui/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
// Dynamic import used later for @simplewebauthn/browser

// Emil's recommended ease-out curve for UI
const EASE_OUT = [0.23, 1, 0.32, 1];

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getSettings());
  const [tokenInput, setTokenInput] = useState(settings.githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);
  
  const [mfaStatus, setMfaStatus] = useState({ totpEnabled: false, passkeys: [] });
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [totpSetup, setTotpSetup] = useState({ qr: null, secret: '', code: '' });
  const [mfaLoading, setMfaLoading] = useState(false);

  usePageTitle('Settings');

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const fetchMfaStatus = async () => {
    try {
      const res = await fetch('/api/mfa/status');
      if (res.ok) {
        const data = await res.json();
        setMfaStatus({ totpEnabled: data.totpEnabled, passkeys: data.passkeys || [] });
      }
    } catch (e) {
      console.error('Failed to fetch MFA status', e);
    }
  };

  const handleSaveToken = async () => {
    const updated = saveSettings({ githubToken: tokenInput.trim() });
    setSettings(updated);
    setSavedFlag(true);
    try {
      await updateConfig(tokenInput.trim());
      toast({ title: 'GitHub token saved', description: 'Stored locally and synced with backend.' });
    } catch (e) {
      toast({ title: 'GitHub token saved locally', description: 'Stored in your browser for client-side API requests.' });
    }
    setTimeout(() => setSavedFlag(false), 2000);
  };

  const handleClearToken = async () => {
    setTokenInput('');
    const updated = saveSettings({ githubToken: '' });
    setSettings(updated);
    try {
      await updateConfig('');
    } catch (e) { }
    toast({ title: 'GitHub token cleared' });
  };

  const handlePrefChange = (key, value) => {
    setSettings(saveSettings({ [key]: value }));
  };

  const handleClearBookmarks = () => {
    clearBookmarks();
    toast({ title: 'All bookmarks cleared' });
  };

  const handleResetSettings = async () => {
    clearSettings();
    setSettings(getSettings());
    setTokenInput('');
    try {
      await updateConfig('');
    } catch (e) { }
    toast({ title: 'Settings reset to defaults' });
  };

  const handleDownloadData = () => {
    window.location.href = '/api/data-rights/export';
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm("WARNING: This will permanently erase all your personal data, bookmarks, and linked accounts. This action is irreversible. Are you sure you want to withdraw consent and delete your account?")) return;
    if (!window.confirm("Are you absolutely sure? Your data cannot be recovered.")) return;
    
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/login';
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.message || 'Failed to delete account', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
    }
  };

  const handleSetupTotp = async () => {
    setMfaLoading(true);
    try {
      const res = await fetch('/api/mfa/totp/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTotpSetup({ qr: data.imageUrl, secret: data.secret, code: '' });
        setIsTotpModalOpen(true);
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to setup TOTP.', variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    try {
      const res = await fetch('/api/mfa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpSetup.code })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Two-factor authentication enabled.' });
        setIsTotpModalOpen(false);
        fetchMfaStatus();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Invalid code.', variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    setMfaLoading(true);
    try {
      const res = await fetch('/api/mfa/totp/disable', { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Success', description: 'Two-factor authentication disabled.' });
        fetchMfaStatus();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to disable TOTP.', variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setMfaLoading(true);
    try {
      const optRes = await fetch('/api/mfa/passkey/register/options', { method: 'POST' });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.message || 'Failed to get options');

      const { startRegistration } = await import('@simplewebauthn/browser');
      const attResp = await startRegistration({ optionsJSON: optData.options });

      const verifyRes = await fetch('/api/mfa/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attResp })
      });
      
      if (verifyRes.ok) {
        toast({ title: 'Success', description: 'Passkey added successfully.' });
        fetchMfaStatus();
      } else {
        const verifyData = await verifyRes.json();
        throw new Error(verifyData.message || 'Verification failed');
      }
    } catch (e) {
      toast({ title: 'Passkey Error', description: e.message, variant: 'destructive' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleRemovePasskey = async (id) => {
    if (!confirm('Are you sure you want to remove this passkey?')) return;
    try {
      const res = await fetch(`/api/mfa/passkey/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Success', description: 'Passkey removed.' });
        fetchMfaStatus();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to remove passkey.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20 shadow-sm">
          <SettingsIcon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text">Settings</h1>
          <p className="text-text-muted text-sm font-medium">Manage preferences and security.</p>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Security Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          className="bg-bg-card/90 backdrop-blur-xl p-6 rounded-3xl border border-border/80 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-lg text-text">Security</h2>
          </div>

          <div className="space-y-6">
            {/* Authenticator App */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-subtle border border-border/50">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 p-2 bg-bg-card rounded-lg shadow-sm border border-border/60">
                  <Smartphone className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-text text-sm">Authenticator App</h3>
                  <p className="text-xs text-text-muted max-w-xs mt-0.5 leading-relaxed">
                    Use an app like Authy or 1Password to generate 2FA codes.
                  </p>
                  {mfaStatus.totpEnabled && (
                    <span className="inline-flex mt-2 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-oss bg-oss-soft border border-oss/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Enabled
                    </span>
                  )}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={mfaStatus.totpEnabled ? handleDisableTotp : handleSetupTotp}
                disabled={mfaLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  mfaStatus.totpEnabled
                    ? 'bg-bg-card hover:bg-nonoss-soft hover:text-nonoss border border-border/80 hover:border-nonoss/30 text-text'
                    : 'bg-accent hover:bg-accent/90 text-accent-fg'
                }`}
              >
                {mfaStatus.totpEnabled ? 'Disable' : 'Set up'}
              </motion.button>
            </div>

            {/* Passkeys */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-2xl bg-bg-subtle border border-border/50">
              <div className="flex gap-3 items-start flex-1">
                <div className="mt-0.5 p-2 bg-bg-card rounded-lg shadow-sm border border-border/60">
                  <Fingerprint className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-text text-sm flex justify-between items-center w-full">
                    Passkeys
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddPasskey}
                      disabled={mfaLoading}
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-card hover:bg-bg border border-border/80 text-[11px] font-bold transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Add Passkey
                    </motion.button>
                  </h3>
                  <p className="text-xs text-text-muted max-w-xs mt-0.5 leading-relaxed">
                    Sign in securely with your device's biometrics (Touch ID, Face ID).
                  </p>
                  
                  {mfaStatus.passkeys.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {mfaStatus.passkeys.map(pk => (
                        <div key={pk.credential_id} className="flex items-center justify-between p-2.5 rounded-xl bg-bg-card border border-border/40 text-xs">
                          <div className="font-medium text-text truncate max-w-[150px] sm:max-w-[200px]">
                            {pk.device_type === 'single_device' ? 'Security Key' : 'Passkey Device'}
                          </div>
                          <button
                            onClick={() => handleRemovePasskey(pk.credential_id)}
                            className="p-1.5 text-text-muted hover:text-nonoss hover:bg-nonoss-soft rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-xs font-medium text-text-muted/60 bg-bg-card/50 p-2 rounded-xl text-center border border-border/30 border-dashed">
                      No passkeys registered.
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddPasskey}
                    disabled={mfaLoading}
                    className="sm:hidden mt-4 w-full flex justify-center items-center gap-1 px-3 py-2 rounded-xl bg-bg-card hover:bg-bg border border-border/80 text-[11px] font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Add Passkey
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* API Keys */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
          className="bg-bg-card/90 backdrop-blur-xl p-6 rounded-3xl border border-border/80 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-lg text-text">API Tokens</h2>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-4 h-4 text-text-secondary" />
              <label className="text-sm font-bold text-text">GitHub Access Token</label>
              {settings.githubToken ? (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-oss bg-oss-soft px-2 py-0.5 rounded-full border border-oss/20">
                  <Check className="w-3 h-3" /> Set
                </span>
              ) : (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-text-muted bg-bg-subtle px-2 py-0.5 rounded-full border border-border/50">Not set</span>
              )}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSaveToken(); }}>
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full pr-10 px-4 py-2.5 rounded-xl border border-border bg-bg/60 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:brightness-110 shadow-lg shadow-accent/20 flex items-center gap-1.5 transition-all"
              >
                {savedFlag ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {savedFlag ? 'Saved' : 'Save'}
              </motion.button>
            </form>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-text-muted/80 font-medium">
                Create a free token at{' '}
                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">
                  GitHub Settings
                </a>
                . No scopes needed. Raises your rate limit for ingestion.
              </p>
              {settings.githubToken && (
                <button onClick={handleClearToken} className="text-[11px] font-bold text-nonoss hover:bg-nonoss-soft hover:px-2 py-1 rounded transition-all ml-2 flex-shrink-0">
                  Clear Token
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* Display Preferences */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: EASE_OUT }}
          className="bg-bg-card/90 backdrop-blur-xl p-6 rounded-3xl border border-border/80 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-lg text-text">Display Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-subtle transition-colors group">
              <div>
                <p className="text-sm font-bold text-text">Results per page</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">Repositories shown in search.</p>
              </div>
              <select
                value={settings.resultsPerPage || 12}
                onChange={(e) => handlePrefChange('resultsPerPage', parseInt(e.target.value))}
                className="px-3 py-2 rounded-xl border border-border/80 bg-bg text-xs font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-sm cursor-pointer"
              >
                <option value={12}>12 Items</option>
                <option value={24}>24 Items</option>
                <option value={48}>48 Items</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-subtle transition-colors group">
              <div>
                <p className="text-sm font-bold text-text">Default sort</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">How repos are sorted initially.</p>
              </div>
              <select
                value={settings.defaultSort || 'trending'}
                onChange={(e) => handlePrefChange('defaultSort', e.target.value)}
                className="px-3 py-2 rounded-xl border border-border/80 bg-bg text-xs font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-sm cursor-pointer"
              >
                <option value="trending">🔥 Trending</option>
                <option value="stars">⭐ Most Stars</option>
                <option value="updated">🔄 Recently Updated</option>
                <option value="recent">✨ Newest Additions</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-subtle transition-colors group">
              <div>
                <p className="text-sm font-bold text-text">3D Background Animation</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">Visual style of background elements.</p>
              </div>
              <select
                value={settings.backgroundType || 'particles'}
                onChange={(e) => handlePrefChange('backgroundType', e.target.value)}
                className="px-3 py-2 rounded-xl border border-border/80 bg-bg text-xs font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-sm cursor-pointer max-w-[140px] truncate"
              >
                <option value="particles">Particles</option>
                <option value="network">Network Mesh</option>
                <option value="topography">Topography</option>
                <option value="matrix">Matrix Rain</option>
                <option value="galaxy">Galaxy Spiral</option>
                <option value="none">Disabled</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-subtle transition-colors group">
              <div>
                <p className="text-sm font-bold text-text">Auto-expand videos</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">Fetch video explanations automatically.</p>
              </div>
              <button
                onClick={() => handlePrefChange('autoExpandVideos', !settings.autoExpandVideos)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 shadow-inner border border-black/10 dark:border-white/10 ${settings.autoExpandVideos ? 'bg-accent' : 'bg-bg-card'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.autoExpandVideos ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: EASE_OUT }}
          className="bg-nonoss-soft/20 p-6 rounded-3xl border border-nonoss/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-nonoss" />
            <h2 className="font-bold text-lg text-nonoss">Data Management</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDownloadData}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-bg-card hover:bg-bg-subtle hover:border-border text-xs font-bold text-text transition-all shadow-sm"
              >
                <Download className="w-4 h-4 text-accent" />
                Download My Data
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleWithdrawConsent}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-bg-card hover:bg-nonoss-soft hover:border-nonoss/30 hover:text-nonoss text-xs font-bold text-text-secondary transition-all shadow-sm"
              >
                <UserMinus className="w-4 h-4 text-nonoss" />
                Withdraw Consent & Delete
              </motion.button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleClearBookmarks}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-bg-card hover:bg-nonoss-soft hover:border-nonoss/30 hover:text-nonoss text-xs font-bold text-text-secondary transition-all shadow-sm"
              >
                <BookmarkX className="w-4 h-4" />
                Clear Bookmarks
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleResetSettings}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-bg-card hover:bg-nonoss-soft hover:border-nonoss/30 hover:text-nonoss text-xs font-bold text-text-secondary transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Settings
              </motion.button>
            </div>
          </div>
        </motion.section>
      </div>

      {/* TOTP Setup Modal */}
      <AnimatePresence>
        {isTotpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsTotpModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="relative w-full max-w-sm bg-bg border border-border/80 shadow-2xl rounded-3xl p-6 overflow-hidden"
            >
              <button 
                onClick={() => setIsTotpModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-bg-subtle text-text-muted hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h2 className="text-xl font-black text-text mb-1">Set up 2FA</h2>
              <p className="text-xs text-text-muted mb-6">Scan the QR code with your authenticator app.</p>
              
              {totpSetup.qr ? (
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-inner">
                    <img src={totpSetup.qr} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-bg-subtle animate-pulse rounded-2xl mx-auto mb-6" />
              )}
              
              <div className="text-center mb-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Or enter manual key</p>
                <code className="text-xs font-mono bg-bg-subtle px-2 py-1 rounded text-text">{totpSetup.secret}</code>
              </div>

              <form onSubmit={handleVerifyTotp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    required
                    value={totpSetup.code}
                    onChange={(e) => setTotpSetup(s => ({ ...s, code: e.target.value.replace(/[^0-9]/g, '') }))}
                    maxLength={6}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] font-mono text-lg px-4 py-3 rounded-xl border border-border bg-bg-card focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={mfaLoading || totpSetup.code.length !== 6}
                  className="w-full py-3 rounded-xl bg-accent text-accent-fg font-bold text-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
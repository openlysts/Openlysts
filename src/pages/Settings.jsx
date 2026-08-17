import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Github, Eye, EyeOff, Save, Trash2,
  Check, BookmarkX, RotateCcw, SlidersHorizontal, KeyRound, Info,
} from 'lucide-react';
import { getSettings, saveSettings, clearSettings } from '@/lib/settings';
import { getBookmarks, clearBookmarks } from '@/lib/bookmarks';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getSettings());
  const [tokenInput, setTokenInput] = useState(settings.githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => { document.title = 'Settings — Openlysts'; }, []);

  const handleSaveToken = () => {
    const updated = saveSettings({ githubToken: tokenInput.trim() });
    setSettings(updated);
    setSavedFlag(true);
    toast({ title: 'GitHub token saved', description: 'Stored locally in your browser.' });
    setTimeout(() => setSavedFlag(false), 2000);
  };

  const handleClearToken = () => {
    setTokenInput('');
    const updated = saveSettings({ githubToken: '' });
    setSettings(updated);
    toast({ title: 'GitHub token cleared' });
  };

  const handlePrefChange = (key, value) => {
    setSettings(saveSettings({ [key]: value }));
  };

  const handleClearBookmarks = () => {
    clearBookmarks();
    toast({ title: 'All bookmarks cleared' });
  };

  const handleResetSettings = () => {
    clearSettings();
    setSettings(getSettings());
    setTokenInput('');
    toast({ title: 'Settings reset to defaults' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p className="text-text-muted text-sm">Manage API keys, tokens, and preferences.</p>
        </div>
      </div>

      {/* API Keys & Tokens */}
      <section className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-text-secondary" />
          <h2 className="font-semibold text-text">API Keys & Tokens</h2>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Github className="w-4 h-4 text-text-secondary" />
            <label className="text-sm font-medium text-text">GitHub Personal Access Token</label>
            {settings.githubToken ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Set
              </span>
            ) : (
              <span className="ml-auto text-[11px] font-medium text-text-muted bg-bg-subtle px-2 py-0.5 rounded-full">Not set</span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full pr-10 px-3 py-2 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveToken}
              className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
            >
              {savedFlag ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedFlag ? 'Saved' : 'Save'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-text-muted">
              Create a free token at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                github.com/settings/tokens
              </a>
              . No scopes needed — it only raises your rate limit for the ingestion pipeline.
            </p>
            {settings.githubToken && (
              <button onClick={handleClearToken} className="text-xs text-nonoss hover:underline flex-shrink-0 ml-2">
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-1.5">Stored locally in your browser. Used when an admin runs ingestion.</p>
        </div>
      </section>

      {/* Display Preferences */}
      <section className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
          <h2 className="font-semibold text-text">Display Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Results per page</p>
              <p className="text-xs text-text-muted">Number of repositories shown per page in search results.</p>
            </div>
            <select
              value={settings.resultsPerPage}
              onChange={(e) => handlePrefChange('resultsPerPage', parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-border bg-bg-card text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Default sort</p>
              <p className="text-xs text-text-muted">How repositories are sorted by default on the home page.</p>
            </div>
            <select
              value={settings.defaultSort}
              onChange={(e) => handlePrefChange('defaultSort', e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-bg-card text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="trending">Trending</option>
              <option value="stars">Most stars</option>
              <option value="updated">Recently updated</option>
              <option value="recent">Recently added</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Auto-expand video links</p>
              <p className="text-xs text-text-muted">Automatically fetch video explanations on repository cards (slower).</p>
            </div>
            <button
              onClick={() => handlePrefChange('autoExpandVideos', !settings.autoExpandVideos)}
              className={`relative w-10 h-5 rounded-full transition-colors ${settings.autoExpandVideos ? 'bg-accent' : 'bg-border-strong'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoExpandVideos ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">3D Background Style</p>
              <p className="text-xs text-text-muted">Choose your preferred background animation.</p>
            </div>
            <select
              value={settings.backgroundType}
              onChange={(e) => handlePrefChange('backgroundType', e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-bg-card text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="particles">1. Particles</option>
              <option value="network">2. Network Mesh</option>
              <option value="topography">3. Digital Topography</option>
              <option value="matrix">4. Matrix Rain</option>
              <option value="galaxy">5. Galaxy Spiral</option>
              <option value="cubes">6. Floating Cubes</option>
              <option value="rings">7. Concentric Rings</option>
              <option value="waves">8. Particle Waves</option>
              <option value="dna">9. DNA Helix</option>
              <option value="vortex">10. Vortex Tunnel</option>
              <option value="none">None (Disabled)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-text-secondary" />
          <h2 className="font-semibold text-text">Data Management</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleClearBookmarks}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-subtle hover:bg-bg-hover text-sm font-medium text-text-secondary text-left"
          >
            <BookmarkX className="w-4 h-4" />
            Clear all bookmarks
          </button>
          <button
            onClick={handleResetSettings}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-subtle hover:bg-bg-hover text-sm font-medium text-text-secondary text-left"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all settings to defaults
          </button>
        </div>
      </section>

      {/* About */}
      <section className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-text-secondary" />
          <h2 className="font-semibold text-text">About</h2>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Openlysts is an open-source discovery engine for GitHub repositories. All settings are stored locally in your browser — no data is sent to any server except when you explicitly trigger an action (like running ingestion).
        </p>
      </section>
    </div>
  );
}
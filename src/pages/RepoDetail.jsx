import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, GitFork, AlertCircle, Calendar, Clock, ExternalLink, ArrowLeft, Bookmark, Flame, TrendingUp, Activity, ShieldCheck, HelpCircle, XCircle, CopyPlus, Sparkles } from 'lucide-react';
import { getLanguageColor } from '@/lib/languageColors';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { getRepoReadme, getSimilarRepos, getRepoHistory } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import LicenseBadge from '@/components/openlyst/LicenseBadge';
import RepoVideoLinks from '@/components/openlyst/RepoVideoLinks';
import RepositoryCard from '@/components/openlyst/RepositoryCard';

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function RepoDetail() {
  const { owner, name } = useParams();
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);

  const { data: repo, isLoading } = useQuery({
    queryKey: ['repo', owner, name],
    queryFn: async () => {
      const results = await localClient.entities.Repository.filter({ full_name: `${owner}/${name}` }, '-stars', 5);
      return results[0] || null;
    },
    onSuccess: (data) => {
      if (data) setBookmarked(isBookmarked(data.id));
    },
  });

  const { data: readme, isLoading: isReadmeLoading } = useQuery({
    queryKey: ['readme', owner, name],
    queryFn: async () => {
      try {
        const data = await getRepoReadme(`${owner}/${name}`, repo?.default_branch);
        return data.readme || '';
      } catch (err) {
        return '';
      }
    },
    enabled: !!repo
  });

  const { data: similarRepos } = useQuery({
    queryKey: ['similarRepos', owner, name],
    queryFn: async () => {
      const data = await getSimilarRepos(`${owner}/${name}`);
      return data.similarRepos || [];
    },
    enabled: !!repo
  });

  const { data: historyData } = useQuery({
    queryKey: ['repoHistory', repo?.id],
    queryFn: async () => {
      const data = await getRepoHistory(repo.id);
      return (data.history || []).map(h => ({
        date: new Date(h.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stars: h.stars
      }));
    },
    enabled: !!repo?.id
  });

  useEffect(() => {
    if (repo) {
      document.title = `Openlysts — ${repo.name} | Open-Source Discovery`;
    }
  }, [repo]);

  const handleBookmark = () => {
    if (!repo) return;
    setBookmarked(toggleBookmark(repo.id));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="card p-6 h-96 animate-pulse">
          <div className="h-6 bg-bg-subtle rounded w-1/3 mb-4" />
          <div className="h-4 bg-bg-subtle rounded w-2/3 mb-8" />
          <div className="h-3 bg-bg-subtle rounded w-full mb-2" />
          <div className="h-3 bg-bg-subtle rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <h1 className="text-xl font-bold text-text mb-1">Repository not found</h1>
        <p className="text-text-muted text-sm mb-4">This repository may have been removed or not yet ingested.</p>
        <Link to="/" className="inline-flex items-center gap-1.5 text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  const langColor = getLanguageColor(repo.language);
  const isTrending = (repo.trending_score || 0) > 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Column (Left) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-text tracking-tight">{repo.name}</h1>
                  <p className="text-text-muted text-base mt-1">{repo.owner}</p>
                </div>
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    bookmarked ? 'bg-accent-soft text-accent border-accent' : 'bg-bg-card text-text-secondary border-border hover:bg-bg-hover'
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
                  {bookmarked ? 'Saved' : 'Save'}
                </button>
              </div>

              <p className="text-text-secondary text-base leading-relaxed mb-5">{repo.description || 'No description available.'}</p>

              {repo.archived && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-nonoss-soft text-nonoss text-sm font-medium mb-5">
                  <AlertCircle className="w-4 h-4" />
                  This repository is archived and no longer maintained.
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {(repo.categories || []).map((cat) => (
                  <Link key={cat} to={`/category/${cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}>
                    <span className="px-2.5 py-1.5 rounded-lg text-[13px] font-medium bg-accent-soft text-accent hover:opacity-80 cursor-pointer">
                      {cat}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {(repo.topics || []).map((t) => (
                  <span key={t} className="px-2 py-1 rounded-md text-[11px] bg-bg-subtle text-text-muted font-mono tracking-wide">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/compare?repos=${repo.full_name}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-bg-hover transition-colors shadow-sm">
                  <CopyPlus className="w-4 h-4" /> Compare
                </Link>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-fg font-bold text-sm hover:opacity-90 transition-opacity shadow-md">
                  <ExternalLink className="w-4 h-4" />
                  Open on GitHub
                </a>
                {repo.homepage_url && (
                  <a href={repo.homepage_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-bg-hover transition-colors shadow-sm">
                    <ExternalLink className="w-4 h-4" />
                    Homepage
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Videos Section */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="card p-6">
              <h2 className="text-xl font-bold text-text mb-5">Tutorials & Explanations</h2>
              <RepoVideoLinks repo={repo} />
            </div>
          </motion.div>

          {/* README Section */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-bold text-text mb-6">README</h2>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words text-text-secondary overflow-hidden">
                {isReadmeLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-bg-subtle rounded w-3/4"></div>
                    <div className="h-5 bg-bg-subtle rounded w-full"></div>
                    <div className="h-5 bg-bg-subtle rounded w-5/6"></div>
                    <div className="h-5 bg-bg-subtle rounded w-1/2 mt-4"></div>
                  </div>
                ) : readme ? (
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{readme}</ReactMarkdown>
                ) : (
                  <p className="text-text-muted italic">No README found for this repository.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Column (Right) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6 mt-6 lg:mt-0 lg:sticky lg:top-24">
          
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {/* Stats grid (2x2) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card p-4 hover:border-border transition-colors">
                <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5 font-medium uppercase tracking-wider"><Star className="w-3.5 h-3.5 text-yellow-500" /> Stars</div>
                <p className="text-2xl font-bold text-text">{formatNum(repo.stars)}</p>
              </div>
              <div className="card p-4 hover:border-border transition-colors">
                <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5 font-medium uppercase tracking-wider"><GitFork className="w-3.5 h-3.5 text-blue-500" /> Forks</div>
                <p className="text-2xl font-bold text-text">{formatNum(repo.forks)}</p>
              </div>
              <div className="card p-4 hover:border-border transition-colors">
                <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5 font-medium uppercase tracking-wider"><AlertCircle className="w-3.5 h-3.5 text-green-500" /> Issues</div>
                <p className="text-2xl font-bold text-text">{formatNum(repo.open_issues)}</p>
              </div>
              <div className="card p-4 hover:border-border transition-colors">
                <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5 font-medium uppercase tracking-wider"><Activity className="w-3.5 h-3.5 text-accent" /> Quality</div>
                <p className="text-2xl font-bold text-text">{repo.quality_score?.toFixed(1) || '—'}</p>
              </div>
            </div>

            {/* Details */}
            <div className="card p-5 space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-text-secondary text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> License</span>
                <LicenseBadge repo={repo} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-text-secondary text-sm flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: langColor }} /> Language
                </span>
                <span className="text-text text-sm font-semibold">{repo.language || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-text-secondary text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Created</span>
                <span className="text-text text-sm font-medium">{formatDate(repo.github_created_at)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-text-secondary text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Updated</span>
                <span className="text-text text-sm font-medium">{timeAgo(repo.github_updated_at)}</span>
              </div>
              {isTrending && (
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-text-secondary text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-trending" /> Stars (7d)</span>
                  <span className="text-trending text-sm font-bold">+{formatNum(repo.stars_gained_7d)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Trending Score</span>
                <span className="text-text text-sm font-bold">{repo.trending_score?.toFixed(1) || '0'}</span>
              </div>
            </div>

            {/* Chart Section */}
            {historyData && historyData.length > 0 && (
              <div className="card p-5 h-64 mb-6">
                <h2 className="text-sm font-bold text-text mb-4 uppercase tracking-wider text-text-muted">Star Growth (30d)</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="stars" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 6, fill: 'hsl(var(--accent))', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Similar Repositories Section */}
            {similarRepos && similarRepos.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-text mb-4 px-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  You might also like
                </h2>
                <div className="flex flex-col gap-4">
                  {similarRepos.slice(0, 3).map((r, i) => (
                    <RepositoryCard key={r.id} repo={r} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
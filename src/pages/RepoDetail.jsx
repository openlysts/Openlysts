import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, GitFork, AlertCircle, Calendar, Clock, ExternalLink, ArrowLeft, Bookmark, Flame, TrendingUp, Activity, ShieldCheck, HelpCircle, XCircle, CopyPlus } from 'lucide-react';
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
      document.title = `Openlyst — ${repo.name} | Open-Source Discovery`;
    }
  }, [repo]);

  const handleBookmark = () => {
    if (!repo) return;
    setBookmarked(toggleBookmark(repo.id));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="card p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl font-bold text-text">{repo.name}</h1>
              <p className="text-text-muted text-sm mt-0.5">{repo.owner}</p>
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

          <p className="text-text-secondary leading-relaxed mb-4">{repo.description || 'No description available.'}</p>

          {repo.archived && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nonoss-soft text-nonoss text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              This repository is archived and no longer maintained.
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {(repo.categories || []).map((cat) => (
              <Link key={cat} to={`/category/${cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-soft text-accent hover:opacity-80 cursor-pointer">
                  {cat}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {(repo.topics || []).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded text-[11px] bg-bg-subtle text-text-muted font-mono">
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/compare?repos=${repo.full_name}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-bg-hover transition-colors">
              <CopyPlus className="w-4 h-4" /> Compare
            </Link>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-medium text-sm hover:opacity-90 transition-opacity">
              <ExternalLink className="w-4 h-4" />
              Open on GitHub
            </a>
            {repo.homepage_url && (
              <a href={repo.homepage_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-bg-hover transition-colors">
                <ExternalLink className="w-4 h-4" />
                Homepage
              </a>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="card p-4">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><Star className="w-3.5 h-3.5" /> Stars</div>
            <p className="text-xl font-bold text-text">{formatNum(repo.stars)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><GitFork className="w-3.5 h-3.5" /> Forks</div>
            <p className="text-xl font-bold text-text">{formatNum(repo.forks)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><AlertCircle className="w-3.5 h-3.5" /> Issues</div>
            <p className="text-xl font-bold text-text">{formatNum(repo.open_issues)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5"><Activity className="w-3.5 h-3.5" /> Quality</div>
            <p className="text-xl font-bold text-text">{repo.quality_score?.toFixed(1) || '—'}</p>
          </div>
        </div>

        {/* Details */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-text-muted text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> License</span>
            <LicenseBadge repo={repo} />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-text-muted text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: langColor }} /> Language
            </span>
            <span className="text-text text-sm font-medium">{repo.language || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-text-muted text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Created</span>
            <span className="text-text text-sm">{formatDate(repo.github_created_at)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-text-muted text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Last Updated</span>
            <span className="text-text text-sm">{timeAgo(repo.github_updated_at)}</span>
          </div>
          {isTrending && (
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-muted text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-trending" /> Stars This Week</span>
              <span className="text-trending text-sm font-medium">+{formatNum(repo.stars_gained_7d)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-text-muted text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Trending Score</span>
            <span className="text-text text-sm font-medium">{repo.trending_score?.toFixed(1) || '0'}</span>
          </div>
        </div>

        {/* Chart Section */}
        {historyData && historyData.length > 0 && (
          <div className="card p-6 mt-5 h-64">
            <h2 className="text-sm font-bold text-text mb-4">Star Growth (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Line type="monotone" dataKey="stars" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Videos Section */}
      {repo && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="mt-5 card p-6">
            <h2 className="text-lg font-bold text-text mb-4">Tutorials & Explanations</h2>
            <RepoVideoLinks repo={repo} />
          </div>
        </motion.div>
      )}

      {/* README Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <div className="mt-5 card p-6">
          <h2 className="text-lg font-bold text-text mb-4">README</h2>
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words text-text-secondary overflow-hidden">
            {isReadmeLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-bg-subtle rounded w-3/4"></div>
                <div className="h-4 bg-bg-subtle rounded w-full"></div>
                <div className="h-4 bg-bg-subtle rounded w-5/6"></div>
              </div>
            ) : readme ? (
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{readme}</ReactMarkdown>
            ) : (
              <p className="text-text-muted italic text-sm">No README found for this repository.</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Similar Repositories Section */}
      {similarRepos && similarRepos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <div className="mt-8 mb-4">
            <h2 className="text-xl font-bold text-text mb-4 px-1">You might also like...</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarRepos.map((r, i) => (
                <RepositoryCard key={r.id} repo={r} index={i} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
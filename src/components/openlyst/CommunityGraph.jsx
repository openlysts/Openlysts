import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck, ThumbsUp, ThumbsDown, Network, Sparkles, GitCompareArrows, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * CommunityGraph — surfaces the Alternatives Knowledge Graph on a repo page.
 * Fetches /api/altgraph/for-repo and renders:
 *   • verified edges  — "community-verified alternative to X" (evidence-backed)
 *   • pending edges   — community suggestions that need votes to auto-promote
 * Vote buttons are wired to /api/altgraph/vote (per-IP capped server-side), so
 * real user votes can promote a pending edge to verified with zero human review.
 * The inline suggest form posts /api/altgraph/suggest with THIS repo as the
 * subject, so any visitor can seed a new edge that enters the vote loop.
 */

async function fetchRepoGraph(fullName, name) {
  const res = await fetch('/api/altgraph/for-repo', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName || '', name: name || '' }),
  });
  if (!res.ok) throw new Error(`Graph fetch failed (${res.status})`);
  return res.json();
}

function EdgeRow({ edge, side, onVoted }) {
  const isVerified = edge.status === 'verified';
  // side: 'incoming' → this repo is the candidate (edge.subject names the target)
  // side: 'outgoing' → edge.candidate_name names an alternative to this repo
  const target = side === 'incoming' ? (edge.subject || 'unknown') : (edge.candidate_name || edge.candidate_full_name || 'Unknown');
  const myVote = Number(edge.my_vote) || 0;
  const suggester = edge.suggested_by_name
    ? `Suggested by ${edge.suggested_by_name}`
    : 'Suggested by the community';

  const upActive = myVote === 1;
  const downActive = myVote === -1;

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text flex items-center gap-1.5 flex-wrap">
          {isVerified
            ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            : <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />}
          <span className="font-medium">
            {side === 'incoming'
              ? (isVerified ? 'Verified alternative to ' : 'Suggested alternative to ')
              : (isVerified ? 'Verified alternative: ' : 'Suggested alternative: ')}
            <span className="text-text-secondary">{target}</span>
          </span>
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">
          {isVerified
            ? `Verified · ↑${edge.votes_up ?? 0} · ${edge.source || 'community'}`
            : `Pending verification · needs community votes · ↑${edge.votes_up ?? 0} · ${suggester}`}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          aria-label={`Upvote: ${target}`}
          aria-pressed={upActive}
          onClick={() => onVoted(edge, 1)}
          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            upActive
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/60'
              : 'border-border/60 text-text-muted hover:text-emerald-600 hover:border-emerald-500/50'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Downvote: ${target}`}
          aria-pressed={downActive}
          onClick={() => onVoted(edge, -1)}
          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            downActive
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/60'
              : 'border-border/60 text-text-muted hover:text-rose-600 hover:border-rose-500/50'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function SuggestForm({ repoFullName, repoName, onSuggested }) {
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState('');
  const [relation, setRelation] = useState('alternative');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = candidate.trim();
    if (trimmed.length < 2 || saving) return;
    setSaving(true);
    try {
      const subject = repoFullName || repoName || '';
      const githubish = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed);
      const res = await fetch('/api/altgraph/suggest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          candidate_name: githubish ? trimmed.split('/').pop() : trimmed,
          candidate_full_name: githubish ? trimmed : '',
          candidate_url: !githubish ? trimmed : '',
          relation,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || `Suggest failed (${res.status})`);
      toast({ title: 'Suggestion added', description: 'It will show once the community votes reach quorum.' });
      setCandidate('');
      setOpen(false);
      onSuggested?.();
    } catch (err) {
      console.error('[CommunityGraph] suggest error:', err.message);
      toast({ title: 'Suggestion not saved', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-text-secondary text-sm font-medium hover:text-accent hover:border-accent/50 transition-colors"
      >
        <Plus className="w-4 h-4" /> Suggest an alternative to this project
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 p-3 rounded-xl bg-bg-subtle/50 border border-border/70 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text uppercase tracking-wider">Suggest an alternative</p>
        <button type="button" aria-label="Close suggestion form" onClick={() => setOpen(false)} className="p-1 rounded-md text-text-muted hover:text-text hover:bg-bg-hover">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={candidate}
        onChange={(e) => setCandidate(e.target.value)}
        placeholder="Tool name or owner/repo (e.g. matrix-org/synapse)"
        aria-label="Alternative tool name or repository"
        className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/50"
      />
      <div className="flex items-center gap-2">
        <label htmlFor="cg-relation" className="text-xs text-text-muted font-medium">Relationship</label>
        <select
          id="cg-relation"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-bg-card border border-border text-xs text-text focus:outline-none"
        >
          <option value="alternative">Alternative</option>
          <option value="successor">Successor / replacement</option>
          <option value="migrate_to">Migrate-to</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving || candidate.trim().length < 2}
        className="w-full py-2 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add suggestion'}
      </button>
      <p className="text-[11px] text-text-muted">
        Edges become verified after 3+ distinct community votes — no humans in the loop.
      </p>
    </form>
  );
}

export default function CommunityGraph({ repo }) {
  const queryClient = useQueryClient();
  const [voteState, setVoteState] = useState(null);

  const fullName = repo?.full_name || '';
  const name = repo?.name || '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['repo-graph', fullName, name],
    queryFn: () => fetchRepoGraph(fullName, name),
    enabled: !!fullName || !!name,
    staleTime: 5 * 60 * 1000,
  });

  const verified = [
    ...(data?.incoming || []),
    ...(data?.outgoing || []),
  ].filter(e => e.status === 'verified');
  const pending = [
    ...(data?.incomingPending || []),
    ...(data?.outgoingPending || []),
  ].filter(e => e.status === 'pending');

  const handleVote = async (edge, dir) => {
    if (voteState) return; // one in-flight vote at a time
    setVoteState({ id: edge.id });
    try {
      const res = await fetch('/api/altgraph/vote', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: edge.id, dir }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `Vote failed (${res.status})`);
      }
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['repo-graph'] });
    } catch (e) {
      console.error('[CommunityGraph] vote error:', e.message);
      toast({ title: 'Vote not recorded', description: e.message, variant: 'destructive' });
    } finally {
      setVoteState(null);
    }
  };

  const handleSuggested = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['repo-graph'] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Network className="w-4 h-4 text-accent" />
            Community Graph
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <GitCompareArrows className="w-3 h-3" />
            {verified.length} verified
          </span>
        </div>
        <p className="text-xs text-text-muted mb-2">
          {'Votes from the community power this map — suggestions auto-promote to verified at community quorum.'}
        </p>

        {isLoading && !data && (
          <div className="space-y-2 py-1">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 bg-bg-subtle/60 animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {data && verified.length === 0 && pending.length === 0 && (
          <div className="py-3 text-center">
            <p className="text-sm text-text-muted">No community edges yet for this project.</p>
            <p className="text-xs text-text-muted/80 mt-0.5">Be the first — suggest a known alternative below.</p>
          </div>
        )}

        {verified.length > 0 && (
          <div>
            {verified.map((e, i) => (
              <EdgeRow key={e.id || i} edge={e} side={(data?.incoming || []).includes(e) ? 'incoming' : 'outgoing'} onVoted={handleVote} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div className={verified.length > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Community suggestions ({pending.length})
            </p>
            {pending.map((e, i) => (
              <EdgeRow key={e.id || i} edge={e} side={(data?.incomingPending || []).includes(e) ? 'incoming' : 'outgoing'} onVoted={handleVote} />
            ))}
            <p className="text-[11px] text-text-muted mt-1.5">
              Suggestions become verified after community quorum (3+ distinct voters).
            </p>
          </div>
        )}

        <SuggestForm repoFullName={fullName} repoName={name} onSuggested={handleSuggested} />
      </div>
    </motion.div>
  );
}

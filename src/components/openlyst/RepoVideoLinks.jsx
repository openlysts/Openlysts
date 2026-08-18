import { useState } from 'react';
import { Play, Loader2, ChevronDown, ChevronUp, Youtube } from 'lucide-react';
import { getRepoVideos } from '@/lib/api';

export default function RepoVideoLinks({ repo }) {
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videos) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRepoVideos(repo.full_name || repo.name);
      setVideos(data.videos || []);
      setExpanded(true);
    } catch (err) {
      setError('Could not load videos');
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (e, video_id) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.youtube.com/watch?v=${video_id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border bg-bg-subtle/40 hover:bg-bg-hover hover:border-border-strong text-xs font-medium text-text-secondary transition-all"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Youtube className="w-3.5 h-3.5 text-nonoss" />
        )}
        {loading ? 'Finding videos...' : 'Watch video explanations'}
        {!loading && videos && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {error && (
        <p className="text-[10px] text-nonoss text-center mt-1">{error}</p>
      )}

      {expanded && videos && (
        <div className="mt-2 space-y-1.5">
          {videos.length === 0 ? (
            <p className="text-[11px] text-text-muted text-center py-1">No videos found for this repo.</p>
          ) : (
            videos.slice(0, 3).map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => openVideo(e, v.video_id)}
                className="group flex gap-2 rounded-lg border border-border bg-bg-card hover:border-border-strong hover:bg-bg-hover transition-all p-1.5 text-left w-full"
              >
                <div className="relative w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-bg-subtle">
                  <img
                    src={`https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <Play className="w-3 h-3 text-white" fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[11px] font-medium text-text line-clamp-2 leading-tight">{v.title}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">{v.channel}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
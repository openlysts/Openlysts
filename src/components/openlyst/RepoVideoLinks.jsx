import { useState, useCallback } from 'react';
import { Play, Loader2, ChevronDown, ChevronUp, Youtube } from 'lucide-react';
import { getRepoVideos } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Module-level client-side memory cache for instantaneous 0ms reopening
const clientVideoCache = new Map();

export default function RepoVideoLinks({ repo }) {
  const repoIdentifier = repo?.full_name || repo?.name || '';
  const cacheKey = repoIdentifier.toLowerCase();
  
  const [videos, setVideos] = useState(() => clientVideoCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  // Background pre-fetch as soon as user hovers near button
  const handleMouseEnter = useCallback(() => {
    if (!cacheKey || clientVideoCache.has(cacheKey)) return;
    getRepoVideos(repoIdentifier)
      .then(data => {
        if (data?.videos) {
          clientVideoCache.set(cacheKey, data.videos);
          setVideos(data.videos);
        }
      })
      .catch(() => {});
  }, [repoIdentifier, cacheKey]);

  if (!repo) return null;

  const handleOpenChange = async (open) => {
    setExpanded(open);
    if (open) {
      const cached = clientVideoCache.get(cacheKey);
      if (cached) {
        setVideos(cached);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (!repoIdentifier) throw new Error('Invalid repo');
        const data = await getRepoVideos(repoIdentifier);
        const fetchedVideos = data?.videos || [];
        clientVideoCache.set(cacheKey, fetchedVideos);
        setVideos(fetchedVideos);
      } catch (err) {
        setError('Could not load videos');
      } finally {
        setLoading(false);
      }
    }
  };

  const openVideo = (e, video_id) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.youtube.com/watch?v=${video_id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-1.5 relative">
      <Popover open={expanded} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleMouseEnter}
            className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg border border-transparent hover:border-border bg-transparent hover:bg-bg-subtle text-xs font-medium text-text-muted hover:text-accent transition-all touch-target"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            ) : (
              <Youtube className="w-3.5 h-3.5 text-accent/80" />
            )}
            <span>{loading ? 'Finding videos...' : 'Video Breakdown'}</span>
            {!loading && videos && (expanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />)}
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-72 p-2 bg-bg-card border-border shadow-xl z-50 rounded-xl" sideOffset={6}>
          {error && (
            <p className="text-xs text-destructive text-center mt-1">{error}</p>
          )}

          {!error && loading && (
             <div className="flex justify-center items-center py-4">
               <Loader2 className="w-4 h-4 animate-spin text-accent" />
             </div>
          )}

          {videos && (
            <div className="space-y-1.5">
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
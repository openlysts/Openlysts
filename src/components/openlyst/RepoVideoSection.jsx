import React, { useState, useEffect } from 'react';
import { Loader2, Youtube, ChevronDown, ChevronUp, AlertCircle, Video } from 'lucide-react';
import { getRepoVideos } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { motion, AnimatePresence } from 'framer-motion';

export default function RepoVideoSection({ repo }) {
  const [expanded, setExpanded] = useState(false);
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const repoIdentifier = repo?.full_name || repo?.name || '';

  // Check user preference for auto-expanding videos on mount
  useEffect(() => {
    const settings = getSettings();
    if (settings.autoExpandVideos) {
      setExpanded(true);
      fetchVideos();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVideos = async () => {
    if (videos) return; // Already fetched
    setLoading(true);
    setError(null);
    try {
      if (!repoIdentifier) throw new Error('Invalid repo');
      const data = await getRepoVideos(repoIdentifier);
      setVideos(data?.videos || []);
    } catch (err) {
      setError('Could not load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (nextState) {
      fetchVideos();
    }
  };

  if (!repo) return null;

  return (
    <div className="card p-0 overflow-hidden mb-6">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 bg-bg-card hover:bg-bg-hover transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Tutorials & Explanations</h2>
            <p className="text-sm text-text-muted mt-0.5">Community video guides and deep dives</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-subtle text-text-muted">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-border"
          >
            <div className="p-5">
              {loading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <p className="text-sm text-text-muted">Finding best videos...</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-xl text-sm font-medium">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {!loading && !error && videos && videos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-bg-subtle flex items-center justify-center">
                    <Video className="w-6 h-6 text-text-muted" />
                  </div>
                  <h3 className="text-base font-bold text-text">No video explanations available yet</h3>
                  <p className="text-sm text-text-muted max-w-md mx-auto">
                    Be the first to create a tutorial or submit an existing one to help the community.
                  </p>
                  <button className="px-4 py-2 mt-2 bg-accent text-accent-fg text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Suggest a Video
                  </button>
                </div>
              )}

              {!loading && !error && videos && videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((v, i) => (
                    <div key={i} className="flex flex-col gap-2 group">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/80 shadow-sm bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${v.video_id}`}
                          title={v.title}
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          loading="lazy"
                          className="w-full h-full border-0 absolute inset-0"
                          allowFullScreen
                        />
                      </div>
                      <div className="px-1">
                        <h4 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">
                          {v.title}
                        </h4>
                        <p className="text-xs text-text-muted mt-1 truncate flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5" />
                          {v.channel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

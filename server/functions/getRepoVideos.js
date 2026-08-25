import ytSearch from 'yt-search';

const videoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async function getRepoVideos(req, res) {
  const repoName = req.query?.repoName || req.body?.repoName || '';
  
  if (!repoName) {
    return res.status(400).json({ error: true, message: 'repoName is required' });
  }

  const cached = videoCache.get(repoName.toLowerCase());
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.json({ videos: cached.videos });
  }

  try {
    const searchResult = await ytSearch(`${repoName} programming tutorial`);
    
    // Take the top 3 videos
    const videos = searchResult.videos.slice(0, 3).map(v => ({
      video_id: v.videoId,
      title: v.title,
      channel: v.author.name,
      url: v.url
    }));

    videoCache.set(repoName.toLowerCase(), { videos, timestamp: Date.now() });
    res.json({ videos });
  } catch (err) {
    console.warn('[getRepoVideos] Warning: YouTube search fetch failed:', err.message);
    res.json({ videos: [] });
  }
}

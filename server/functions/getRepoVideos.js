import ytSearch from 'yt-search';

export default async function getRepoVideos(req, res) {
  const { repoName } = req.body;
  
  if (!repoName) {
    return res.status(400).json({ error: true, message: 'repoName is required' });
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

    res.json({ videos });
  } catch (err) {
    console.error('[getRepoVideos] Error fetching YouTube videos:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch YouTube videos' });
  }
}

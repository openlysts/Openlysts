import ytSearch from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, '../data/video_cache.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class SimpleLRU {
  constructor(limit = 1000) {
    this.limit = limit;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return null;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, val);
    if (this.cache.size > this.limit) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }
  entries() {
    return this.cache.entries();
  }
  get size() {
    return this.cache.size;
  }
}

const videoCache = new SimpleLRU(1000);

// Load persistent disk cache on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    for (const [key, val] of Object.entries(data)) {
      if (val && val.videos && Array.isArray(val.videos)) {
        videoCache.set(key.toLowerCase(), val);
      }
    }
    console.log(`[getRepoVideos] Loaded ${videoCache.size} cached repo video entries.`);
  }
} catch (e) {
  console.warn('[getRepoVideos] Could not load video_cache.json:', e.message);
}

async function saveDiskCache() {
  try {
    const obj = {};
    for (const [k, v] of videoCache.entries()) {
      obj[k] = v;
    }
    await fs.promises.writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    // Non-blocking in serverless/read-only environments
  }
}

function normalizeSearchQuery(repoName) {
  if (!repoName) return '';
  // Clean 'owner/repo' into 'repo'
  const cleanName = repoName.includes('/') ? repoName.split('/')[1] : repoName;
  const sanitized = cleanName.replace(/[-_]/g, ' ').trim();
  return `${sanitized} tutorial`;
}

export default async function getRepoVideos(req, res) {
  const repoName = req.query?.repoName || req.body?.repoName || '';
  
  if (!repoName) {
    return res.status(400).json({ error: true, message: 'repoName is required' });
  }

  const cacheKey = repoName.toLowerCase().trim();
  const cached = videoCache.get(cacheKey);
  
  if (cached && cached.videos && (Date.now() - (cached.timestamp || 0) < CACHE_TTL_MS)) {
    return res.json({ videos: cached.videos, cached: true });
  }

  try {
    const query = normalizeSearchQuery(repoName);
    
    // Strict 3-second timeout protection
    const searchPromise = ytSearch(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('YouTube search timeout')), 3200)
    );

    const searchResult = await Promise.race([searchPromise, timeoutPromise]);
    
    const videos = (searchResult?.videos || []).slice(0, 3).map(v => ({
      video_id: v.videoId,
      title: v.title,
      channel: v.author?.name || 'YouTube',
      url: v.url
    }));

    videoCache.set(cacheKey, { videos, timestamp: Date.now() });
    
    // Asynchronously persist to disk without blocking response
    setTimeout(saveDiskCache, 100);

    res.json({ videos, cached: false });
  } catch (err) {
    console.warn(`[getRepoVideos] Notice: YouTube search for "${repoName}" (${err.message})`);
    
    // If expired cache exists, return it on network failure as resilient fallback
    if (cached && cached.videos) {
      return res.json({ videos: cached.videos, fallback: true });
    }
    
    // Cache the failure for 1 hour to prevent zombie spam loop on repeated hovers
    const ONE_HOUR_MS = 60 * 60 * 1000;
    videoCache.set(cacheKey, { videos: [], timestamp: Date.now() - CACHE_TTL_MS + ONE_HOUR_MS });
    setTimeout(saveDiskCache, 100);
    
    res.json({ videos: [] });
  }
}


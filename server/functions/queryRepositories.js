import { entities } from '../services/entities.js';
import { slugToLabel } from '../shared/openlyst.js';

const PER_PAGE = 24;

import { githubFetch, ingestRepoItem } from './runIngestion.js';

let cachedRepos = null;
let lastCacheTime = 0;
let inflightFetchPromise = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

export function invalidateRepositoriesCache() {
  cachedRepos = null;
  lastCacheTime = 0;
  inflightFetchPromise = null;
}

export async function prewarmRepositoriesCache() {
  if (cachedRepos && Date.now() - lastCacheTime < CACHE_TTL_MS) {
    return cachedRepos;
  }
  if (inflightFetchPromise) {
    return inflightFetchPromise;
  }

  inflightFetchPromise = (async () => {
    try {
      const rawRepos = await entities.Repository.list('-stars', 5000);
      const seen = new Set();
      const deduped = [];
      for (const r of rawRepos) {
        const key = (r.full_name || '').toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          deduped.push(r);
        }
      }
      cachedRepos = deduped;
      lastCacheTime = Date.now();
      return cachedRepos;
    } finally {
      inflightFetchPromise = null;
    }
  })();

  return inflightFetchPromise;
}

export default async function queryRepositories(req, res) {
  try {
    const body = req.body || {};

    const {
      q = '',
      categories = [],
      languages = [],
      licenses = [],
      topics = [],
      difficulties = [],
      minStars = 0,
      updatedWithin = '',
      activity = '',
      sort = 'trending',
      page = 1,
    } = body;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // Fallback: If page 1, search is active, and we have a token, do an async fetch to github 
    // to populate the database for this search.
    if (page === 1 && q.trim() && GITHUB_TOKEN) {
      const queryStr = q.trim();
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(queryStr)}&sort=stars&order=desc&per_page=30`;
      
      githubFetch(url, GITHUB_TOKEN, 1).then(async (data) => {
        if (data && data.items) {
          for (const item of data.items) {
            await ingestRepoItem(item);
          }
          invalidateRepositoriesCache();
        }
      }).catch(err => {
        console.error('GitHub fallback search failed in background:', err.message);
      });
    }

    const now = Date.now();
    let allRepos = cachedRepos;
    if (!allRepos || now - lastCacheTime > CACHE_TTL_MS) {
      allRepos = await prewarmRepositoriesCache();
    }
    let repos = (allRepos || []).filter((r) => !r.hidden);

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      repos = repos.filter((r) => {
        const haystack = [
          r.name, r.full_name, r.description, r.owner, r.language,
          (r.topics || []).join(' '), (r.categories || []).join(' '),
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    if (categories && categories.length > 0) {
      const labels = categories.map(slugToLabel);
      repos = repos.filter((r) =>
        labels.some((label) => (r.categories || []).includes(label))
      );
    }

    if (topics && topics.length > 0) {
      repos = repos.filter((r) =>
        topics.every((topic) => (r.topics || []).includes(topic))
      );
    }

    if (languages && languages.length > 0) {
      // Allow case-insensitive language matching
      const lowerLangs = languages.map(l => l.toLowerCase());
      repos = repos.filter((r) => r.language && lowerLangs.includes(r.language.toLowerCase()));
    }

    if (licenses && licenses.length > 0) {
      repos = repos.filter((r) => licenses.includes(r.license_status));
    }
    
    if (difficulties && difficulties.length > 0) {
      repos = repos.filter((r) => difficulties.includes(r.difficulty));
    }

    if (minStars && minStars > 0) {
      repos = repos.filter((r) => (r.stars || 0) >= minStars);
    }

    if (updatedWithin) {
      const days = { '24h': 1, '7d': 7, '30d': 30, '6mo': 180, '1yr': 365 }[updatedWithin];
      if (days) {
        const cutoff = Date.now() - days * 86400000;
        repos = repos.filter((r) => new Date(r.github_updated_at || 0).getTime() >= cutoff);
      }
    }

    if (activity) {
      if (activity === 'archived') {
        repos = repos.filter((r) => r.archived);
      } else if (activity === 'active') {
        repos = repos.filter((r) => !r.archived && new Date(r.github_updated_at || 0).getTime() >= Date.now() - 90 * 86400000);
      } else if (activity === 'recently-active') {
        repos = repos.filter((r) => !r.archived && new Date(r.github_updated_at || 0).getTime() >= Date.now() - 365 * 86400000);
      }
    }

    const sortFns = {
      trending: (a, b) => (b.trending_score || 0) - (a.trending_score || 0) || String(a.id || '').localeCompare(String(b.id || '')),
      stars: (a, b) => (b.stars || 0) - (a.stars || 0) || String(a.id || '').localeCompare(String(b.id || '')),
      updated: (a, b) => new Date(b.github_updated_at || 0).getTime() - new Date(a.github_updated_at || 0).getTime() || String(a.id || '').localeCompare(String(b.id || '')),
      recent: (a, b) => new Date(b.last_ingested_at || 0).getTime() - new Date(a.last_ingested_at || 0).getTime() || String(a.id || '').localeCompare(String(b.id || '')),
    };
    repos.sort(sortFns[sort] || sortFns.trending);

    const total = repos.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const pageNum = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (pageNum - 1) * PER_PAGE;
    const results = repos.slice(offset, offset + PER_PAGE);

    return res.json({ results, total, page: pageNum, totalPages, perPage: PER_PAGE });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

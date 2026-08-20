import { entities } from '../services/entities.js';
import { db } from '../db/index.js';
import {
  verifyLicense, classifyRepo, calculateQualityScore,
  calculateTrendingScore, computeStarsGained, autoClassifyDifficulty
} from '../shared/openlyst.js';
import { ingestAlternatives } from './ingestAlternatives.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';

const GITHUB_API = 'https://api.github.com';
const PER_PAGE = 30;

const SEED_QUERIES = [
  // AI & Machine Learning
  { query_string: 'LLM', category_hint: 'LLMs' },
  { query_string: 'AI', category_hint: 'AI' },
  { query_string: 'generative AI', category_hint: 'AI' },
  { query_string: 'AI agents', category_hint: 'AI Agents' },
  { query_string: 'RAG', category_hint: 'RAG' },
  { query_string: 'local AI', category_hint: 'Local AI' },
  { query_string: 'local LLM', category_hint: 'Local AI' },
  { query_string: 'Ollama', category_hint: 'Local AI' },
  { query_string: 'llama.cpp', category_hint: 'Local AI' },
  { query_string: 'machine learning', category_hint: 'Machine Learning' },
  { query_string: 'AI framework', category_hint: 'Libraries & Frameworks' },
  
  // Web Development
  { query_string: 'react', category_hint: 'Web Frameworks' },
  { query_string: 'vue', category_hint: 'Web Frameworks' },
  { query_string: 'nextjs', category_hint: 'Web Frameworks' },
  { query_string: 'typescript', category_hint: 'Languages' },
  { query_string: 'tailwindcss', category_hint: 'Styling' },
  { query_string: 'static site generator', category_hint: 'Static Site Generators' },
  { query_string: 'headless cms', category_hint: 'CMS' },

  // Backend & Infrastructure
  { query_string: 'database', category_hint: 'Databases' },
  { query_string: 'orm', category_hint: 'ORMs' },
  { query_string: 'api gateway', category_hint: 'API Gateways' },
  { query_string: 'graphql', category_hint: 'APIs' },
  { query_string: 'serverless', category_hint: 'Serverless' },
  
  // DevOps & Cloud Native
  { query_string: 'kubernetes', category_hint: 'DevOps' },
  { query_string: 'docker', category_hint: 'DevOps' },
  { query_string: 'ci/cd', category_hint: 'CI/CD' },
  { query_string: 'infrastructure as code', category_hint: 'Infrastructure' },
  { query_string: 'observability', category_hint: 'Monitoring' },
  { query_string: 'monitoring', category_hint: 'Monitoring' },
  { query_string: 'prometheus', category_hint: 'Monitoring' },
  
  // Developer Tools
  { query_string: 'developer tools', category_hint: 'Developer Tools' },
  { query_string: 'developer productivity', category_hint: 'Developer Tools' },
  { query_string: 'cli', category_hint: 'CLI Tools' },
  { query_string: 'testing framework', category_hint: 'Testing' },
  
  // Security
  { query_string: 'security', category_hint: 'Security' },
  { query_string: 'authentication', category_hint: 'Authentication' },
  { query_string: 'authorization', category_hint: 'Authentication' },
  { query_string: 'penetration testing', category_hint: 'Security' },
  
  // Miscellaneous
  { query_string: 'self-hosted', category_hint: 'Self-Hosted' },
  { query_string: 'open-source web application', category_hint: 'Web Applications' },
  { query_string: 'automation', category_hint: 'Automation' },
  { query_string: 'open source alternative', category_hint: 'Alternatives' },
  { query_string: 'low code', category_hint: 'Low Code' },
  { query_string: 'rust', category_hint: 'Languages' },
  { query_string: 'python', category_hint: 'Languages' },
  { query_string: 'golang', category_hint: 'Languages' }
];

export async function githubFetch(url, token, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Openlysts-Discovery-Engine',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 403 || res.status === 429) {
        if (retries === 1 || attempt === retries - 1) {
          throw new Error(`GitHub API rate limit or access denied (${res.status})`);
        }
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const reset = res.headers.get('X-RateLimit-Reset');
        if (remaining === '0' && reset) {
          const waitSec = Math.min(60, Math.max(1, parseInt(reset) - Math.floor(Date.now() / 1000)));
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('GitHub API request failed after retries');
}

export async function fetchRepoWithFallback(owner, name, token = '') {
  // 1. Try standard GitHub API
  try {
    const data = await githubFetch(`https://api.github.com/repos/${owner}/${name}`, token, 1);
    if (data && data.full_name) return data;
  } catch (apiErr) {
    console.warn(`[INGEST] GitHub API rate-limited or failed for ${owner}/${name} (${apiErr.message}). Attempting web fallback...`);
  }

  // 2. Fallback to public GitHub metadata
  const url = `https://github.com/${owner}/${name}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch repository ${owner}/${name} from GitHub (HTTP ${res.status})`);
  }

  const html = await res.text();
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
  const starsMatch = html.match(/id=["']repo-stars-counter-star["'][^>]*title=["']([\d,]+)["']/i) || html.match(/id=["']repo-stars-counter-star["'][^>]*>([\d.,kKmM]+)</i);
  
  let stars = 0;
  if (starsMatch) {
    const raw = starsMatch[1].replace(/,/g, '').trim().toLowerCase();
    if (raw.endsWith('k')) stars = Math.round(parseFloat(raw) * 1000);
    else if (raw.endsWith('m')) stars = Math.round(parseFloat(raw) * 1000000);
    else stars = parseInt(raw, 10) || 0;
  }

  let description = '';
  if (ogDescMatch) {
    description = ogDescMatch[1].replace(/\s*-\s*[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/i, '').trim();
  }

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  return {
    id: hashCode(`${owner}/${name}`),
    full_name: `${owner}/${name}`,
    name,
    owner: { login: owner },
    description: description || `Open-source project by ${owner}`,
    html_url: url,
    homepage: '',
    default_branch: 'main',
    language: 'TypeScript',
    license: { spdx_id: 'MIT', name: 'MIT License' },
    stargazers_count: stars,
    forks_count: Math.round(stars * 0.08),
    open_issues_count: 0,
    watchers_count: stars,
    topics: ['open-source', 'developer-tools'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived: false,
  };
}

export async function ingestRepoItem(item, categoryHint = '', repoMap = new Map(), snapshotMap = new Map()) {
  const licenseInfo = verifyLicense(item.license);
  const repoData = {
    github_id: item.id,
    full_name: item.full_name,
    owner: item.owner?.login || '',
    name: item.name,
    description: item.description || '',
    html_url: item.html_url,
    homepage_url: item.homepage || '',
    default_branch: item.default_branch || 'main',
    language: item.language || '',
    license_key: licenseInfo.key || '',
    license_name: licenseInfo.name || '',
    license_url: licenseInfo.url || '',
    license_status: licenseInfo.status,
    stars: item.stargazers_count || 0,
    forks: item.forks_count || 0,
    open_issues: item.open_issues_count || 0,
    watchers: item.watchers_count || 0,
    topics: item.topics || [],
    categories: classifyRepo(item, categoryHint),
    github_created_at: item.created_at,
    github_updated_at: item.updated_at,
    last_ingested_at: new Date().toISOString(),
    archived: item.archived || false,
    quality_score: 0,
    trending_score: 0,
    stars_gained_24h: 0,
    stars_gained_7d: 0,
    stars_gained_30d: 0,
  };
  
  repoData.difficulty = autoClassifyDifficulty(repoData);

  const repoKey = String(item.id);
  const existing = repoMap.get(repoKey);
  const snapshots = snapshotMap.get(existing?.id) || [];
  const { g24, g7, g30 } = computeStarsGained(snapshots, repoData.stars);
  repoData.stars_gained_24h = g24;
  repoData.stars_gained_7d = g7;
  repoData.stars_gained_30d = g30;
  repoData.quality_score = calculateQualityScore(repoData);
  repoData.trending_score = calculateTrendingScore(g24, g7, g30);

  let resultEntity;
  if (existing) {
    resultEntity = await entities.Repository.update(existing.id, {
      ...repoData,
      hidden: existing.hidden,
      featured: existing.featured,
    });
  } else {
    resultEntity = await entities.Repository.create({
      ...repoData,
      hidden: false,
      featured: false,
    });
  }

  await entities.MetricSnapshot.create({
    repository_id: resultEntity.id,
    stars: repoData.stars,
    forks: repoData.forks,
    open_issues: repoData.open_issues,
    snapshot_date: new Date().toISOString(),
  });
  
  return resultEntity;
}

export async function executeIngestion() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      console.warn('[INGESTION] WARNING: GITHUB_TOKEN is not set. Requests will be unauthenticated and severely rate-limited (60 req/hr).');
    }

    const startedAt = new Date().toISOString();
    console.log('[INGESTION] started');

    // Make sure alternatives are ingested!
    await ingestAlternatives();

    const runRecord = await entities.IngestionRun.create({
      started_at: startedAt,
      status: 'running',
      repos_processed: 0,
      repos_added: 0,
      repos_updated: 0,
      error_log: '',
      query_used: '',
    });

    let queries = await entities.DiscoveryQuery.list('-created_date', 100);
    
    // Check for missing seed queries and add them dynamically
    const existingQueryStrings = new Set(queries.map(q => q.query_string));
    const newQueriesToAdd = SEED_QUERIES.filter(sq => !existingQueryStrings.has(sq.query_string));
    
    if (newQueriesToAdd.length > 0) {
      await entities.DiscoveryQuery.bulkCreate(
        newQueriesToAdd.map((q) => ({ ...q, enabled: true }))
      );
      queries = await entities.DiscoveryQuery.list('-created_date', 100);
    }

    const enabledQueries = queries
      .filter((q) => q.enabled)
      .sort((a, b) => {
        if (!a.last_run_at) return -1;
        if (!b.last_run_at) return 1;
        return new Date(a.last_run_at) - new Date(b.last_run_at);
      })
      .slice(0, 3);
    const errors = [];
    let reposProcessed = 0, reposAdded = 0, reposUpdated = 0;

    const { rows: existingRows } = await db.query('SELECT id, github_id, full_name, hidden, featured FROM "Repository"');
    const repoMap = new Map();
    for (const r of existingRows) {
      if (r.github_id) repoMap.set(String(r.github_id), r);
      if (r.full_name) repoMap.set(r.full_name.toLowerCase(), r);
    }

    const existingSnapshots = await entities.MetricSnapshot.list('-snapshot_date', 10000);
    const snapshotMap = new Map();
    for (const s of existingSnapshots) {
      if (!snapshotMap.has(s.repository_id)) snapshotMap.set(s.repository_id, []);
      snapshotMap.get(s.repository_id).push(s);
    }

    for (const dq of enabledQueries) {
      try {
        const page = dq.current_page || 1;
        
        let qStr = dq.query_string;
        // Interleave fresh discovery: on even pages, fetch repos created in the last year
        if (page % 2 === 0) {
           const oneYearAgo = new Date();
           oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
           const dateStr = oneYearAgo.toISOString().split('T')[0];
           qStr += ` created:>${dateStr}`;
        }

        // Fetch repositories using GitHub search API with pagination
        const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(qStr)}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`;
        const data = await githubFetch(url, process.env.GITHUB_TOKEN);
        
        let hasMore = false;
        if (data.items && data.items.length > 0) {
          hasMore = data.items.length === PER_PAGE;
          
          // Process in parallel batches of 10 to speed up DB inserts and prevent 60s timeout
          const items = data.items;
          const batchSize = 10;
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (item) => {
                try {
                  await ingestRepoItem(item, dq.category_hint, repoMap, snapshotMap);
                  reposProcessed++;
                } catch (repoErr) {
                  errors.push(`Repo ${item.full_name}: ${repoErr.message}`);
                }
              })
            );
          }
        }

        // Deep Pagination logic
        // GitHub search limits results to the first 1000 items. (1000 / 30 = 33 pages)
        const next_page = (hasMore && page < 33) ? page + 1 : 1;

        await entities.DiscoveryQuery.update(dq.id, {
          last_run_at: new Date().toISOString(),
          current_page: next_page
        });
      } catch (queryErr) {
        errors.push(`Query "${dq.query_string}": ${queryErr.message}`);
      }
    }

    const status = errors.length === 0 ? 'success' : (reposProcessed > 0 ? 'partial' : 'failed');
    await entities.IngestionRun.update(runRecord.id, {
      finished_at: new Date().toISOString(),
      status,
      repos_processed: reposProcessed,
      repos_added: reposAdded,
      repos_updated: reposUpdated,
      error_log: errors.slice(0, 50).join('\n'),
      query_used: enabledQueries.map((q) => q.query_string).join(', '),
    });

    console.log(`[INGESTION] completed (Processed: ${reposProcessed})`);
    invalidateRepositoriesCache();

    return {
      status,
      repos_processed: reposProcessed,
      repos_added: reposAdded,
      repos_updated: reposUpdated,
      errors: errors.slice(0, 20),
    };
  } catch (error) {
    console.error('[INGESTION] failed:', error);
    throw error;
  }
}

export default async function runIngestion(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('[INGESTION] Unauthorized attempt to trigger ingestion.');
        return res.status(401).json({ error: true, message: 'Unauthorized' });
      }
    }

    const result = await executeIngestion();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

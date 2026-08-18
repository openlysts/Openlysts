import { entities } from '../services/entities.js';
import {
  verifyLicense, classifyRepo, calculateQualityScore,
  calculateTrendingScore, computeStarsGained, autoClassifyDifficulty
} from '../shared/openlyst.js';

const GITHUB_API = 'https://api.github.com';
const PER_PAGE = 30;

const SEED_QUERIES = [
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
  { query_string: 'self-hosted', category_hint: 'Self-Hosted' },
  { query_string: 'open-source web application', category_hint: 'Web Applications' },
  { query_string: 'developer tools', category_hint: 'Developer Tools' },
  { query_string: 'automation', category_hint: 'Automation' },
  { query_string: 'databases', category_hint: 'Databases' },
  { query_string: 'developer productivity', category_hint: 'Developer Tools' },
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
        const remaining = res.headers.get('X-RateLimit-Remaining');
        const reset = res.headers.get('X-RateLimit-Reset');
        if (remaining === '0' && reset) {
          const waitSec = Math.min(60, Math.max(1, parseInt(reset) - Math.floor(Date.now() / 1000)));
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        }
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
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

export async function ingestRepoItem(item, categoryHint = '') {
  const existingRepos = await entities.Repository.list('-created_date', 5000);
  const repoMap = new Map();
  for (const r of existingRepos) {
    if (r.github_id) repoMap.set(String(r.github_id), r);
  }

  const existingSnapshots = await entities.MetricSnapshot.list('-snapshot_date', 15000);
  const snapshotMap = new Map();
  for (const s of existingSnapshots) {
    if (!snapshotMap.has(s.repository_id)) snapshotMap.set(s.repository_id, []);
    snapshotMap.get(s.repository_id).push(s);
  }

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
    if (!queries || queries.length === 0) {
      await entities.DiscoveryQuery.bulkCreate(
        SEED_QUERIES.map((q) => ({ ...q, enabled: true }))
      );
      queries = await entities.DiscoveryQuery.list('-created_date', 100);
    }

    const enabledQueries = queries.filter((q) => q.enabled);
    const errors = [];
    let reposProcessed = 0, reposAdded = 0, reposUpdated = 0;

    const existingRepos = await entities.Repository.list('-created_date', 2000);
    const repoMap = new Map();
    for (const r of existingRepos) {
      if (r.github_id) repoMap.set(String(r.github_id), r);
    }

    const existingSnapshots = await entities.MetricSnapshot.list('-snapshot_date', 10000);
    const snapshotMap = new Map();
    for (const s of existingSnapshots) {
      if (!snapshotMap.has(s.repository_id)) snapshotMap.set(s.repository_id, []);
      snapshotMap.get(s.repository_id).push(s);
    }

    for (const dq of enabledQueries) {
      try {
        const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(dq.query_string)}&sort=stars&order=desc&per_page=${PER_PAGE}`;
        const data = await githubFetch(url, process.env.GITHUB_TOKEN);
        if (!data.items) continue;

        for (const item of data.items) {
          try {
            await ingestRepoItem(item, dq.category_hint);
            reposProcessed++;
            // We do not have granular reposAdded vs reposUpdated in this simplified loop
          } catch (repoErr) {
            errors.push(`Repo ${item.full_name}: ${repoErr.message}`);
          }
        }

        await entities.DiscoveryQuery.update(dq.id, {
          last_run_at: new Date().toISOString(),
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
    const result = await executeIngestion();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

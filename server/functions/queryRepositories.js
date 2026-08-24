import { db } from '../db/index.js';
import { slugToLabel } from '../shared/openlyst.js';
import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { serverCache } from '../services/cache.js';

const PER_PAGE = 24;

const REPO_LIST_COLUMNS = `
  id, created_date, github_id, full_name, owner, name, description,
  html_url, homepage_url, default_branch, language, license_key, license_name,
  license_url, license_status, stars, forks, open_issues, watchers, topics,
  categories, github_created_at, github_updated_at, last_ingested_at,
  archived, hidden, featured, quality_score, trending_score, stars_gained_24h,
  stars_gained_7d, stars_gained_30d, difficulty, engagement_score, authority_score,
  staff_pick, openlysts_score_boost, updated_at, tags
`;

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

    // Fallback search trigger for new queries on page 1
    if (page === 1 && q.trim() && GITHUB_TOKEN) {
      const queryStr = q.trim();
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(queryStr)}&sort=stars&order=desc&per_page=30`;
      
      githubFetch(url, GITHUB_TOKEN, 1).then(async (data) => {
        if (data && data.items) {
          for (const item of data.items) {
            await ingestRepoItem(item);
          }
        }
      }).catch(err => {
        console.error('GitHub fallback search failed in background:', err.message);
      });
    }

    let whereConditions = ['COALESCE(hidden, 0) = 0'];
    let params = [];
    let paramIdx = 1;

    // 1. Text Search (ILIKE across name, description, owner, language)
    if (q && q.trim()) {
      const searchStr = `%${q.trim()}%`;
      whereConditions.push(`(
        full_name ILIKE $${paramIdx} OR 
        name ILIKE $${paramIdx} OR 
        owner ILIKE $${paramIdx} OR 
        description ILIKE $${paramIdx} OR 
        language ILIKE $${paramIdx}
      )`);
      params.push(searchStr);
      paramIdx++;
    }

    let categoriesArray = categories || [];
    if (typeof categoriesArray === 'string') {
      categoriesArray = [categoriesArray];
    } else if (!Array.isArray(categoriesArray)) {
      categoriesArray = [];
    }

    // 2. JSON Categories Filter (supports slug & label with safe JSONB casting)
    if (categoriesArray.length > 0) {
      const expandedCategories = Array.from(new Set([
        ...categoriesArray,
        ...categoriesArray.map(slugToLabel)
      ]));
      whereConditions.push(`COALESCE(NULLIF(categories, ''), '[]')::jsonb ?| $${paramIdx}`);
      params.push(expandedCategories);
      paramIdx++;
    }

    // 3. JSON Topics Filter (supports safe JSONB casting)
    if (topics && topics.length > 0) {
      whereConditions.push(`COALESCE(NULLIF(topics, ''), '[]')::jsonb ?& $${paramIdx}`);
      params.push(topics);
      paramIdx++;
    }

    // 4. Array Filters
    if (languages && languages.length > 0) {
      whereConditions.push(`lower(language) = ANY($${paramIdx})`);
      params.push(languages.map(l => l.toLowerCase()));
      paramIdx++;
    }

    if (licenses && licenses.length > 0) {
      whereConditions.push(`license_status = ANY($${paramIdx})`);
      params.push(licenses);
      paramIdx++;
    }

    if (difficulties && difficulties.length > 0) {
      whereConditions.push(`difficulty = ANY($${paramIdx})`);
      params.push(difficulties);
      paramIdx++;
    }

    if (minStars && minStars > 0) {
      whereConditions.push(`stars >= $${paramIdx}`);
      params.push(minStars);
      paramIdx++;
    }

    // 5. Date Filters
    if (updatedWithin) {
      const days = { '24h': 1, '7d': 7, '30d': 30, '6mo': 180, '1yr': 365 }[updatedWithin];
      if (days) {
        whereConditions.push(`(NULLIF(github_updated_at, '')::timestamptz >= NOW() - INTERVAL '${days} days')`);
      }
    }

    if (activity) {
      if (activity === 'archived') {
        whereConditions.push(`COALESCE(archived, 0) = 1`);
      } else if (activity === 'active') {
        whereConditions.push(`COALESCE(archived, 0) = 0 AND (NULLIF(github_updated_at, '')::timestamptz >= NOW() - INTERVAL '90 days')`);
      } else if (activity === 'recently-active') {
        whereConditions.push(`COALESCE(archived, 0) = 0 AND (NULLIF(github_updated_at, '')::timestamptz >= NOW() - INTERVAL '365 days')`);
      }
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // 6. Sorting
    let orderBy = 'ORDER BY trending_score DESC, stars DESC, id DESC';
    const effectiveSort = (q && q.trim() && sort === 'trending') ? 'relevance' : sort;
    
    switch (effectiveSort) {
      case 'stars':
        orderBy = 'ORDER BY stars DESC, id DESC';
        break;
      case 'updated':
        orderBy = 'ORDER BY github_updated_at DESC NULLS LAST, id DESC';
        break;
      case 'recent':
        orderBy = 'ORDER BY last_ingested_at DESC NULLS LAST, id DESC';
        break;
      case 'engagement':
        orderBy = 'ORDER BY engagement_score DESC, stars DESC, id DESC';
        break;
      case 'authority':
        orderBy = 'ORDER BY authority_score DESC, stars DESC, id DESC';
        break;
      case 'relevance':
        orderBy = 'ORDER BY trending_score DESC, stars DESC, id DESC';
        break;
    }

    // Calculate total count
    const countResult = await db.query(`SELECT COUNT(*) as total FROM "Repository" ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / PER_PAGE);
    const pageNum = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (pageNum - 1) * PER_PAGE;

    // Fetch paginated repository rows with surgical column projection
    const query = `
      SELECT ${REPO_LIST_COLUMNS} FROM "Repository"
      ${whereClause}
      ${orderBy}
      LIMIT ${PER_PAGE} OFFSET ${offset}
    `;
    
    const { rows: rawResults } = await db.query(query, params);

    // Safely parse JSON fields
    const results = rawResults.map(r => {
      let parsedTopics = r.topics;
      if (typeof parsedTopics === 'string') {
        try { parsedTopics = JSON.parse(parsedTopics); } catch { parsedTopics = []; }
      }
      let parsedCats = r.categories;
      if (typeof parsedCats === 'string') {
        try { parsedCats = JSON.parse(parsedCats); } catch { parsedCats = []; }
      }
      return {
        ...r,
        topics: Array.isArray(parsedTopics) ? parsedTopics : [],
        categories: Array.isArray(parsedCats) ? parsedCats : []
      };
    });

    // Compute category counts efficiently with In-Memory LRU & TTL cache
    let categoryCounts = serverCache.get('category_counts');
    if (!categoryCounts) {
      categoryCounts = {};
      try {
        const catCountQuery = `
          SELECT jsonb_array_elements_text(COALESCE(NULLIF(categories, ''), '[]')::jsonb) as category, count(*) as count 
          FROM "Repository" 
          WHERE COALESCE(hidden, 0) = 0 
          GROUP BY category
        `;
        const { rows: catRows } = await db.query(catCountQuery);
        for (const row of catRows) {
          if (row.category) {
            categoryCounts[row.category] = parseInt(row.count, 10);
          }
        }
        // Cache for 15 minutes
        serverCache.set('category_counts', categoryCounts, 15 * 60 * 1000);
      } catch (e) {
        console.warn('[DB] Category count calculation warning:', e.message);
      }
    }

    return res.json({ results, total, page: pageNum, totalPages, perPage: PER_PAGE, categoryCounts });
  } catch (error) {
    console.error('queryRepositories 500 ERROR:', error);
    return res.status(500).json({ error: true, message: error.message || "Internal Server Error" });
  }
}

export function invalidateRepositoriesCache() {
  serverCache.invalidate('category_counts');
}

export async function prewarmRepositoriesCache() {
  try {
    const catCountQuery = `
      SELECT jsonb_array_elements_text(COALESCE(NULLIF(categories, ''), '[]')::jsonb) as category, count(*) as count 
      FROM "Repository" 
      WHERE COALESCE(hidden, 0) = 0 
      GROUP BY category
    `;
    const { rows: catRows } = await db.query(catCountQuery);
    const categoryCounts = {};
    for (const row of catRows) {
      if (row.category) {
        categoryCounts[row.category] = parseInt(row.count, 10);
      }
    }
    serverCache.set('category_counts', categoryCounts, 15 * 60 * 1000);
  } catch (e) {
    console.warn('[CACHE] Prewarm repository cache error:', e.message);
  }
}

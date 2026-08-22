import { db } from '../db/index.js';

const PER_PAGE = 24;

export default async function queryAlternatives(req, res) {
  try {
    const body = req.body || {};
    const {
      q = '',
      categories = [],
      sort = 'relevance',
      page = 1,
    } = body;

    let whereConditions = [];
    let params = [];
    let paramIdx = 1;

    // 1. Text Search (ILIKE)
    if (q && q.trim()) {
      const searchStr = `%${q.trim()}%`;
      whereConditions.push(`(
        a.paid_tool_name ILIKE $${paramIdx} OR 
        a.free_tool_name ILIKE $${paramIdx} OR 
        a.description ILIKE $${paramIdx} OR 
        a.category ILIKE $${paramIdx} OR
        r.name ILIKE $${paramIdx} OR
        r.description ILIKE $${paramIdx}
      )`);
      params.push(searchStr);
      paramIdx++;
    }

    // 2. Category Filter (Exact match on Alternative's category)
    if (categories && categories.length > 0) {
      // Allow multi-category selection
      whereConditions.push(`a.category = ANY($${paramIdx})`);
      params.push(categories);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 3. Sorting
    let orderBy = 'ORDER BY a.feature_parity_score DESC, a.id DESC';
    switch (sort) {
      case 'stars':
        orderBy = 'ORDER BY r.stars DESC NULLS LAST, a.id DESC';
        break;
      case 'recent':
        orderBy = 'ORDER BY a.created_date DESC NULLS LAST, a.id DESC';
        break;
      case 'relevance':
        orderBy = 'ORDER BY a.feature_parity_score DESC NULLS LAST, r.stars DESC NULLS LAST, a.id DESC';
        break;
    }

    const query = `
      SELECT 
        a.id, a.created_date, a.paid_tool_name, a.free_tool_name, a.free_tool_repo,
        a.description as alt_description, a.pros_and_cons, a.youtube_tutorial_url,
        a.article_tutorial_url, a.why_it_is_better, a.migration_difficulty,
        a.feature_parity_score, a.category,
        r.id as repo_id, r.github_id, r.full_name as repo_full_name, r.owner as repo_owner,
        r.name as repo_name, r.description as repo_description, r.html_url as repo_html_url,
        r.homepage_url as repo_homepage_url, r.default_branch as repo_default_branch,
        r.language as repo_language, r.license_key as repo_license_key,
        r.license_name as repo_license_name, r.license_url as repo_license_url,
        r.license_status as repo_license_status, r.stars as repo_stars,
        r.forks as repo_forks, r.open_issues as repo_open_issues,
        r.topics as repo_topics, r.categories as repo_categories,
        r.quality_score as repo_quality_score, r.trending_score as repo_trending_score,
        r.difficulty as repo_difficulty
      FROM "Alternative" a
      LEFT JOIN "Repository" r ON lower(a.free_tool_repo) = lower(r.full_name)
      ${whereClause}
      ${orderBy}
    `;

    // Fetch all for pagination calculation (could use COUNT but we also deduplicate below)
    const { rows } = await db.query(query, params);

    // Find max stars for normalization (calculated across all filtered results)
    const maxStars = Math.max(1, ...rows.map(r => r.repo_stars || 0));

    // Deduplicate (since the old code deduplicates on paid_tool_name + free_tool_repo)
    const seenKeys = new Set();
    const dedupedRows = [];
    for (const row of rows) {
      const uniqueKey = `${(row.paid_tool_name || '').trim().toLowerCase()}::${(row.free_tool_repo || row.free_tool_name || '').trim().toLowerCase()}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        dedupedRows.push(row);
      }
    }

    const enriched = dedupedRows.map(row => {
      let repo = null;
      if (row.repo_id) {
        let topics = row.repo_topics;
        if (typeof topics === 'string') {
          try { topics = JSON.parse(topics); } catch {}
        }
        let repo_categories = row.repo_categories;
        if (typeof repo_categories === 'string') {
          try { repo_categories = JSON.parse(repo_categories); } catch {}
        }

        repo = {
          id: row.repo_id,
          github_id: row.github_id,
          full_name: row.repo_full_name,
          owner: row.repo_owner,
          name: row.repo_name,
          description: row.repo_description,
          html_url: row.repo_html_url,
          homepage_url: row.repo_homepage_url,
          default_branch: row.repo_default_branch,
          language: row.repo_language,
          license_key: row.repo_license_key,
          license_name: row.repo_license_name,
          license_url: row.repo_license_url,
          license_status: row.repo_license_status,
          stars: row.repo_stars || 0,
          forks: row.repo_forks || 0,
          open_issues: row.repo_open_issues || 0,
          topics: topics || [],
          categories: repo_categories || [],
          quality_score: row.repo_quality_score || 0,
          trending_score: row.repo_trending_score || 0,
          difficulty: row.repo_difficulty || 'Intermediate'
        };
      }

      // Compute Openlysts Score (0-100)
      const parityScore = (row.feature_parity_score || 70) * 0.40;
      const starsNorm = repo ? Math.min(100, (Math.log10((repo.stars || 1) + 1) / Math.log10(maxStars + 1)) * 100) : 30;
      const starsScore = starsNorm * 0.30;
      const descScore = (row.alt_description && row.alt_description.length > 20) ? 10 : 0;
      const mediaScore = (row.youtube_tutorial_url || row.article_tutorial_url) ? 10 : 0;
      const openlystsScore = Math.round(parityScore + starsScore + descScore + mediaScore + 10);

      return {
        id: row.id,
        created_date: row.created_date,
        paid_tool_name: row.paid_tool_name,
        free_tool_name: row.free_tool_name,
        free_tool_repo: row.free_tool_repo,
        description: row.alt_description,
        pros_and_cons: row.pros_and_cons,
        youtube_tutorial_url: row.youtube_tutorial_url,
        article_tutorial_url: row.article_tutorial_url,
        why_it_is_better: row.why_it_is_better,
        migration_difficulty: row.migration_difficulty,
        feature_parity_score: row.feature_parity_score,
        category: row.category,
        openlysts_score: openlystsScore,
        repo: repo
      };
    });

    const total = enriched.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const pageNum = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (pageNum - 1) * PER_PAGE;
    
    const results = enriched.slice(offset, offset + PER_PAGE);

    return res.json({ results, total, page: pageNum, totalPages, perPage: PER_PAGE });
  } catch (error) {
    console.error('queryAlternatives 500 ERROR:', error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
}

export function invalidateAlternativesCache() {
  // DB-backed queries always fetch fresh data from Neon
}

export async function prewarmAlternativesCache() {
  // Prewarm routine if needed
}

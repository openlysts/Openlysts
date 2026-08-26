import { db } from '../db/index.js';
import { serverCache } from '../services/cache.js';
import { queryAlternativesCatalog } from '../services/catalogEngine.js';

const PER_PAGE = 24;

export default async function queryAlternatives(req, res) {
  try {
    const body = req.body || {};
    const {
      q = '',
      search = '',
      categories = [],
      category = '',
      sort = 'relevance',
      page = 1,
    } = body;

    const searchTerm = (q || search || '').trim().toLowerCase();
    let catList = Array.isArray(categories) ? [...categories] : (categories ? [categories] : []);
    if (category && category !== 'All' && !catList.includes(category)) {
      catList.push(category);
    }

    // 1. Fetch from In-Memory Cache or Neon DB
    if (serverCache.get('neon_incomplete')) {
      throw new Error('Neon database is flagged as incomplete (quota limit). Bypassing to JSON catalog.');
    }

    let baseRows = serverCache.get('alts_base_dataset');
    if (!baseRows) {
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
      `;
      const { rows } = await db.query(query);
      baseRows = rows;
      // Cache base rows for 15 minutes
      serverCache.set('alts_base_dataset', baseRows, 15 * 60 * 1000);
    }

    // Find max stars for normalization across entire dataset
    const maxStars = Math.max(1, ...baseRows.map(r => r.repo_stars || 0));

    // Deduplicate on paid_tool_name + free_tool_repo
    const seenKeys = new Set();
    const dedupedRows = [];
    for (const row of baseRows) {
      const uniqueKey = `${(row.paid_tool_name || '').trim().toLowerCase()}::${(row.free_tool_repo || row.free_tool_name || '').trim().toLowerCase()}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        dedupedRows.push(row);
      }
    }

    // Enrich and map rows
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

      const resolvedName = row.free_tool_name || (repo ? repo.name : row.free_tool_repo) || 'Alternative';
      const rawDesc = row.alt_description || (repo ? repo.description : '') || '';
      const resolvedDesc = rawDesc.replace(/^\[.*?\]\(.*?\)[\s-]*\s*/, '').trim();
      const resolvedDiff = row.migration_difficulty || (repo ? repo.difficulty : 'Medium') || 'Medium';

      return {
        id: row.id,
        created_date: row.created_date,
        paid_tool_name: row.paid_tool_name,
        free_tool_name: row.free_tool_name,
        free_tool_repo: row.free_tool_repo,
        resolved_name: resolvedName,
        name: resolvedName,
        description: resolvedDesc,
        pros_and_cons: row.pros_and_cons,
        youtube_tutorial_url: row.youtube_tutorial_url,
        article_tutorial_url: row.article_tutorial_url,
        why_it_is_better: row.why_it_is_better,
        migration_difficulty: resolvedDiff,
        feature_parity_score: row.feature_parity_score || 70,
        feature_parity: row.feature_parity_score || 70,
        github_stars: repo ? (repo.stars || 0) : 0,
        category: row.category || 'Developer Tools',
        openlysts_score: openlystsScore,
        repo: repo
      };
    });

    // 2. Filter dataset in-memory
    let filtered = enriched.filter(alt => {
      // Text search match
      if (searchTerm) {
        const matchesSearch = 
          (alt.paid_tool_name && alt.paid_tool_name.toLowerCase().includes(searchTerm)) ||
          (alt.free_tool_name && alt.free_tool_name.toLowerCase().includes(searchTerm)) ||
          (alt.free_tool_repo && alt.free_tool_repo.toLowerCase().includes(searchTerm)) ||
          (alt.description && alt.description.toLowerCase().includes(searchTerm)) ||
          (alt.category && alt.category.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;
      }

      // Category filter match
      if (catList.length > 0) {
        if (!catList.includes(alt.category)) return false;
      }

      return true;
    });

    // 3. Sorting
    switch (sort) {
      case 'stars':
        filtered.sort((a, b) => (b.github_stars || 0) - (a.github_stars || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        break;
      case 'relevance':
      default:
        filtered.sort((a, b) => {
          if ((b.feature_parity || 0) !== (a.feature_parity || 0)) {
            return (b.feature_parity || 0) - (a.feature_parity || 0);
          }
          return (b.github_stars || 0) - (a.github_stars || 0);
        });
        break;
    }

    // Compute categories, grouped data, and stats for the frontend
    const catMap = {};
    const paidSet = new Set();
    let totalScore = 0;
    const groupedMap = {};

    for (const alt of filtered) {
      const cat = alt.category || 'Developer Tools';
      catMap[cat] = (catMap[cat] || 0) + 1;

      if (alt.paid_tool_name) {
        paidSet.add(alt.paid_tool_name.trim().toLowerCase());
      }
      totalScore += alt.openlysts_score || 0;

      if (!groupedMap[cat]) groupedMap[cat] = {};
      const paid = alt.paid_tool_name || 'Unknown';
      if (!groupedMap[cat][paid]) groupedMap[cat][paid] = [];
      groupedMap[cat][paid].push(alt);
    }

    const categoriesList = Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const groupedArray = Object.entries(groupedMap).map(([categoryName, paidGroups]) => {
      const paidGroupsArray = Object.entries(paidGroups).map(([paidName, alts]) => ({
        paid_tool_name: paidName,
        alternatives: alts,
        count: alts.length,
      }));
      return {
        category: categoryName,
        paid_groups: paidGroupsArray,
        total: paidGroupsArray.reduce((sum, g) => sum + g.count, 0)
      };
    }).sort((a, b) => b.total - a.total);

    const stats = {
      total_tools: filtered.length,
      total_paid_tools: paidSet.size,
      total_categories: categoriesList.length,
      avg_score: filtered.length > 0 ? Math.round(totalScore / filtered.length) : 0
    };

    const total = filtered.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    let safePage = parseInt(page, 10);
    if (isNaN(safePage)) safePage = 1;
    const pageNum = Math.max(1, Math.min(safePage, totalPages || 1));
    const offset = (pageNum - 1) * PER_PAGE;
    
    const results = filtered.slice(offset, offset + PER_PAGE);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.json({ 
      alternatives: filtered,
      categories: categoriesList,
      grouped: groupedArray,
      stats,
      results, 
      total, 
      page: pageNum, 
      totalPages, 
      perPage: PER_PAGE 
    });
  } catch (error) {
    console.warn('[DB] queryAlternatives failed, serving from catalog engine:', error.message);
    const body = (req && req.body) || {};
    const query = (req && req.query) || {};
    const fallbackData = queryAlternativesCatalog({
      category: body.category || query.category || (body.categories && body.categories[0]) || (query.categories && query.categories[0]) || 'All',
      search: body.q || body.search || query.q || query.search || '',
      sort: body.sort || query.sort || 'stars',
      page: body.page || query.page || 1,
      perPage: PER_PAGE
    });
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.json(fallbackData);
    }
    return fallbackData;
  }
}

export function invalidateAlternativesCache() {
  serverCache.invalidate('alts_');
  serverCache.invalidate('global_platform_stats');
}

export async function prewarmAlternativesCache() {
  try {
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
    `;
    const { rows } = await db.query(query);
    serverCache.set('alts_base_dataset', rows, 15 * 60 * 1000);
  } catch (e) {
    console.warn('[CACHE] Prewarm alternatives cache error:', e.message);
  }
}

import { db } from '../db/index.js';

let cachedEnriched = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 60s in-memory cache

export function invalidateAlternativesCache() {
  cachedEnriched = null;
  lastCacheTime = 0;
}

export default async function queryAlternatives(req, res) {
  try {
    const { category, search, sort = 'score', view } = req.body || {};
    const now = Date.now();

    if (!cachedEnriched || now - lastCacheTime > CACHE_TTL_MS) {
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

      // Find max stars for normalization
      const maxStars = Math.max(1, ...rows.map(r => r.repo_stars || 0));

      cachedEnriched = rows.map(row => {
        let repo = null;
        if (row.repo_id) {
          let topics = row.repo_topics;
          if (typeof topics === 'string') {
            try { topics = JSON.parse(topics); } catch {}
          }
          let categories = row.repo_categories;
          if (typeof categories === 'string') {
            try { categories = JSON.parse(categories); } catch {}
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
            categories: categories || [],
            quality_score: row.repo_quality_score || 0,
            trending_score: row.repo_trending_score || 0,
            difficulty: row.repo_difficulty || 'Intermediate'
          };
        }

        // Compute Openlysts Score (0-100)
        const parityScore = (row.feature_parity_score || 70) * 0.40;
        const starsNorm = repo ? Math.min(100, (Math.log10((repo.stars || 1) + 1) / Math.log10(maxStars + 1)) * 100) : 30;
        const starsScore = starsNorm * 0.30;
        const difficultyMap = { 'Easy': 100, 'Medium': 60, 'Hard': 30 };
        const diffScore = (difficultyMap[row.migration_difficulty] || 60) * 0.20;
        const metaScore = ((row.alt_description ? 50 : 0) + (row.pros_and_cons ? 30 : 0) + (row.why_it_is_better ? 20 : 0)) * 0.10;
        
        const openlystsScore = Math.round(parityScore + starsScore + diffScore + metaScore);

        // Resolve name: prefer free_tool_name > repo.name > domain extraction
        let resolvedName = row.free_tool_name || '';
        if (!resolvedName && repo?.name) {
          resolvedName = repo.name;
        }
        if (!resolvedName && row.free_tool_repo) {
          if (row.free_tool_repo.startsWith('http')) {
            try {
              resolvedName = new URL(row.free_tool_repo).hostname.replace(/^www\./, '').split('.')[0];
              resolvedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
            } catch { resolvedName = row.free_tool_repo; }
          } else {
            resolvedName = row.free_tool_repo.split('/').pop() || row.free_tool_repo;
          }
        }

        return {
          id: row.id,
          created_date: row.created_date,
          paid_tool_name: row.paid_tool_name,
          free_tool_name: row.free_tool_name,
          free_tool_repo: row.free_tool_repo,
          description: row.alt_description || repo?.description || '',
          pros_and_cons: row.pros_and_cons,
          youtube_tutorial_url: row.youtube_tutorial_url,
          article_tutorial_url: row.article_tutorial_url,
          why_it_is_better: row.why_it_is_better,
          migration_difficulty: row.migration_difficulty,
          feature_parity_score: row.feature_parity_score,
          category: row.category,
          repo,
          resolved_name: resolvedName,
          openlysts_score: openlystsScore
        };
      });

      lastCacheTime = now;
    }

    const enriched = cachedEnriched;

    // Filter by category
    let filtered = enriched;
    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.paid_tool_name?.toLowerCase().includes(s) || 
        a.resolved_name?.toLowerCase().includes(s) || 
        a.free_tool_repo?.toLowerCase().includes(s) ||
        a.description?.toLowerCase().includes(s) ||
        a.category?.toLowerCase().includes(s)
      );
    }

    // Sort
    const sortFns = {
      score: (a, b) => b.openlysts_score - a.openlysts_score,
      stars: (a, b) => (b.repo?.stars || 0) - (a.repo?.stars || 0),
      parity: (a, b) => (b.feature_parity_score || 0) - (a.feature_parity_score || 0),
      name: (a, b) => (a.resolved_name || '').localeCompare(b.resolved_name || ''),
      difficulty: (a, b) => {
        const order = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };
        return (order[a.migration_difficulty] || 1) - (order[b.migration_difficulty] || 1);
      }
    };
    filtered.sort(sortFns[sort] || sortFns.score);

    // Build grouped structure: category -> paid_tool_name -> alternatives[]
    const grouped = {};
    for (const alt of filtered) {
      const cat = alt.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = {};
      const paid = alt.paid_tool_name || 'Unknown';
      if (!grouped[cat][paid]) grouped[cat][paid] = [];
      grouped[cat][paid].push(alt);
    }

    // Convert to array sorted by category size
    const groupedArray = Object.entries(grouped)
      .map(([categoryName, paidGroups]) => {
        const paidGroupsArray = Object.entries(paidGroups)
          .map(([paidName, alts]) => ({
            paid_tool_name: paidName,
            alternatives: alts,
            count: alts.length,
            best_score: Math.max(...alts.map(a => a.openlysts_score))
          }))
          .sort((a, b) => b.best_score - a.best_score);
        
        return {
          category: categoryName,
          paid_groups: paidGroupsArray,
          total: paidGroupsArray.reduce((sum, g) => sum + g.count, 0)
        };
      })
      .sort((a, b) => b.total - a.total);

    // All categories with counts for sidebar
    const allCategories = Object.entries(
      enriched.reduce((acc, a) => {
        const cat = a.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Stats for the header
    const stats = {
      total_tools: filtered.length,
      total_categories: allCategories.length,
      total_paid_tools: new Set(filtered.map(a => a.paid_tool_name)).size,
      avg_score: filtered.length ? Math.round(filtered.reduce((s, a) => s + a.openlysts_score, 0) / filtered.length) : 0,
      top_rated: filtered.length ? filtered.reduce((best, a) => a.openlysts_score > best.openlysts_score ? a : best, filtered[0]) : null
    };

    res.json({
      success: true,
      categories: allCategories,
      grouped: groupedArray,
      alternatives: filtered,
      stats,
      total: filtered.length
    });
  } catch (err) {
    console.error('queryAlternatives error:', err);
    res.status(500).json({ error: true, message: err.message });
  }
}

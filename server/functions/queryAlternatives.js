import { entities } from '../services/entities.js';

export default async function queryAlternatives(req, res) {
  try {
    const { category, search, sort = 'score', view } = req.body || {};

    const allAlternatives = await entities.Alternative.list();
    const allRepos = await entities.Repository.list();
    const repoMap = new Map(allRepos.map(r => [r.full_name.toLowerCase(), r]));

    // Find the max stars across all repos for normalization
    const maxStars = Math.max(1, ...allRepos.map(r => r.stars || 0));

    const enriched = allAlternatives.map(alt => {
      const repo = repoMap.get(alt.free_tool_repo?.toLowerCase()) || null;
      
      // Compute Openlysts Score (0-100)
      const parityScore = (alt.feature_parity_score || 70) * 0.40;
      const starsNorm = repo ? Math.min(100, (Math.log10((repo.stars || 1) + 1) / Math.log10(maxStars + 1)) * 100) : 30;
      const starsScore = starsNorm * 0.30;
      const difficultyMap = { 'Easy': 100, 'Medium': 60, 'Hard': 30 };
      const diffScore = (difficultyMap[alt.migration_difficulty] || 60) * 0.20;
      const metaScore = ((alt.description ? 50 : 0) + (alt.pros_and_cons ? 30 : 0) + (alt.why_it_is_better ? 20 : 0)) * 0.10;
      
      const openlystsScore = Math.round(parityScore + starsScore + diffScore + metaScore);

      // Resolve name: prefer free_tool_name > repo.name > domain extraction
      let resolvedName = alt.free_tool_name || '';
      if (!resolvedName && repo?.name) {
        resolvedName = repo.name;
      }
      if (!resolvedName && alt.free_tool_repo) {
        if (alt.free_tool_repo.startsWith('http')) {
          try {
            resolvedName = new URL(alt.free_tool_repo).hostname.replace(/^www\./, '').split('.')[0];
            resolvedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
          } catch { resolvedName = alt.free_tool_repo; }
        } else {
          resolvedName = alt.free_tool_repo.split('/').pop() || alt.free_tool_repo;
        }
      }

      return {
        ...alt,
        repo,
        resolved_name: resolvedName,
        openlysts_score: openlystsScore
      };
    });

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

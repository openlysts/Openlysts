import { entities } from '../services/entities.js';

export default async function queryAlternatives(req, res) {
  try {
    const { category, search } = req.body || {};

    const allAlternatives = await entities.Alternative.list();
    const allRepos = await entities.Repository.list();
    const repoMap = new Map(allRepos.map(r => [r.full_name.toLowerCase(), r]));

    const enriched = allAlternatives.map(alt => {
      const repo = repoMap.get(alt.free_tool_repo?.toLowerCase()) || null;
      return {
        ...alt,
        repo: repo // attach full repo metadata if it exists
      };
    });

    let filtered = enriched;
    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.paid_tool_name?.toLowerCase().includes(s) || 
        a.free_tool_name?.toLowerCase().includes(s) || 
        a.free_tool_repo?.toLowerCase().includes(s) ||
        a.description?.toLowerCase().includes(s)
      );
    }

    const allCategories = Array.from(new Set(enriched.map(a => a.category).filter(Boolean))).sort();

    res.json({
      success: true,
      categories: allCategories,
      alternatives: filtered,
      total: filtered.length
    });
  } catch (err) {
    console.error('queryAlternatives error:', err);
    res.status(500).json({ error: true, message: err.message });
  }
}

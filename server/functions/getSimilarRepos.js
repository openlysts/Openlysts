import { db } from '../db/index.js';
import { getCatalogRepositories } from '../services/catalogEngine.js';

export default async function getSimilarRepos(req, res) {
  const fullName = req.query?.fullName || req.body?.fullName || '';
  if (!fullName) {
    return res.status(400).json({ error: true, message: 'Missing fullName' });
  }

  const targetFullName = fullName.trim().toLowerCase();

  try {
    // 1. Fetch the target repository directly from SQL
    const { rows: targetRows } = await db.query(
      'SELECT * FROM "Repository" WHERE LOWER(full_name) = LOWER($1) LIMIT 1',
      [fullName.trim()]
    );

    if (targetRows.length > 0) {
      const targetRepo = targetRows[0];
      let targetCategories = targetRepo.categories;
      if (typeof targetCategories === 'string') {
        try { targetCategories = JSON.parse(targetCategories); } catch { targetCategories = []; }
      }
      if (!Array.isArray(targetCategories)) targetCategories = [];

      let targetTopics = targetRepo.topics;
      if (typeof targetTopics === 'string') {
        try { targetTopics = JSON.parse(targetTopics); } catch { targetTopics = []; }
      }
      if (!Array.isArray(targetTopics)) targetTopics = [];

      const targetLanguage = targetRepo.language || '';
      const safeCategories = Array.isArray(targetCategories) && targetCategories.length > 0 ? targetCategories : ['__none__'];
      const safeTopics = Array.isArray(targetTopics) && targetTopics.length > 0 ? targetTopics : ['__none__'];

      // 2. Fetch candidate similar repositories using targeted SQL index filtering
      const candidateQuery = `
        SELECT * FROM "Repository"
        WHERE COALESCE(hidden, 0) = 0
          AND LOWER(full_name) != LOWER($1)
          AND (
            (language IS NOT NULL AND language != '' AND language = $2)
            OR (COALESCE(NULLIF(categories, ''), '[]')::jsonb ?| $3)
            OR (COALESCE(NULLIF(topics, ''), '[]')::jsonb ?| $4)
          )
        ORDER BY trending_score DESC, stars DESC
        LIMIT 40
      `;

      const { rows: candidateRows } = await db.query(candidateQuery, [
        fullName.trim(),
        targetLanguage,
        safeCategories,
        safeTopics
      ]);

      if (candidateRows.length > 0) {
        const scoredRepos = candidateRows.map((r) => {
          let rCategories = r.categories;
          if (typeof rCategories === 'string') {
            try { rCategories = JSON.parse(rCategories); } catch { rCategories = []; }
          }
          let rTopics = r.topics;
          if (typeof rTopics === 'string') {
            try { rTopics = JSON.parse(rTopics); } catch { rTopics = []; }
          }

          const parsedRepo = {
            ...r,
            categories: Array.isArray(rCategories) ? rCategories : [],
            topics: Array.isArray(rTopics) ? rTopics : []
          };

          let score = 0;
          parsedRepo.categories.forEach((c) => {
            if (targetCategories.includes(c)) score += 10;
          });
          parsedRepo.topics.forEach((t) => {
            if (targetTopics.includes(t)) score += 2;
          });
          if (targetLanguage && parsedRepo.language === targetLanguage) {
            score += 1;
          }
          score += (parsedRepo.authority_score || 0) * 0.1;
          score += (parsedRepo.engagement_score || 0) * 0.05;

          return { repo: parsedRepo, score };
        }).filter((item) => item.score > 2);

        scoredRepos.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.repo.trending_score || 0) - (a.repo.trending_score || 0);
        });

        const topSimilar = scoredRepos.slice(0, 3).map((item) => item.repo);
        return res.json({ similarRepos: topSimilar });
      }
    }
  } catch (dbErr) {
    console.warn('[getSimilarRepos] Database query failed, using catalog engine fallback:', dbErr.message);
  }

  // Fallback: In-memory Catalog Engine
  try {
    const repos = getCatalogRepositories();
    const targetRepo = repos.find(r => 
      (r.full_name || '').toLowerCase() === targetFullName || 
      (r.name || '').toLowerCase() === targetFullName.split('/')[1]
    );

    if (!targetRepo) {
      return res.json({ similarRepos: [] });
    }

    const targetCategories = Array.isArray(targetRepo.categories) ? targetRepo.categories : [];
    const targetTopics = Array.isArray(targetRepo.topics) ? targetRepo.topics : [];
    const targetLanguage = targetRepo.language || '';

    const candidates = repos.filter(r => (r.full_name || '').toLowerCase() !== targetFullName);

    const scored = candidates.map(r => {
      let score = 0;
      const rCats = Array.isArray(r.categories) ? r.categories : [];
      const rTops = Array.isArray(r.topics) ? r.topics : [];

      rCats.forEach(c => {
        if (targetCategories.includes(c)) score += 10;
      });
      rTops.forEach(t => {
        if (targetTopics.includes(t)) score += 2;
      });
      if (targetLanguage && r.language === targetLanguage) score += 1;

      score += (r.stars || 0) * 0.0001;

      return { repo: r, score };
    }).filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    const topSimilar = scored.slice(0, 3).map(item => item.repo);
    return res.json({ similarRepos: topSimilar });
  } catch (error) {
    console.error('[getSimilarRepos] Fallback Error:', error);
    return res.status(200).json({ similarRepos: [] });
  }
}

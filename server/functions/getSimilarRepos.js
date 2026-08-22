import { db } from '../db/index.js';

export default async function getSimilarRepos(req, res) {
  try {
    const { fullName } = req.body || {};
    if (!fullName) {
      return res.status(400).json({ error: true, message: 'Missing fullName' });
    }

    // 1. Fetch the target repository directly from SQL
    const { rows: targetRows } = await db.query(
      'SELECT * FROM "Repository" WHERE LOWER(full_name) = LOWER($1) LIMIT 1',
      [fullName.trim()]
    );

    if (targetRows.length === 0) {
      return res.json({ similarRepos: [] });
    }

    const targetRepo = targetRows[0];
    let targetCategories = targetRepo.categories;
    if (typeof targetCategories === 'string') {
      try { targetCategories = JSON.parse(targetCategories); } catch { targetCategories = []; }
    }
    let targetTopics = targetRepo.topics;
    if (typeof targetTopics === 'string') {
      try { targetTopics = JSON.parse(targetTopics); } catch { targetTopics = []; }
    }

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

    // 3. Score only the top 40 candidate repositories
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

      // Match Categories (+10 points each)
      parsedRepo.categories.forEach((c) => {
        if (targetCategories.includes(c)) score += 10;
      });

      // Match Topics (+2 points each)
      parsedRepo.topics.forEach((t) => {
        if (targetTopics.includes(t)) score += 2;
      });

      // Match Language (+1 point)
      if (targetLanguage && parsedRepo.language === targetLanguage) {
        score += 1;
      }

      // Boost by Authority and Engagement
      score += (parsedRepo.authority_score || 0) * 0.1;
      score += (parsedRepo.engagement_score || 0) * 0.05;

      return { repo: parsedRepo, score };
    }).filter((item) => item.score > 2);

    // Sort by similarity score, then by trending score
    scoredRepos.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.repo.trending_score || 0) - (a.repo.trending_score || 0);
    });

    const topSimilar = scoredRepos.slice(0, 3).map((item) => item.repo);
    return res.json({ similarRepos: topSimilar });
  } catch (error) {
    console.error('[getSimilarRepos] Error:', error);
    return res.status(500).json({ error: true, message: error.message || 'Internal Server Error' });
  }
}

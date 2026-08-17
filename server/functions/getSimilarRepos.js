import { entities } from '../services/entities.js';

export default async function getSimilarRepos(req, res) {
  try {
    const { fullName } = req.body || {};
    if (!fullName) {
      return res.status(400).json({ error: true, message: 'Missing fullName' });
    }

    const allRepos = await entities.Repository.list('-created_date', 3000);
    const targetRepo = allRepos.find((r) => r.full_name === fullName);

    if (!targetRepo) {
      return res.status(404).json({ error: true, message: 'Repository not found' });
    }

    const targetCategories = targetRepo.categories || [];
    const targetTopics = targetRepo.topics || [];
    const targetLanguage = targetRepo.language;

    const scoredRepos = allRepos
      .filter((r) => !r.hidden && r.full_name !== fullName)
      .map((r) => {
        let score = 0;
        
        // Match Categories (+10 points each)
        const cats = r.categories || [];
        cats.forEach((c) => {
          if (targetCategories.includes(c)) score += 10;
        });

        // Match Topics (+2 points each)
        const tops = r.topics || [];
        tops.forEach((t) => {
          if (targetTopics.includes(t)) score += 2;
        });

        // Match Language (+1 point)
        if (targetLanguage && r.language === targetLanguage) {
          score += 1;
        }

        return { repo: r, score };
      })
      .filter((item) => item.score > 0); // Only keep repos with at least some similarity

    // Sort by similarity score, then by trending score to break ties
    scoredRepos.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.repo.trending_score || 0) - (a.repo.trending_score || 0);
    });

    // Return the top 3 similar repositories
    const topSimilar = scoredRepos.slice(0, 3).map((item) => item.repo);
    return res.json({ similarRepos: topSimilar });
  } catch (error) {
    console.error('[getSimilarRepos] Error:', error);
    return res.status(500).json({ error: true, message: error.message });
  }
}

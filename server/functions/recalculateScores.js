import { entities } from '../services/entities.js';
import {
  calculateQualityScore, calculateTrendingScore, computeStarsGained,
} from '../shared/openlyst.js';

export default async function recalculateScores(req, res) {
  try {
    const repos = await entities.Repository.list('-created_date', 2000);
    const snapshots = await entities.MetricSnapshot.list('-snapshot_date', 10000);
    const snapshotMap = new Map();
    for (const s of snapshots) {
      if (!snapshotMap.has(s.repository_id)) snapshotMap.set(s.repository_id, []);
      snapshotMap.get(s.repository_id).push(s);
    }

    let updated = 0;
    const batchSize = 25;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      await Promise.all(batch.map(async (repo) => {
        const snaps = snapshotMap.get(repo.id) || [];
        const { g24, g7, g30 } = computeStarsGained(snaps, repo.stars);
        const quality = calculateQualityScore(repo);
        const trending = calculateTrendingScore(g24, g7, g30);
        await entities.Repository.update(repo.id, {
          quality_score: quality,
          trending_score: trending,
          stars_gained_24h: g24,
          stars_gained_7d: g7,
          stars_gained_30d: g30,
        });
        updated++;
      }));
    }

    return res.json({ status: 'success', repos_updated: updated });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

import { db } from '../db/index.js';
import {
  calculateQualityScore, calculateTrendingScore, computeStarsGained,
  calculateEngagementScore, calculateAuthorityScore
} from '../shared/openlyst.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';

export default async function recalculateScores(req, res) {
  try {
    // 1. Fetch repositories
    const { rows: repos } = await db.query(
      'SELECT id, stars, forks, github_updated_at, github_created_at, license_status, archived, full_name, language, open_issues FROM "Repository" ORDER BY stars DESC LIMIT 2000'
    );

    if (repos.length === 0) {
      return res.json({ status: 'success', repos_updated: 0 });
    }

    const repoIds = repos.map(r => r.id);

    // 2. Fetch only recent snapshots for these specific repositories
    const { rows: recentSnapshots } = await db.query(
      `SELECT repository_id, stars, snapshot_date 
       FROM "MetricSnapshot" 
       WHERE repository_id = ANY($1) 
       ORDER BY snapshot_date DESC`,
      [repoIds]
    );

    const snapshotMap = new Map();
    for (const s of recentSnapshots) {
      if (!snapshotMap.has(s.repository_id)) {
        snapshotMap.set(s.repository_id, []);
      }
      if (snapshotMap.get(s.repository_id).length < 50) {
        snapshotMap.get(s.repository_id).push(s);
      }
    }

    // 3. Compute score updates
    const updates = repos.map((repo) => {
      const snaps = snapshotMap.get(repo.id) || [];
      const { g24, g7, g30 } = computeStarsGained(snaps, repo.stars || 0);
      const quality = calculateQualityScore(repo);
      const trending = calculateTrendingScore(g24, g7, g30);
      const engagement = calculateEngagementScore(repo, g30);
      const authority = calculateAuthorityScore(repo);

      return {
        id: repo.id,
        quality_score: quality,
        trending_score: trending,
        stars_gained_24h: g24,
        stars_gained_7d: g7,
        stars_gained_30d: g30,
        engagement_score: engagement,
        authority_score: authority,
      };
    });

    // 4. Execute fast batched multi-row UPDATEs in chunks of 100
    const BATCH_SIZE = 100;
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        for (const item of chunk) {
          await client.query(
            `UPDATE "Repository" 
             SET quality_score = $1, 
                 trending_score = $2, 
                 stars_gained_24h = $3, 
                 stars_gained_7d = $4, 
                 stars_gained_30d = $5,
                 engagement_score = $6,
                 authority_score = $7
             WHERE id = $8`,
            [
              item.quality_score,
              item.trending_score,
              item.stars_gained_24h,
              item.stars_gained_7d,
              item.stars_gained_30d,
              item.engagement_score,
              item.authority_score,
              item.id
            ]
          );
          updatedCount++;
        }
        await client.query('COMMIT');
      } catch (chunkErr) {
        await client.query('ROLLBACK');
        console.error('[RecalculateScores] Batch chunk error:', chunkErr.message);
      } finally {
        client.release();
      }
    }

    invalidateRepositoriesCache();

    return res.json({ status: 'success', repos_updated: updatedCount });
  } catch (error) {
    console.error('[RecalculateScores] Error:', error);
    return res.status(500).json({ error: true, message: error.message || 'Internal Server Error' });
  }
}

import { db } from '../db/index.js';

export default async function syncBookmarks(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  if (!req.user) {
    return res.status(401).json({ error: true, message: 'Unauthorized' });
  }

  const { operations } = req.body;
  if (!Array.isArray(operations)) {
    return res.status(400).json({ error: true, message: 'operations array is required' });
  }

  try {
    for (const op of operations) {
      if (!op.repoId) continue;
      
      if (op.action === 'add') {
        await db.query(
          `INSERT INTO "Bookmark" (id, user_id, repo_id, created_date) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, repo_id) DO NOTHING`,
          [
            `${req.user.id}_${op.repoId}`,
            req.user.id,
            op.repoId,
            new Date().toISOString()
          ]
        );
      } else if (op.action === 'remove') {
        await db.query(
          `DELETE FROM "Bookmark" WHERE user_id = $1 AND repo_id = $2`,
          [req.user.id, op.repoId]
        );
      }
    }

    return res.json({ success: true, syncedCount: operations.length });
  } catch (error) {
    console.error('[SYNC] syncBookmarks error:', error);
    return res.status(500).json({ error: true, message: 'Failed to sync bookmarks' });
  }
}

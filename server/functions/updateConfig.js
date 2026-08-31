import { db } from '../db/index.js';

export default async function updateConfig(req, res) {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: true });
  const { githubToken } = req.body;

  try {
    if (githubToken !== undefined) {
      if (githubToken === '') {
        await db.query(`DELETE FROM "SystemConfig" WHERE key = 'GITHUB_TOKEN'`);
        delete process.env.GITHUB_TOKEN;
      } else {
        await db.query(`
          INSERT INTO "SystemConfig" (id, key, value, updated_at) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
        `, [
          `cfg_${Date.now()}_${Math.floor(Math.random() * 1000)}`, 
          'GITHUB_TOKEN', 
          githubToken,
          new Date().toISOString()
        ]);
        process.env.GITHUB_TOKEN = githubToken;
      }
    }

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('[API] updateConfig error:', error);
    res.status(500).json({ error: true, message: 'Failed to update config in database' });
  }
}

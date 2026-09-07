import express from 'express';
import { getPersonalizedRecommendations } from '../services/recommendations.js';

const router = express.Router();

router.all('/', (req, res) => {
  try {
    const rawTags = req.query?.tags || req.body?.tags || [];
    const rawExclude = req.query?.exclude || req.body?.exclude || [];
    const limit = Math.min(24, Math.max(1, parseInt(req.query?.limit || req.body?.limit || '6', 10)));

    const interestTags = typeof rawTags === 'string' ? rawTags.split(',') : (Array.isArray(rawTags) ? rawTags : []);
    const excludeIds = typeof rawExclude === 'string' ? rawExclude.split(',') : (Array.isArray(rawExclude) ? rawExclude : []);

    const recommendations = getPersonalizedRecommendations(interestTags, excludeIds, limit);

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      ok: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (err) {
    console.error('[Recommendations API] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to generate recommendations.' });
  }
});

export default router;

import { getRisingRepositories } from '../services/velocityTracker.js';
import { featureFlags } from '../services/featureFlags.js';

export default async function getRisingStars(req, res) {
  try {
    // Kill-switch: when the rising_stars flag is off, serve an empty rail
    if (!featureFlags.isEnabled('rising_stars')) {
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ ok: true, count: 0, repositories: [] });
    }

    const limit = Math.min(24, Math.max(1, parseInt(req.query?.limit || req.body?.limit || '12', 10)));
    const rising = getRisingRepositories(limit);

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      ok: true,
      count: rising.length,
      repositories: rising,
    });
  } catch (err) {
    console.error('[getRisingStars] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to retrieve rising stars.' });
  }
}

import express from 'express';
import { featureFlags } from '../services/featureFlags.js';

const router = express.Router();

router.get('/', (req, res) => {
  const userId = req.user?.id || req.headers['x-anonymous-id'] || null;
  const flags = featureFlags.getAllFlags(userId);

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    flags,
  });
});

export default router;

// ─── Public Sponsorships & Donation Config ───────────────────────────
// Zero-auth read endpoint used by the client to render "Sponsored" badges
// and the optional Donate button. Tiny payload, server-cached 60s and
// edge-cached 5 min so it costs Neon (almost) nothing per visitor.

import { Router } from 'express';
import { getPublicSponsorships } from '../services/sponsorships.js';
import { getTransferMode } from '../services/transferGuard.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const data = await getPublicSponsorships();
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.set('Vary', 'Accept-Encoding');
    res.json({ ...data, transferMode: getTransferMode() });
  } catch (e) {
    console.error('[SPONSOR] public fetch failed:', e.message);
    res.set('Cache-Control', 'no-store');
    res.status(500).json({ error: true, message: 'Sponsorships unavailable' });
  }
});

export default router;
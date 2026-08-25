import express from 'express';
import queryRepositories from '../functions/queryRepositories.js';
import runIngestion from '../functions/runIngestion.js';
import recalculateScores from '../functions/recalculateScores.js';
import reclassifyRepos from '../functions/reclassifyRepos.js';
import inviteUser from '../functions/inviteUser.js';
import getRepoVideos from '../functions/getRepoVideos.js';
import getRepoReadme from '../functions/getRepoReadme.js';
import getSimilarRepos from '../functions/getSimilarRepos.js';
import getRepoHistory from '../functions/getRepoHistory.js';
import translateText from '../functions/translateText.js';
import updateConfig from '../functions/updateConfig.js';
import queryAlternatives from '../functions/queryAlternatives.js';
import getGlobalStats from '../functions/getGlobalStats.js';
import syncCatalogToNeon from '../functions/syncCatalogToNeon.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES } from '../auth/constants.js';

const router = express.Router();

const fns = {
  queryRepositories,
  runIngestion,
  recalculateScores,
  reclassifyRepos,
  inviteUser,
  getRepoVideos,
  getRepoReadme,
  getSimilarRepos,
  getRepoHistory,
  translateText,
  updateConfig,
  queryAlternatives,
  getGlobalStats,
  syncCatalogToNeon
};

const adminOnlyFunctions = [
  'runIngestion',
  'recalculateScores',
  'reclassifyRepos',
  'updateConfig',
  'inviteUser',
  'syncCatalogToNeon'
];

const requireAdmin = [requireAuth, requireRole(ROLES.ADMIN)];

router.all('/:name', async (req, res, next) => {
  const { name } = req.params;
  const fn = fns[name];
  if (!fn) {
    return res.status(404).json({ error: true, message: `Function not found: ${name}` });
  }

  // If GET, merge query parameters into body so functions receiving params can access them uniformly
  if (req.method === 'GET' && (!req.body || Object.keys(req.body).length === 0)) {
    req.body = {};
    for (const [key, value] of Object.entries(req.query)) {
      try {
        if (typeof value === 'string') {
          req.body[key] = JSON.parse(value);
        } else {
          req.body[key] = value;
        }
      } catch (e) {
        // If it fails to parse (e.g. normal string), keep it as is
        req.body[key] = value;
      }
    }
  }
  
  // Authorize admin-only functions
  if (adminOnlyFunctions.includes(name)) {
    for (let mw of requireAdmin) {
      if (res.headersSent) return;
      await new Promise((resolve) => {
        let done = false;
        const complete = (err) => {
          if (!done) {
            done = true;
            resolve(err);
          }
        };
        res.once('finish', complete);
        mw(req, res, complete);
      });
      if (res.headersSent) return;
    }
  } else if (req.method === 'GET') {
    // Apply Vercel Edge Caching for public GET functions (5 mins cache, 10 mins stale-while-revalidate)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }
  
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;

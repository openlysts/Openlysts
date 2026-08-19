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
  queryAlternatives
};

const adminOnlyFunctions = [
  'runIngestion',
  'recalculateScores',
  'reclassifyRepos',
  'updateConfig',
  'inviteUser'
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
    req.body = { ...req.query };
  }
  
  // Authorize admin-only functions
  if (adminOnlyFunctions.includes(name)) {
    // Manually run middleware stack
    for (let mw of requireAdmin) {
      const err = await new Promise((resolve) => mw(req, res, resolve));
      if (err) return; // Response was already sent by middleware
    }
  }
  
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;

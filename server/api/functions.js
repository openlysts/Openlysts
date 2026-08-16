import express from 'express';
import queryRepositories from '../functions/queryRepositories.js';
import runIngestion from '../functions/runIngestion.js';
import recalculateScores from '../functions/recalculateScores.js';
import reclassifyRepos from '../functions/reclassifyRepos.js';
import getMyTasks from '../functions/getMyTasks.js';
import inviteUser from '../functions/inviteUser.js';

const router = express.Router();

const fns = {
  queryRepositories,
  runIngestion,
  recalculateScores,
  reclassifyRepos,
  getMyTasks,
  inviteUser
};

router.post('/:name', async (req, res, next) => {
  const { name } = req.params;
  const fn = fns[name];
  if (!fn) {
    return res.status(404).json({ error: true, message: `Function not found: ${name}` });
  }
  
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;

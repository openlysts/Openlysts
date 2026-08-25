import express from 'express';
import { entities } from '../services/entities.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES } from '../auth/constants.js';

const router = express.Router();

// Middleware for protecting mutating actions
const requireAdmin = [requireAuth, requireRole(ROLES.ADMIN)];

router.get('/:entity/:action', async (req, res, next) => {
  const { entity, action } = req.params;
  const service = entities[entity];
  
  if (!service) {
    return res.status(400).json({ error: true, message: `Unknown entity: ${entity}` });
  }

  // Only allow list and filter on GET
  if (!['list', 'filter'].includes(action)) {
    return res.status(405).json({ error: true, message: `Method not allowed for action: ${action}` });
  }

  // Apply Vercel Edge Caching (5 mins cache, 10 mins stale-while-revalidate)
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  try {
    let result;
    if (action === 'list') {
      result = await service.list(req.query.sort, req.query.limit);
    } else if (action === 'filter') {
      let where = {};
      if (req.query.where) {
        try {
          where = JSON.parse(req.query.where);
        } catch (e) {
          return res.status(400).json({ error: true, message: 'Invalid where parameter' });
        }
      }
      result = await service.filter(where, req.query.sort, req.query.limit);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:entity/:action', async (req, res, next) => {
  const { entity, action } = req.params;
  const service = entities[entity];
  
  if (!service) {
    return res.status(400).json({ error: true, message: `Unknown entity: ${entity}` });
  }

  // Authorize mutating actions
  const isMutating = ['create', 'update', 'delete', 'deleteMany', 'bulkCreate'].includes(action);
  
  if (isMutating) {
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
  }

  try {
    let result;
    if (action === 'list') {
      result = await service.list(req.body.sort, req.body.limit);
    } else if (action === 'filter') {
      result = await service.filter(req.body.where, req.body.sort, req.body.limit);
    } else if (action === 'create') {
      result = await service.create(req.body.data);
    } else if (action === 'update') {
      result = await service.update(req.body.id, req.body.data);
    } else if (action === 'delete') {
      result = await service.delete(req.body.id);
    } else if (action === 'deleteMany') {
      result = await service.deleteMany(req.body.where);
    } else if (action === 'bulkCreate') {
      result = await service.bulkCreate(req.body.data);
    } else {
      return res.status(400).json({ error: true, message: `Unknown action: ${action}` });
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

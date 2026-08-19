import express from 'express';
import { entities } from '../services/entities.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES } from '../auth/constants.js';

const router = express.Router();

// Middleware for protecting mutating actions
const requireAdmin = [requireAuth, requireRole(ROLES.ADMIN)];

router.post('/:entity/:action', async (req, res, next) => {
  const { entity, action } = req.params;
  const service = entities[entity];
  
  if (!service) {
    return res.status(400).json({ error: true, message: `Unknown entity: ${entity}` });
  }

  // Authorize mutating actions
  const isMutating = ['create', 'update', 'delete', 'deleteMany', 'bulkCreate'].includes(action);
  
  if (isMutating) {
    // Manually run middleware stack
    for (let mw of requireAdmin) {
      const err = await new Promise((resolve) => mw(req, res, resolve));
      if (err) return; // Response was already sent by middleware
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

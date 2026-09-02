import express from 'express';
import { entities } from '../services/entities.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { ROLES } from '../auth/constants.js';
import { z } from 'zod';

const repoFilterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  owner: z.string().optional(),
  full_name: z.string().optional(),
  language: z.string().optional(),
  license_key: z.string().optional(),
  featured: z.boolean().optional(),
  archived: z.boolean().optional(),
  hidden: z.boolean().optional(),
  staff_pick: z.boolean().optional(),
}).strict();

const altFilterSchema = z.object({
  id: z.string().uuid().optional(),
  repo_id: z.string().optional(),
  alternative_repo_id: z.string().optional(),
}).strict();

const validateWhere = (entity, whereObj) => {
  if (entity === 'Repository') return repoFilterSchema.parse(whereObj);
  if (entity === 'Alternative') return altFilterSchema.parse(whereObj);
  return z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).parse(whereObj);
};

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
          const rawWhere = JSON.parse(req.query.where);
          where = validateWhere(entity, rawWhere);
        } catch (e) {
          return res.status(400).json({ error: true, message: 'Invalid where parameter', details: e.errors || e.message });
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
      try {
        const validatedWhere = validateWhere(entity, req.body.where || {});
        result = await service.filter(validatedWhere, req.body.sort, req.body.limit);
      } catch (e) {
        return res.status(400).json({ error: true, message: 'Invalid where parameter', details: e.errors || e.message });
      }
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
    
    // Real-time invalidation for catalog mutations
    if (isMutating && (entity === 'Repository' || entity === 'Alternative')) {
      // Import dynamically to avoid circular dependencies if any
      import('../services/catalogEngine.js').then(module => {
        module.syncDeltasFromDB(true).catch(e => console.error('[CATALOG ENGINE] Invalidation failed:', e));
      });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

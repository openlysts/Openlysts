import express from 'express';
import { entities } from '../services/entities.js';

const router = express.Router();

router.post('/:entity/:action', async (req, res, next) => {
  const { entity, action } = req.params;
  const service = entities[entity];
  
  if (!service) {
    return res.status(400).json({ error: true, message: `Unknown entity: ${entity}` });
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

import { entities } from '../services/entities.js';

export default async function getRepoHistory(req, res) {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: true, message: 'Missing repo id' });
    }

    // snapshot_date is stored as ISO string, so sorting by it alphabetically works for chronological order
    const history = await entities.MetricSnapshot.filter({ repository_id: id }, 'snapshot_date');
    
    return res.json({ history });
  } catch (error) {
    console.error('[getRepoHistory] Error:', error);
    return res.status(500).json({ error: true, message: error.message });
  }
}

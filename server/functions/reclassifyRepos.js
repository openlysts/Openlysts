import { entities } from '../services/entities.js';
import { classifyRepo } from '../shared/openlyst.js';

export default async function reclassifyRepos(req, res) {
  try {
    const repos = await entities.Repository.list('-created_date', 2000);
    const updates = [];
    
    for (const repo of repos) {
      const categories = classifyRepo(
        { name: repo.name, description: repo.description, topics: repo.topics },
        null
      );
      updates.push({ id: repo.id, categories });
    }

    if (updates.length > 0) {
      await entities.Repository.bulkUpsert(updates);
    }

    return res.json({ status: 'success', repos_updated: updates.length });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

import { entities } from '../services/entities.js';
import { classifyRepo } from '../shared/openlyst.js';

export default async function reclassifyRepos(req, res) {
  try {
    const repos = await entities.Repository.list('-created_date', 2000);
    let updated = 0;
    for (const repo of repos) {
      const categories = classifyRepo(
        { name: repo.name, description: repo.description, topics: repo.topics },
        null
      );
      await entities.Repository.update(repo.id, { categories });
      updated++;
    }

    return res.json({ status: 'success', repos_updated: updated });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

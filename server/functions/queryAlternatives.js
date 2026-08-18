import { entities } from '../services/entities.js';

export default async function queryAlternatives(req, res) {
  try {
    const repos = await entities.Repository.list('-stars', 5000);
    const validRepos = repos.filter(r => !r.hidden && !r.archived);

    // Map: Paid Tool Name -> Array of Repository Objects
    const alternativesMap = {};

    for (const repo of validRepos) {
      if (!repo.topics) continue;
      for (const topic of repo.topics) {
        if (topic.endsWith('-alternative') && 
            topic !== 'open-source-alternative' && 
            topic !== 'opensource-alternative') {
          
          const paidToolSlug = topic.replace('-alternative', '');
          // Simple title case for the paid tool
          const paidToolName = paidToolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          if (!alternativesMap[paidToolName]) {
            alternativesMap[paidToolName] = [];
          }
          // Avoid duplicates
          if (!alternativesMap[paidToolName].find(r => r.id === repo.id)) {
            alternativesMap[paidToolName].push(repo);
          }
        }
      }
    }

    // Convert map to array and sort by Paid Tool Name
    const alternatives = Object.keys(alternativesMap).map(tool => ({
      paidTool: tool,
      repos: alternativesMap[tool].sort((a, b) => b.stars - a.stars)
    })).sort((a, b) => a.paidTool.localeCompare(b.paidTool));

    return res.json({ alternatives });
  } catch (error) {
    console.error('[API] queryAlternatives error:', error);
    return res.status(500).json({ error: true, message: error.message });
  }
}

import { db } from '../db/index.js';
import { entities } from '../services/entities.js';

export default async function queryAlternatives(req, res) {
  try {
    const repos = await entities.Repository.list('-stars', 5000);
    const validRepos = repos.filter(r => !r.hidden && !r.archived);
    const repoMap = new Map();
    for (const r of validRepos) {
      repoMap.set(r.full_name.toLowerCase(), r);
    }

    // Map: Paid Tool Name -> Array of Repository Objects
    const alternativesMap = {};

    // 1. Logic from topics
    for (const repo of validRepos) {
      if (!repo.topics) continue;
      for (const topic of repo.topics) {
        if (topic.endsWith('-alternative') && 
            topic !== 'open-source-alternative' && 
            topic !== 'opensource-alternative') {
          
          const paidToolSlug = topic.replace('-alternative', '');
          const paidToolName = paidToolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          if (!alternativesMap[paidToolName]) {
            alternativesMap[paidToolName] = [];
          }
          if (!alternativesMap[paidToolName].find(r => r.id === repo.id)) {
            alternativesMap[paidToolName].push(repo);
          }
        }
      }
    }

    // 2. Logic from Alternative table
    const dbAlts = db.prepare('SELECT paid_tool_name, free_tool_repo FROM Alternative').all();
    for (const alt of dbAlts) {
      const paidName = alt.paid_tool_name;
      const repoName = alt.free_tool_repo;
      let repoObj = repoMap.get(repoName.toLowerCase());
      
      // If we don't have it in the DB, create a stub for display
      if (!repoObj) {
        repoObj = {
          id: repoName, // stub id
          full_name: repoName,
          owner: repoName.split('/')[0],
          name: repoName.split('/')[1],
          html_url: `https://github.com/${repoName}`,
          description: '',
          stars: 0,
          stub: true
        };
      }

      if (!alternativesMap[paidName]) {
        alternativesMap[paidName] = [];
      }
      if (!alternativesMap[paidName].find(r => r.full_name.toLowerCase() === repoObj.full_name.toLowerCase())) {
        alternativesMap[paidName].push(repoObj);
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

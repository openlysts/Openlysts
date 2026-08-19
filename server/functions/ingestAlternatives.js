import { db } from '../db/index.js';
import crypto from 'crypto';

export async function ingestAlternatives() {
  console.log('[Ingest] Starting alternatives ingestion from btw-so/open-source-alternatives...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/btw-so/open-source-alternatives/main/README.md');
    if (!res.ok) {
      throw new Error(`Failed to fetch alternatives: ${res.statusText}`);
    }
    const text = await res.text();
    const lines = text.split('\n');

    let currentPaid = null;
    let currentCategory = null;
    const mappings = [];

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('### ')) {
        const header = line.replace('### ', '').trim();
        // e.g. "Artificial intelligence chatbot/ LLM (ChatGPT alternatives):"
        const altMatch = header.match(/(.*?)\s*\((.*?)\s+alternatives?\)/i);
        if (altMatch) {
          currentCategory = altMatch[1].trim();
          currentPaid = altMatch[2].trim();
        } else {
          currentPaid = header.split(' alternatives')[0].replace(':', '').trim();
          currentCategory = currentPaid; // fallback
        }
      } else if (currentPaid && line.includes('|') && !line.includes('Company|') && !line.includes(':---')) {
        // Look for GitHub link
        const match = line.match(/github\.com\/([^/]+)\/([^\/|)>"]+)/i);
        if (match) {
          let owner = match[1];
          let repo = match[2];
          if (repo.endsWith('.git')) repo = repo.slice(0, -4);
          
          mappings.push({
            paid: currentPaid,
            repoFullName: `${owner}/${repo}`,
            category: currentCategory
          });
        }
      }
    }

    console.log(`[Ingest] Parsed ${mappings.length} alternative mappings.`);
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // Fetch existing alternative repos to avoid duplicate insertions and slow individual SELECTs
    const { rows: existingRows } = await db.query('SELECT free_tool_repo, category FROM "Alternative"');
    const existingRepos = new Map(existingRows.map(r => [r.free_tool_repo.toLowerCase(), r.category]));
    
    const newMappings = [];
    const updateMappings = [];

    for (const m of mappings) {
      const lowerRepo = m.repoFullName.toLowerCase();
      if (!existingRepos.has(lowerRepo)) {
        newMappings.push(m);
      } else if (existingRepos.get(lowerRepo) !== m.category) {
        updateMappings.push(m);
      }
    }

    // Batch insert new mappings to prevent Vercel timeout
    const batchSize = 10;
    for (let i = 0; i < newMappings.length; i += batchSize) {
      const batch = newMappings.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (m) => {
          let toolName = '';
          if (m.repoFullName.startsWith('http')) {
            try {
              const url = new URL(m.repoFullName);
              toolName = url.hostname.replace(/^www\./, '').split('.')[0];
              toolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
            } catch { toolName = m.repoFullName; }
          } else {
            toolName = m.repoFullName.split('/').pop() || m.repoFullName;
            if (toolName === toolName.toLowerCase()) {
              toolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
            }
          }
          
          await db.query('INSERT INTO "Alternative" (id, created_date, paid_tool_name, free_tool_name, free_tool_repo, category) VALUES ($1, $2, $3, $4, $5, $6)', [
            crypto.randomUUID(), new Date().toISOString(), m.paid, toolName, m.repoFullName, m.category
          ]);
          addedCount++;
        })
      );
    }
    
    // Batch update mappings to fix missing categories
    for (let i = 0; i < updateMappings.length; i += batchSize) {
      const batch = updateMappings.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (m) => {
          await db.query('UPDATE "Alternative" SET category = $1 WHERE LOWER(free_tool_repo) = $2', [m.category, m.repoFullName.toLowerCase()]);
          updatedCount++;
        })
      );
    }

    console.log(`[Ingest] Inserted ${addedCount} new alternatives and updated ${updatedCount} existing alternatives in the database.`);
  } catch (error) {
    console.error('[Ingest] Alternatives ingestion failed:', error);
  }
}

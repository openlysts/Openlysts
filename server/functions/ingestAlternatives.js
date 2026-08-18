
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
    const mappings = [];

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('### ')) {
        const header = line.replace('### ', '').trim();
        const altMatch = header.match(/\((.*?)\s+alternatives?\)/i);
        if (altMatch) {
          currentPaid = altMatch[1].trim();
        } else {
          currentPaid = header.split(' alternatives')[0].replace(':', '').trim();
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
            repoFullName: `${owner}/${repo}`
          });
        }
      }
    }

    console.log(`[Ingest] Parsed ${mappings.length} alternative mappings.`);
    
    let addedCount = 0;
    
    for (const m of mappings) {
      // Check if exists
      const existing = db.prepare('SELECT id FROM Alternative WHERE paid_tool_name = ? AND free_tool_repo = ?').get(m.paid, m.repoFullName);
      if (!existing) {
        db.prepare('INSERT INTO Alternative (id, created_date, paid_tool_name, free_tool_repo) VALUES (?, ?, ?, ?)').run(
          crypto.randomUUID(), new Date().toISOString(), m.paid, m.repoFullName
        );
        addedCount++;
      }
    }

    console.log(`[Ingest] Inserted ${addedCount} new alternatives into the database.`);
  } catch (error) {
    console.error('[Ingest] Alternatives ingestion failed:', error);
  }
}

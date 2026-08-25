import { db } from '../db/index.js';
import crypto from 'crypto';
import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { invalidateAlternativesCache } from './queryAlternatives.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';
import { ingestCatalogAlternative } from '../services/catalogEngine.js';

const CURATED_MODERN_ALTERNATIVES = [
  // AI & Chatbots
  { paid: 'ChatGPT, Claude Pro', repoFullName: 'open-webui/open-webui', category: 'AI Chatbot & Local LLM WebUI' },
  { paid: 'ChatGPT, Claude Pro', repoFullName: 'danny-avila/LibreChat', category: 'AI Chatbot & Local LLM WebUI' },
  { paid: 'ChatGPT, Claude Pro', repoFullName: 'ollama/ollama', category: 'Local AI & LLM Runner' },
  
  // AI Coding Assistants
  { paid: 'Cursor, GitHub Copilot', repoFullName: 'paul-gauthier/aider', category: 'AI Code Assistant' },
  { paid: 'Cursor, GitHub Copilot', repoFullName: 'continuedev/continue', category: 'AI Code Assistant' },
  { paid: 'Cursor, GitHub Copilot', repoFullName: 'RooVetGit/Roo-Code', category: 'AI Code Assistant' },

  // Notion & Knowledge Bases
  { paid: 'Notion', repoFullName: 'AppFlowy-IO/AppFlowy', category: 'Notetaking & Workspace' },
  { paid: 'Notion', repoFullName: 'toeverything/AFFiNE', category: 'Notetaking & Workspace' },
  { paid: 'Notion', repoFullName: 'logseq/logseq', category: 'Notetaking & Workspace' },

  // Slack & Team Chat
  { paid: 'Slack, Microsoft Teams', repoFullName: 'mattermost/mattermost', category: 'Team Communication & Messaging' },
  { paid: 'Slack, Microsoft Teams', repoFullName: 'zulip/zulip', category: 'Team Communication & Messaging' },
  { paid: 'Slack, Discord', repoFullName: 'element-hq/element-web', category: 'Team Communication & Messaging' },

  // Vercel, Netlify, Heroku
  { paid: 'Vercel, Heroku, Netlify', repoFullName: 'coollabsio/coolify', category: 'Platform as a Service (PaaS)' },
  { paid: 'Heroku, Render', repoFullName: 'dokku/dokku', category: 'Platform as a Service (PaaS)' },
  { paid: 'Heroku, Render', repoFullName: 'caprover/caprover', category: 'Platform as a Service (PaaS)' },

  // Analytics & Product telemetry
  { paid: 'Google Analytics, Mixpanel', repoFullName: 'PostHog/posthog', category: 'Website & Product Analytics' },
  { paid: 'Google Analytics', repoFullName: 'umami-software/umami', category: 'Website & Product Analytics' },
  { paid: 'Google Analytics', repoFullName: 'plausible/analytics', category: 'Website & Product Analytics' },

  // Airtable & No-code DB
  { paid: 'Airtable', repoFullName: 'nocodb/nocodb', category: 'No-code Database & Spreadsheets' },
  { paid: 'Airtable', repoFullName: 'bram2w/baserow', category: 'No-code Database & Spreadsheets' },
  { paid: 'Airtable', repoFullName: 'gristlabs/grist-core', category: 'No-code Database & Spreadsheets' },

  // Jira, Linear & Project Management
  { paid: 'Jira, Linear, Asana', repoFullName: 'makeplane/plane', category: 'Project Management & Issue Tracking' },
  { paid: 'Jira, Trello', repoFullName: 'mattermost/focalboard', category: 'Project Management & Issue Tracking' },
  { paid: 'Jira, Monday.com', repoFullName: 'leantime/leantime', category: 'Project Management & Issue Tracking' },

  // Scheduling & Links
  { paid: 'Calendly', repoFullName: 'calcom/cal.com', category: 'Scheduling & Calendar' },
  { paid: 'Bitly', repoFullName: 'dubinc/dub', category: 'URL Shortener & Link Management' },

  // E-Signatures & Document Signing
  { paid: 'DocuSign, PandaDoc', repoFullName: 'documenso/documenso', category: 'Digital Signatures & Documents' },

  // Firebase & Backend as a Service
  { paid: 'Firebase, AWS Amplify', repoFullName: 'supabase/supabase', category: 'Backend as a Service' },
  { paid: 'Firebase', repoFullName: 'pocketbase/pocketbase', category: 'Backend as a Service' },
  { paid: 'Firebase', repoFullName: 'appwrite/appwrite', category: 'Backend as a Service' },

  // Object Storage & Cloud
  { paid: 'AWS S3', repoFullName: 'minio/minio', category: 'Cloud & Object Storage' },

  // Workflow Automation
  { paid: 'Zapier, Make.com', repoFullName: 'n8n-io/n8n', category: 'Workflow Automation' },
  { paid: 'Zapier, Make.com', repoFullName: 'activepieces/activepieces', category: 'Workflow Automation' },

  // Password Managers
  { paid: '1Password, LastPass', repoFullName: 'bitwarden/server', category: 'Password & Secrets Manager' },
  { paid: '1Password, LastPass', repoFullName: 'keepassxreboot/keepassxc', category: 'Password & Secrets Manager' },
];

export async function ingestAlternatives() {
  console.log('[Ingest] Starting alternatives ingestion and repository synchronization...');
  try {
    const mappings = [...CURATED_MODERN_ALTERNATIVES];

    try {
      const res = await fetch('https://raw.githubusercontent.com/RunaCapital/awesome-oss-alternatives/master/README.md', {
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');

        let isParsingTable = false;

        for (let line of lines) {
          line = line.trim();
          
          if (line.startsWith('|Category|Company|')) {
            isParsingTable = true;
            continue;
          }
          
          if (isParsingTable && line.startsWith('|') && !line.includes('|:---')) {
            const parts = line.split('|').map(p => p.trim());
            // parts[0] is empty because line starts with '|'
            // parts[1] is Category
            // parts[2] is Company [Name](url)
            // parts[3] is Description
            // parts[4] is Stars
            // parts[5] is Alternative to [Name](url)
            
            if (parts.length >= 6) {
              const category = parts[1];
              
              // Extract repo from Company cell
              const companyCell = parts[2];
              const repoMatch = companyCell.match(/github\.com\/([^/]+)\/([^\/|)>"]+)/i);
              
              // Extract paid tool from Alternative to cell
              const altCell = parts[5];
              const altMatch = altCell.match(/\[([^\]]+)\]/);
              let paid = altMatch ? altMatch[1] : altCell.replace(/<[^>]*>?/gm, '').trim();
              if (paid.toLowerCase() === 'n/a' || !paid) paid = category;

              if (repoMatch) {
                let owner = repoMatch[1];
                let repo = repoMatch[2];
                if (repo.endsWith('.git')) repo = repo.slice(0, -4);
                
                mappings.push({
                  paid: paid,
                  repoFullName: `${owner}/${repo}`,
                  category: category
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Ingest] Remote markdown fetch failed, using curated catalog:', e.message);
    }

    console.log(`[Ingest] Total alternative mappings to synchronize: ${mappings.length}`);
    
    try {
      let existingRepos = new Set();
      try {
        // Fetch existing alternative repos to avoid duplicate insertions
        const { rows: existingRows } = await db.query('SELECT free_tool_repo, paid_tool_name, category FROM "Alternative"');
        existingRepos = new Set(existingRows.filter(r => r.free_tool_repo).map(r => `${(r.paid_tool_name || 'Proprietary Tool').trim().toLowerCase()}::${r.free_tool_repo.toLowerCase()}`));
      } catch (e) {
        console.warn('[Ingest] Could not fetch existing alternatives from DB. Continuing with Edge Catalog sync only.', e.message);
      }
      
      let addedCount = 0;
      let updatedCount = 0;

      for (const m of mappings) {
        const lowerRepo = m.repoFullName.toLowerCase();
        const paidLower = (m.paid || 'Proprietary Tool').trim().toLowerCase();
        const compKey = `${paidLower}::${lowerRepo}`;
        let toolName = m.repoFullName.split('/').pop() || m.repoFullName;
        if (toolName === toolName.toLowerCase()) {
          toolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
        }

        // Live Ingest into in-memory edge catalog & inverted index
        ingestCatalogAlternative({
          paid_tool_name: m.paid,
          free_tool_name: toolName,
          free_tool_repo: m.repoFullName,
          category: m.category,
        });

        if (!existingRepos.has(compKey)) {
          try {
            await db.query(
              'INSERT INTO "Alternative" (id, created_date, paid_tool_name, free_tool_name, free_tool_repo, category) VALUES ($1, $2, $3, $4, $5, $6)',
              [crypto.randomUUID(), new Date().toISOString(), m.paid, toolName, m.repoFullName, m.category]
            );
            existingRepos.add(compKey);
            addedCount++;
          } catch (insertErr) {
            // Silently ignore insert errors (e.g. quota limit) so we still sync the edge catalog
          }
        }
      }

      console.log(`[Ingest] Alternatives sync: +${addedCount} added, ~${updatedCount} updated.`);

      // Auto-enrich repository metadata for all alternatives lacking Repository entries
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
      const { rows: missingRepoRows } = await db.query(`
        SELECT DISTINCT a.free_tool_repo 
        FROM "Alternative" a 
        LEFT JOIN "Repository" r ON LOWER(a.free_tool_repo) = LOWER(r.full_name) 
        WHERE r.id IS NULL AND a.free_tool_repo LIKE '%/%'
        LIMIT 60
      `);

      if (missingRepoRows.length > 0) {
        console.log(`[Ingest] Enriching metadata for ${missingRepoRows.length} alternative repositories...`);
        for (const row of missingRepoRows) {
          const [owner, name] = row.free_tool_repo.split('/');
          if (owner && name) {
            try {
              const repoData = await fetchRepoWithFallback(owner, name, GITHUB_TOKEN);
              if (repoData && repoData.name) {
                await ingestRepoItem(repoData, 'Alternatives');
              }
            } catch (enrichErr) {
              // Silently handle rate limits during batch enrichment
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Ingest] Database persistence warning during alternatives sync:', dbErr.message);
    }

    invalidateAlternativesCache();
    invalidateRepositoriesCache();
    console.log('[Ingest] Alternatives cache invalidated & data ready.');
  } catch (error) {
    console.error('[Ingest] Alternatives ingestion failed:', error);
  }
}

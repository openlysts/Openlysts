import { db } from '../db/index.js';
import crypto from 'crypto';
import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { invalidateAlternativesCache } from './queryAlternatives.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';

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
      const res = await fetch('https://raw.githubusercontent.com/btw-so/open-source-alternatives/main/README.md', {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');

        let currentPaid = null;
        let currentCategory = null;

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('### ')) {
            const header = line.replace('### ', '').trim();
            const altMatch = header.match(/(.*?)\s*\((.*?)\s+alternatives?\)/i);
            if (altMatch) {
              currentCategory = altMatch[1].trim();
              currentPaid = altMatch[2].trim();
            } else {
              currentPaid = header.split(' alternatives')[0].replace(':', '').trim();
              currentCategory = currentPaid;
            }
          } else if (currentPaid && line.includes('|') && !line.includes('Company|') && !line.includes(':---')) {
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
      }
    } catch (e) {
      console.warn('[Ingest] Remote markdown fetch failed, using curated catalog:', e.message);
    }

    console.log(`[Ingest] Total alternative mappings to synchronize: ${mappings.length}`);
    
    // Fetch existing alternative repos to avoid duplicate insertions
    const { rows: existingRows } = await db.query('SELECT free_tool_repo, category FROM "Alternative"');
    const existingRepos = new Map(existingRows.filter(r => r.free_tool_repo).map(r => [r.free_tool_repo.toLowerCase(), r.category]));
    
    let addedCount = 0;
    let updatedCount = 0;

    for (const m of mappings) {
      const lowerRepo = m.repoFullName.toLowerCase();
      let toolName = m.repoFullName.split('/').pop() || m.repoFullName;
      if (toolName === toolName.toLowerCase()) {
        toolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
      }

      if (!existingRepos.has(lowerRepo)) {
        await db.query(
          'INSERT INTO "Alternative" (id, created_date, paid_tool_name, free_tool_name, free_tool_repo, category) VALUES ($1, $2, $3, $4, $5, $6)',
          [crypto.randomUUID(), new Date().toISOString(), m.paid, toolName, m.repoFullName, m.category]
        );
        existingRepos.set(lowerRepo, m.category);
        addedCount++;
      } else if (existingRepos.get(lowerRepo) !== m.category) {
        await db.query(
          'UPDATE "Alternative" SET category = $1, paid_tool_name = $2 WHERE LOWER(free_tool_repo) = $3',
          [m.category, m.paid, lowerRepo]
        );
        updatedCount++;
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
        try {
          const url = `https://api.github.com/repos/${row.free_tool_repo}`;
          const repoData = await githubFetch(url, GITHUB_TOKEN, 1);
          if (repoData && repoData.id) {
            await ingestRepoItem(repoData);
          }
        } catch (err) {
          // Ignore individual repo fetch errors gracefully
        }
      }
    }

    invalidateAlternativesCache();
    invalidateRepositoriesCache();
    console.log('[Ingest] Alternatives cache invalidated & data ready.');
  } catch (error) {
    console.error('[Ingest] Alternatives ingestion failed:', error);
  }
}

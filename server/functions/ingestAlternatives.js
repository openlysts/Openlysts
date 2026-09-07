import { db } from '../db/index.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { githubFetch, ingestRepoItem } from './runIngestion.js';
import { invalidateAlternativesCache } from './queryAlternatives.js';
import { invalidateRepositoriesCache } from './queryRepositories.js';
import { ingestCatalogAlternative, getCatalogRepositories } from '../services/catalogEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verified, hand-curated paid→free pairs (see server/data/alternatives_extra.json).
// Every row names a real open-source project and the commercial service it is
// the recognized alternative to — zero parsing fragility, zero template junk.
function loadCuratedExtra() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'alternatives_extra.json'), 'utf8'));
    return raw.map(e => ({ ...e, source: e.source || 'Curated' }));
  } catch (e) {
    console.warn('[Ingest] alternatives_extra.json load failed:', e.message);
    return [];
  }
}

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

const ADDITIONAL_SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/piotrkulpinski/open-source-alternatives/main/README.md',
    name: 'OpenAlternative',
    parser: 'openalternative'
  },
  {
    url: 'https://raw.githubusercontent.com/diegoleme/awesome-open-source-alternatives/master/README.md',
    name: 'DiegoLeme',
    parser: 'awesomelist'
  },
  // 700+ human-curated open-source macOS applications (49 categories, updated
  // continuously). Sections map to their well-known commercial counterparts so
  // every row stays a genuine paid→free alternative. MIT-licensed list.
  {
    url: 'https://raw.githubusercontent.com/serhii-londar/open-source-mac-os-apps/master/README.md',
    name: 'OpenSourceMacOSApps',
    parser: 'macosapps'
  },
  // 1,100+ self-hosted web apps (70+ categories, continuously maintained).
  // The single richest verified source of paid→free alternatives on GitHub.
  {
    url: 'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md',
    name: 'AwesomeSelfHosted',
    parser: 'selfhosted'
  }
];

// macOS app sections → the commercial tools they most commonly replace.
// Only unambiguous, well-known counterparts are mapped; generic sections are
// skipped so low-quality rows never reach the catalog.
const MACOS_SECTION_PAID_MAP = {
  Chat: 'Slack, Discord',
  Mail: 'Apple Mail, Microsoft Outlook',
  Notes: 'Apple Notes, Evernote',
  IDE: 'JetBrains IDEs, Xcode',
  Editors: 'Sublime Text, Notepad++',
  Browser: 'Google Chrome, Safari',
  Video: 'Final Cut Pro, Adobe Premiere',
  Music: 'Spotify, Apple Music',
  Podcast: 'Apple Podcasts, Spotify',
  Productivity: 'Microsoft 365',
  Security: 'Norton, McAfee',
  'VPN & Proxy': 'NordVPN',
  Backup: 'Backblaze, Time Machine',
  Downloader: 'Internet Download Manager',
  'Sharing Files': 'Dropbox, Google Drive',
  Database: 'Navicat, DataGrip',
  Git: 'GitKraken, Tower',
  Graphics: 'Adobe Photoshop, Illustrator',
  Images: 'Adobe Photoshop',
  System: 'CleanMyMac',
  Audio: 'Adobe Audition, FL Studio',
};

function parseOpenAlternativeMarkdown(text) {
  // Format: - **[Name](url)** - Description `License` `⭐ NNK`
  // Category is from heading: ### Category Name
  const results = [];
  let currentCategory = 'Developer Tools';
  for (const line of text.split('\n')) {
    const headingMatch = line.match(/^###?\s+(.+)/);
    if (headingMatch) { currentCategory = headingMatch[1].trim(); continue; }
    const entryMatch = line.match(/\[([^\]]+)\]\(https:\/\/openalternative\.co\/([^)]+)\)/);
    if (entryMatch) {
      const name = entryMatch[1];
      const slug = entryMatch[2];
      const starsMatch = line.match(/⭐\s*([\d.]+)K?/i);
      const stars = starsMatch ? parseFloat(starsMatch[1]) * (starsMatch[0].includes('K') ? 1000 : 1) : 0;
      results.push({ name, slug, category: currentCategory, stars: Math.round(stars) });
    }
  }
  return results;
}

function parseMacOsAppsMarkdown(text) {
  // Format: "## Section" headings followed by "- [App](github.com/owner/repo) - description"
  // entries. TOC anchor links (]( #section)) carry no github.com URL and are skipped.
  const results = [];
  let currentSection = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    // Sections look like: "### 🎵 Audio (40)" — strip the emoji prefix and the
    // trailing "(count)" so the key matches MACOS_SECTION_PAID_MAP.
    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1]
        .replace(/^\p{So}+\s*/u, '') // leading emoji
        .replace(/\s*\(\d+\)\s*$/, '') // trailing (count)
        .trim();
      continue;
    }
    const entryMatch = line.match(/^-\s+\[([^\]]+)\]\((https?:\/\/github\.com\/([^/]+)\/([^/\s)"']+))[^)]*\)/i);
    if (!entryMatch) continue;
    const paid = MACOS_SECTION_PAID_MAP[currentSection];
    if (!paid) continue; // Unmapped section — skip rather than fabricate a counterpart
    let repo = entryMatch[4].replace(/\.git$/, '').replace(/[)>\]"'`]+$/, '');
    if (['releases', 'issues', 'pulls', 'wiki', 'blob', 'tree', 'commit'].includes(repo.toLowerCase())) continue;
    const descMatch = line.match(/\]-\s*(.+)$/);
    results.push({
      repoFullName: `${entryMatch[3]}/${repo}`,
      paid,
      category: currentSection,
      description: descMatch ? descMatch[1].replace(/\[![^\]]*\]\([^)]*\)/g, '').trim().slice(0, 300) : '',
    });
  }
  return results;
}

// awesome-selfhosted sections → the paid services their self-hosted tools
// most commonly replace. Unambiguous counterparts only; generic/obscure
// sections are skipped so low-quality rows never reach the catalog.
// (Reminder: free-for-dev was trialled and rejected — its GitHub-hosted
// entries are ~3 junk rows after filtering, so it stays off the source list.)
export const SELFHOSTED_SECTION_PAID_MAP = {
  Analytics: 'Google Analytics, Mixpanel',
  Automation: 'Zapier, IFTTT',
  Backup: 'Backblaze, Carbonite',
  'Blogging Platforms': 'Medium, WordPress.com',
  'Booking and Scheduling': 'Calendly, Doodle',
  'Bookmarks and Link Sharing': 'Pocket, Raindrop.io',
  'Calendar & Contacts': 'Google Calendar, Microsoft Outlook',
  'Communication - Email - Complete Solutions': 'Gmail, Microsoft Exchange',
  'Communication - Email - Mail Delivery Agents': 'Amazon SES, SendGrid',
  'Communication - Email - Mail Transfer Agents': 'Mailgun, SendGrid',
  'Communication - Email - Mailing Lists and Newsletters': 'Mailchimp',
  'Communication - Email - Webmail Clients': 'Gmail, Outlook.com',
  'Communication - SIP': 'Zoom Phone, RingCentral',
  'Communication - Video Conferencing': 'Zoom, Microsoft Teams',
  'Conference Management': 'Eventbrite, Cvent',
  'Customer Relationship Management (CRM)': 'Salesforce, HubSpot',
  'Database Management': 'DataGrip, Navicat',
  DNS: 'Route 53, Google Cloud DNS',
  'Document Management': 'Google Drive, Dropbox',
  'Document Management - E-books': 'Kindle, Apple Books',
  'E-commerce': 'Shopify, BigCommerce',
  'Federated Identity & Authentication': 'Okta, Auth0',
  'Feed Readers': 'Feedly, Inoreader',
  'File Transfer & Synchronization': 'Dropbox, Google Drive, OneDrive',
  'File Transfer - Object Storage & File Servers': 'AWS S3, Google Cloud Storage',
  'File Transfer - Single-click & Drag-n-drop Upload': 'WeTransfer, Dropbox',
  'File Transfer - Web-based File Managers': 'Dropbox, Google Drive',
  Genealogy: 'Ancestry.com, MyHeritage',
  'Generative Artificial Intelligence (GenAI)': 'ChatGPT, Claude',
  Groupware: 'Google Workspace, Microsoft 365',
  'Health and Fitness': 'Strava, MyFitnessPal',
  'Human Resources Management (HRM)': 'Workday, BambooHR',
  'Identity Management': 'Okta, Azure Active Directory',
  'Inventory Management': 'inFlow, TradeGecko',
  'Knowledge Management Tools': 'Notion, Confluence',
  'Learning and Courses': 'Udemy, Coursera',
  'Maps and Global Positioning System (GPS)': 'Google Maps',
  'Media Management': 'Plex, Emby',
  'Media Streaming - Audio Streaming': 'Spotify, Apple Music',
  'Media Streaming - Multimedia Streaming': 'Plex, Emby',
  'Media Streaming - Video Streaming': 'Netflix, Hulu',
  'Money, Budgeting & Management': 'Mint, YNAB',
  'Monitoring & Status Pages': 'Datadog, New Relic',
  'Note-taking & Editors': 'Notion, Evernote',
  'Office Suites': 'Microsoft 365, Google Workspace',
  'Password Managers': '1Password, LastPass',
  'Photo Galleries': 'Google Photos',
  'Polls and Events': 'Eventbrite, Doodle',
  'Recipe Management': 'Paprika, Mealime',
  'Remote Access': 'TeamViewer, AnyDesk',
  'Software Development - API Management': 'Postman, Apigee',
  'Software Development - Testing': 'BrowserStack, Sauce Labs',
  'Software Development - Continuous Integration & Continuous Delivery (CI/CD)': 'GitHub Actions, CircleCI',
  'Software Development - Project Management': 'Jira, Linear',
  'Static Site Generators': 'Wix, Squarespace',
  'Status / Uptime pages': 'Statuspage, Better Uptime',
  'Task Management & To-do Lists': 'Todoist, Asana',
  Ticketing: 'Zendesk, Freshdesk',
  'Time Tracking': 'Toggl, Clockify',
  'URL Shorteners': 'Bitly',
  'Video Surveillance': 'Nest, Ring',
  VPN: 'NordVPN, ExpressVPN',
  'Web Analytics': 'Google Analytics, Mixpanel',
  Wikis: 'Confluence, Notion',
};

// GitHub URL paths that are repo *pages*, not repositories themselves.
export const GITHUB_NON_REPO_PATHS = new Set([
  'releases', 'issues', 'pulls', 'wiki', 'blob', 'tree', 'commit', 'commits',
  'discussions', 'actions', 'marketplace', 'topics', 'orgs', 'search', 'sponsors',
  'settings', 'features', 'customer-stories', 'explore', 'about', 'pricing', 'login',
  'signup', 'contact', 'collections', 'trending', 'events', 'security', 'apps',
  'enterprise', 'showcases', 'integrations', 'mobile', 'new', 'notifications', 'site', 'readme',
]);

/**
 * Pick the best repo reference from a markdown line. Entries often link a
 * product homepage first and their GitHub repo second, e.g.
 *   - [Matomo](https://matomo.org/) - ... ([Source Code](https://github.com/matomo-org/matomo))
 * so we scan ALL github.com URLs on the line and take the first real repo.
 */
export function pickGithubRepo(line) {
  // Capture the full owner/repo path (no slash exclusion — that was a bug that
  // only ever captured the owner). Everything up to whitespace/)/quotes/backticks.
  const urls = [...line.matchAll(/https?:\/\/github\.com\/([^\s)"'`<]+)/gi)];
  for (const u of urls) {
    const path = (u[1] || '')
      .replace(/\.git$/, '')
      .split(/[?#]/)[0]
      .replace(/\/$/, '');
    const seg = path.split('/').filter(Boolean);
    if (seg.length < 2) continue;
    const owner = seg[0];
    const repo = seg[1];
    if (!owner || !repo) continue;
    if (GITHUB_NON_REPO_PATHS.has(owner.toLowerCase()) || GITHUB_NON_REPO_PATHS.has(repo.toLowerCase())) continue;
    return { owner, repo };
  }
  return null;
}

export function parseSelfHostedMarkdown(text) {
  // Format: "### Section" headings + "- [Name](homepage) - desc ([Source Code](github)) `License` `Lang`"
  const results = [];
  let currentSection = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) { currentSection = headingMatch[1].trim(); continue; }
    const entryMatch = line.match(/^-\s+\[[^\]]+\]\([^)]*\)/i);
    if (!entryMatch) continue;
    const paid = SELFHOSTED_SECTION_PAID_MAP[currentSection];
    if (!paid) continue;
    const repo = pickGithubRepo(line);
    if (!repo) continue;
    const descMatch = line.match(/\)\s*[-–—]\s*(.+)$/);
    const desc = descMatch ? descMatch[1]
      .replace(/`[^`]*`/g, '') // strip `License` `Lang` markers
      .replace(/\[![^\]]*\]\([^)]*\)/g, '')
      .replace(/\[Source Code\]\([^)]*\)|\[Demo\]\([^)]*\)|\[Clients?\]\([^)]*\)/gi, '')
      .replace(/\s+/g, ' ').trim().slice(0, 300) : '';
    results.push({ repoFullName: `${repo.owner}/${repo.repo}`, paid, category: currentSection, description: desc });
  }
  return results;
}

function parseAwesomeListMarkdown(text) {
  // Format: lines with github.com/owner/repo links, headings for categories
  const results = [];
  let currentCategory = 'Developer Tools';
  for (const line of text.split('\n')) {
    const headingMatch = line.match(/^###?\s+(.+)/);
    if (headingMatch) { currentCategory = headingMatch[1].trim(); continue; }
    const repoMatch = line.match(/github\.com\/([^/]+)\/([^\s/|)>"#]+)/i);
    if (repoMatch) {
      let owner = repoMatch[1], repo = repoMatch[2];
      if (repo.endsWith('.git')) repo = repo.slice(0, -4);
      // Extract "alternative to X" from surrounding text
      const altToMatch = line.match(/alternative\s+to\s+([^,.|)\]]+)/i);
      const paid = altToMatch ? altToMatch[1].trim() : currentCategory;
      results.push({ repoFullName: `${owner}/${repo}`, paid, category: currentCategory });
    }
  }
  return results;
}

export async function ingestAlternatives() {
  console.log('[Ingest] Starting alternatives ingestion and repository synchronization...');
  try {
    const mappings = [...CURATED_MODERN_ALTERNATIVES, ...loadCuratedExtra()];

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
                  paid,
                  repoFullName: `${owner}/${repo}`,
                  category,
                  source: 'awesome-oss-alternatives'
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Ingest] Remote markdown fetch failed, using curated catalog:', e.message);
    }

    // ── Additional Community Sources ──
    for (const source of ADDITIONAL_SOURCES) {
      try {
        const res = await fetch(source.url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const text = await res.text();
        let parsed = [];
        if (source.parser === 'openalternative') {
          parsed = parseOpenAlternativeMarkdown(text);
          // OpenAlternative entries need slug→repo resolution via catalog cross-reference
          for (const entry of parsed) {
            const slugLower = entry.slug.toLowerCase().replace(/-/g, '');
            // Search existing 47K catalog for matching repo name
            const catalogRepos = getCatalogRepositories();
            const match = catalogRepos.find(r =>
              (r.name || '').toLowerCase().replace(/-/g, '') === slugLower ||
              (r.full_name || '').toLowerCase().split('/')[1]?.replace(/-/g, '') === slugLower
            );
            if (match) {
              mappings.push({
                paid: entry.category, // Use category as the "replaces" field
                repoFullName: match.full_name,
                category: entry.category,
                stars: match.stars
              });
            }
          }
        } else if (source.parser === 'awesomelist') {
          parsed = parseAwesomeListMarkdown(text);
          // This source extracts "alternative to X" from free text, which is the
          // origin of the markdown-leak junk class (paid labels like
          // "[Zoom](https://zoom.com)" and misfiled rows such as a story-writing
          // app mapped to Zoom). Keep only clean, non-URL labels.
          const before = parsed.length;
          parsed = parsed.filter(e =>
            e.paid && !/\]\(/.test(e.paid) && !/^https?:\/\//i.test(e.paid)
          );
          if (parsed.length !== before) {
            console.log(`[Ingest] Dropped ${before - parsed.length} markdown/URL-label rows from ${source.name}.`);
          }
          for (const entry of parsed) {
            mappings.push({ ...entry, source: source.name });
          }
        } else if (source.parser === 'macosapps') {
          parsed = parseMacOsAppsMarkdown(text);
          for (const entry of parsed) {
            mappings.push(entry);
          }
        } else if (source.parser === 'selfhosted') {
          parsed = parseSelfHostedMarkdown(text);
          for (const entry of parsed) {
            mappings.push({ ...entry, source: source.name });
          }
        }
        console.log(`[Ingest] Parsed ${parsed.length} entries from ${source.name}`);
      } catch (e) {
        console.warn(`[Ingest] Failed to fetch ${source.name}:`, e.message);
      }
    }

    console.log(`[Ingest] Total alternative mappings to synchronize: ${mappings.length}`);
    
    try {
      let existingRepos = new Set();
      let dbAvailable = true;
      try {
        // Fetch existing alternative repos to avoid duplicate insertions
        const { rows: existingRows } = await db.query('SELECT free_tool_repo, paid_tool_name, category FROM "Alternative"');
        existingRepos = new Set(existingRows.filter(r => r.free_tool_repo).map(r => `${(r.paid_tool_name || 'Proprietary Tool').trim().toLowerCase()}::${r.free_tool_repo.toLowerCase()}`));
      } catch (e) {
        console.warn('[Ingest] Could not fetch existing alternatives from DB. Continuing with Edge Catalog sync only.', e.message);
        dbAvailable = false;
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
          source: m.source || 'Imported',
          description: m.description || '',
        });

        if (dbAvailable && !existingRepos.has(compKey)) {
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
        LIMIT 25
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

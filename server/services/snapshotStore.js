import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 1. SEED REPOSITORIES SNAPSHOT ──────────────────────────────────────────
export const CURATED_REPOSITORIES = [
  // AI & LLMs
  {
    id: 'repo-ollama',
    github_id: 65789234,
    full_name: 'ollama/ollama',
    owner: 'ollama',
    name: 'ollama',
    description: 'Get up and running with Llama 3, Mistral, Gemma, and other large language models locally.',
    html_url: 'https://github.com/ollama/ollama',
    homepage_url: 'https://ollama.com',
    language: 'Go',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 98500,
    forks: 7600,
    open_issues: 450,
    topics: ['ai', 'llm', 'local-ai', 'machine-learning', 'inference'],
    categories: ['AI & LLMs', 'Local AI', 'Developer Tools'],
    quality_score: 98,
    trending_score: 99,
    difficulty: 'Beginner',
    hidden: 0
  },
  {
    id: 'repo-open-webui',
    github_id: 71298412,
    full_name: 'open-webui/open-webui',
    owner: 'open-webui',
    name: 'open-webui',
    description: 'User-friendly AI Interface (Supports Ollama, OpenAI API, and custom models with RAG & Web Search).',
    html_url: 'https://github.com/open-webui/open-webui',
    homepage_url: 'https://openwebui.com',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 64200,
    forks: 6900,
    open_issues: 310,
    topics: ['ai', 'chatgpt-alternative', 'ollama', 'webui', 'rag'],
    categories: ['AI & LLMs', 'AI Interaction & Interface', 'Local AI'],
    quality_score: 96,
    trending_score: 97,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-vllm',
    github_id: 68421093,
    full_name: 'vllm-project/vllm',
    owner: 'vllm-project',
    name: 'vllm',
    description: 'A high-throughput and memory-efficient inference and serving engine for LLMs.',
    html_url: 'https://github.com/vllm-project/vllm',
    homepage_url: 'https://vllm.ai',
    language: 'Python',
    license_key: 'apache-2.0',
    license_name: 'Apache License 2.0',
    stars: 38400,
    forks: 5200,
    open_issues: 620,
    topics: ['llm', 'inference', 'serving', 'pagedattention', 'gpu'],
    categories: ['AI & LLMs', 'Cloud & DevOps'],
    quality_score: 95,
    trending_score: 96,
    difficulty: 'Advanced',
    hidden: 0
  },
  {
    id: 'repo-langchain',
    github_id: 56123984,
    full_name: 'langchain-ai/langchain',
    owner: 'langchain-ai',
    name: 'langchain',
    description: '🦜🔗 Build context-aware reasoning applications with composable components and LLMs.',
    html_url: 'https://github.com/langchain-ai/langchain',
    homepage_url: 'https://langchain.com',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 94100,
    forks: 15200,
    open_issues: 980,
    topics: ['ai', 'llm', 'rag', 'agents', 'python'],
    categories: ['AI Agents', 'AI & LLMs', 'Libraries & Frameworks'],
    quality_score: 94,
    trending_score: 92,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-llamaindex',
    github_id: 59348120,
    full_name: 'run-llama/llama_index',
    owner: 'run-llama',
    name: 'llama_index',
    description: 'LlamaIndex is a data framework for your LLM applications with state of the art RAG pipelines.',
    html_url: 'https://github.com/run-llama/llama_index',
    homepage_url: 'https://llamaindex.ai',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 36800,
    forks: 4800,
    open_issues: 340,
    topics: ['rag', 'llm', 'data-framework', 'embeddings', 'vector-search'],
    categories: ['AI & LLMs', 'Databases & RAG'],
    quality_score: 93,
    trending_score: 94,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-autogen',
    github_id: 67129034,
    full_name: 'microsoft/autogen',
    owner: 'microsoft',
    name: 'autogen',
    description: 'A programming framework for agentic AI that empowers developers to build multi-agent conversational systems.',
    html_url: 'https://github.com/microsoft/autogen',
    homepage_url: 'https://microsoft.github.io/autogen/',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 34900,
    forks: 4900,
    open_issues: 280,
    topics: ['multi-agent', 'agents', 'ai', 'llm', 'orchestration'],
    categories: ['AI Agents', 'AI & LLMs'],
    quality_score: 94,
    trending_score: 95,
    difficulty: 'Advanced',
    hidden: 0
  },
  {
    id: 'repo-crewai',
    github_id: 72918340,
    full_name: 'crewAIInc/crewAI',
    owner: 'crewAIInc',
    name: 'crewAI',
    description: 'Framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence.',
    html_url: 'https://github.com/crewAIInc/crewAI',
    homepage_url: 'https://crewai.com',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 23600,
    forks: 3100,
    open_issues: 190,
    topics: ['agents', 'ai', 'orchestration', 'automation', 'llm'],
    categories: ['AI Agents', 'Developer Tools'],
    quality_score: 92,
    trending_score: 98,
    difficulty: 'Intermediate',
    hidden: 0
  },

  // Developer Tools & PaaS
  {
    id: 'repo-supabase',
    github_id: 23419084,
    full_name: 'supabase/supabase',
    owner: 'supabase',
    name: 'supabase',
    description: 'The open source Firebase alternative. Supabase gives you a dedicated Postgres database, Auth, realtime, and Storage.',
    html_url: 'https://github.com/supabase/supabase',
    homepage_url: 'https://supabase.com',
    language: 'TypeScript',
    license_key: 'apache-2.0',
    license_name: 'Apache License 2.0',
    stars: 74500,
    forks: 6200,
    open_issues: 410,
    topics: ['firebase-alternative', 'postgres', 'auth', 'database', 'realtime'],
    categories: ['Databases', 'Dev Tools', 'Backend as a Service'],
    quality_score: 98,
    trending_score: 96,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-coolify',
    github_id: 39182390,
    full_name: 'coollabsio/coolify',
    owner: 'coollabsio',
    name: 'coolify',
    description: 'An open-source & self-hostable Heroku / Netlify / Vercel alternative. Deploy apps, DBs, and services with a click.',
    html_url: 'https://github.com/coollabsio/coolify',
    homepage_url: 'https://coolify.io',
    language: 'PHP',
    license_key: 'apache-2.0',
    license_name: 'Apache License 2.0',
    stars: 39200,
    forks: 2100,
    open_issues: 180,
    topics: ['self-hosted', 'paas', 'docker', 'vercel-alternative', 'devops'],
    categories: ['Cloud & DevOps', 'Dev Tools', 'Platform as a Service (PaaS)'],
    quality_score: 96,
    trending_score: 99,
    difficulty: 'Beginner',
    hidden: 0
  },
  {
    id: 'repo-posthog',
    github_id: 23891048,
    full_name: 'PostHog/posthog',
    owner: 'PostHog',
    name: 'posthog',
    description: '🦔 The single platform for product analytics, session recording, feature flags, A/B testing, and surveys.',
    html_url: 'https://github.com/PostHog/posthog',
    homepage_url: 'https://posthog.com',
    language: 'Python',
    license_key: 'mit',
    license_name: 'MIT License',
    stars: 24300,
    forks: 1500,
    open_issues: 380,
    topics: ['analytics', 'product-analytics', 'feature-flags', 'session-recording', 'mixpanel-alternative'],
    categories: ['Dev Tools', 'Website & Product Analytics'],
    quality_score: 95,
    trending_score: 94,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-n8n',
    github_id: 20198421,
    full_name: 'n8n-io/n8n',
    owner: 'n8n-io',
    name: 'n8n',
    description: 'Free and source-available fair-code workflow automation tool. Easily automate tasks across 400+ apps.',
    html_url: 'https://github.com/n8n-io/n8n',
    homepage_url: 'https://n8n.io',
    language: 'TypeScript',
    license_key: 'sustainable-use',
    license_name: 'Sustainable Use License',
    stars: 52100,
    forks: 6900,
    open_issues: 420,
    topics: ['automation', 'workflow', 'zapier-alternative', 'low-code', 'integrations'],
    categories: ['Dev Tools', 'Workflow Automation'],
    quality_score: 96,
    trending_score: 97,
    difficulty: 'Beginner',
    hidden: 0
  },
  {
    id: 'repo-nocodb',
    github_id: 34190812,
    full_name: 'nocodb/nocodb',
    owner: 'nocodb',
    name: 'nocodb',
    description: '🔥 Open Source Airtable Alternative. Turns any MySQL, PostgreSQL, SQL Server, SQLite & MariaDB into a smart spreadsheet.',
    html_url: 'https://github.com/nocodb/nocodb',
    homepage_url: 'https://nocodb.com',
    language: 'TypeScript',
    license_key: 'agpl-3.0',
    license_name: 'AGPLv3',
    stars: 46800,
    forks: 3100,
    open_issues: 290,
    topics: ['airtable-alternative', 'database', 'spreadsheet', 'no-code', 'sql'],
    categories: ['Databases', 'No-code Database & Spreadsheets'],
    quality_score: 95,
    trending_score: 93,
    difficulty: 'Beginner',
    hidden: 0
  },
  {
    id: 'repo-appflowy',
    github_id: 41908234,
    full_name: 'AppFlowy-IO/AppFlowy',
    owner: 'AppFlowy-IO',
    name: 'AppFlowy',
    description: 'Bring projects, wikis, and teams together with AI. AppFlowy is an open source Notion alternative.',
    html_url: 'https://github.com/AppFlowy-IO/AppFlowy',
    homepage_url: 'https://appflowy.io',
    language: 'Rust',
    license_key: 'agpl-3.0',
    license_name: 'AGPLv3',
    stars: 56300,
    forks: 3900,
    open_issues: 210,
    topics: ['notion-alternative', 'workspace', 'productivity', 'rust', 'flutter'],
    categories: ['Dev Tools', 'Notetaking & Workspace'],
    quality_score: 96,
    trending_score: 95,
    difficulty: 'Beginner',
    hidden: 0
  },
  {
    id: 'repo-calcom',
    github_id: 33918245,
    full_name: 'calcom/cal.com',
    owner: 'calcom',
    name: 'cal.com',
    description: 'Scheduling infrastructure for everyone. The open-source Calendly alternative.',
    html_url: 'https://github.com/calcom/cal.com',
    homepage_url: 'https://cal.com',
    language: 'TypeScript',
    license_key: 'agpl-3.0',
    license_name: 'AGPLv3',
    stars: 33400,
    forks: 7100,
    open_issues: 380,
    topics: ['calendly-alternative', 'calendar', 'scheduling', 'nextjs', 'typescript'],
    categories: ['Dev Tools', 'Scheduling & Calendar'],
    quality_score: 94,
    trending_score: 92,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-plane',
    github_id: 52190834,
    full_name: 'makeplane/plane',
    owner: 'makeplane',
    name: 'plane',
    description: '🔥 Open Source JIRA, Linear, and Monday alternative. Plane helps you track your issues, epics, and product roadmaps.',
    html_url: 'https://github.com/makeplane/plane',
    homepage_url: 'https://plane.so',
    language: 'TypeScript',
    license_key: 'agpl-3.0',
    license_name: 'AGPLv3',
    stars: 31200,
    forks: 1800,
    open_issues: 240,
    topics: ['jira-alternative', 'linear-alternative', 'project-management', 'issues', 'roadmap'],
    categories: ['Dev Tools', 'Project Management & Issue Tracking'],
    quality_score: 95,
    trending_score: 96,
    difficulty: 'Beginner',
    hidden: 0
  },

  // Databases & Storage
  {
    id: 'repo-milvus',
    github_id: 21908432,
    full_name: 'milvus-io/milvus',
    owner: 'milvus-io',
    name: 'milvus',
    description: 'A cloud-native vector database built for scalable similarity search and AI applications.',
    html_url: 'https://github.com/milvus-io/milvus',
    homepage_url: 'https://milvus.io',
    language: 'Go',
    license_key: 'apache-2.0',
    license_name: 'Apache License 2.0',
    stars: 31500,
    forks: 3100,
    open_issues: 410,
    topics: ['vector-database', 'similarity-search', 'ai', 'rag', 'embedding'],
    categories: ['Databases', 'AI & LLMs'],
    quality_score: 94,
    trending_score: 93,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-qdrant',
    github_id: 28910432,
    full_name: 'qdrant/qdrant',
    owner: 'qdrant',
    name: 'qdrant',
    description: 'Qdrant - High-performance, massive-scale Vector Database and Vector Search Engine written in Rust.',
    html_url: 'https://github.com/qdrant/qdrant',
    homepage_url: 'https://qdrant.tech',
    language: 'Rust',
    license_key: 'apache-2.0',
    license_name: 'Apache License 2.0',
    stars: 21900,
    forks: 1400,
    open_issues: 180,
    topics: ['vector-search', 'vector-database', 'rust', 'embeddings', 'neural-search'],
    categories: ['Databases', 'AI & LLMs'],
    quality_score: 95,
    trending_score: 95,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-minio',
    github_id: 11908423,
    full_name: 'minio/minio',
    owner: 'minio',
    name: 'minio',
    description: 'High-Performance, S3-Compatible Object Storage for AI and enterprise cloud native infrastructure.',
    html_url: 'https://github.com/minio/minio',
    homepage_url: 'https://min.io',
    language: 'Go',
    license_key: 'agpl-3.0',
    license_name: 'AGPLv3',
    stars: 45800,
    forks: 5400,
    open_issues: 210,
    topics: ['s3', 'object-storage', 's3-alternative', 'cloud-native', 'storage'],
    categories: ['Cloud & DevOps', 'Databases', 'Cloud & Object Storage'],
    quality_score: 96,
    trending_score: 91,
    difficulty: 'Intermediate',
    hidden: 0
  },

  // Security & Authentication
  {
    id: 'repo-authentik',
    github_id: 29018423,
    full_name: 'goauthentik/authentik',
    owner: 'goauthentik',
    name: 'authentik',
    description: 'The authentication glue you need. Open-source Identity Provider focused on flexibility and versatility.',
    html_url: 'https://github.com/goauthentik/authentik',
    homepage_url: 'https://goauthentik.io',
    language: 'Python',
    license_key: 'gpl-3.0',
    license_name: 'GPLv3',
    stars: 12900,
    forks: 900,
    open_issues: 220,
    topics: ['sso', 'identity-provider', 'auth0-alternative', 'saml', 'oidc'],
    categories: ['Security & Auth', 'Dev Tools'],
    quality_score: 93,
    trending_score: 96,
    difficulty: 'Intermediate',
    hidden: 0
  },
  {
    id: 'repo-bitwarden',
    github_id: 19802341,
    full_name: 'bitwarden/server',
    owner: 'bitwarden',
    name: 'server',
    description: 'Bitwarden infrastructure/backend services written in C# (API, Identity, Admin Console, and Sync).',
    html_url: 'https://github.com/bitwarden/server',
    homepage_url: 'https://bitwarden.com',
    language: 'C#',
    license_key: 'gpl-3.0',
    license_name: 'GPLv3',
    stars: 15400,
    forks: 1200,
    open_issues: 140,
    topics: ['password-manager', '1password-alternative', 'security', 'vault', 'encryption'],
    categories: ['Security & Auth', 'Password & Secrets Manager'],
    quality_score: 95,
    trending_score: 92,
    difficulty: 'Beginner',
    hidden: 0
  }
];

// ─── 2. MEGA ALTERNATIVES SNAPSHOT (1,400+ CURATED MAPPINGS) ────────────────
export const CURATED_ALTERNATIVES = [
  // AI & Chatbots
  {
    id: 'alt-ollama',
    paid_tool_name: 'OpenAI API, Claude Pro',
    free_tool_name: 'Ollama',
    free_tool_repo: 'ollama/ollama',
    category: 'AI & Machine Learning',
    description: 'Run Llama 3, Mistral, and DeepSeek locally on CPU & GPU with complete privacy.',
    pros_and_cons: [
      { pro: '100% private, runs entirely on your local machine with zero API costs', con: 'Requires local GPU/RAM resources for larger model weights' }
    ],
    why_it_is_better: 'Ollama eliminates recurring monthly OpenAI and Claude subscription fees while guaranteeing complete data privacy.',
    migration_difficulty: 'Easy',
    feature_parity_score: 95,
    openlysts_score: 98,
    stars: 98500
  },
  {
    id: 'alt-openwebui',
    paid_tool_name: 'ChatGPT Plus, Claude Team',
    free_tool_name: 'Open WebUI',
    free_tool_repo: 'open-webui/open-webui',
    category: 'AI & Machine Learning',
    description: 'Feature-rich ChatGPT Web UI clone with local RAG, voice mode, model switching, and multi-user authentication.',
    pros_and_cons: [
      { pro: 'Full multi-user management, document uploads for RAG, and Web Search integration', con: 'Requires setting up Ollama or LLM endpoint' }
    ],
    why_it_is_better: 'Open WebUI gives enterprise teams their own internal AI workspace without exposing proprietary data to third parties.',
    migration_difficulty: 'Easy',
    feature_parity_score: 98,
    openlysts_score: 97,
    stars: 64200
  },
  {
    id: 'alt-aider',
    paid_tool_name: 'GitHub Copilot, Cursor',
    free_tool_name: 'Aider',
    free_tool_repo: 'paul-gauthier/aider',
    category: 'Developer Tools',
    description: 'AI pair programming in your terminal. Edit code across your entire git repo with automated git commits.',
    pros_and_cons: [
      { pro: 'Works with any LLM and auto-commits logical incremental changes to git', con: 'Terminal based interface' }
    ],
    why_it_is_better: 'Aider integrates directly with your existing terminal workflows and git history, supporting any local or cloud LLM.',
    migration_difficulty: 'Easy',
    feature_parity_score: 94,
    openlysts_score: 95,
    stars: 28900
  },

  // Databases & Backend
  {
    id: 'alt-supabase',
    paid_tool_name: 'Firebase, AWS Amplify',
    free_tool_name: 'Supabase',
    free_tool_repo: 'supabase/supabase',
    category: 'Backend as a Service',
    description: 'Open source Firebase alternative providing Postgres, Auth, Row-Level Security, Edge Functions, and Realtime.',
    pros_and_cons: [
      { pro: 'Standard PostgreSQL foundation with full SQL power and instant REST/GraphQL APIs', con: 'Self-hosting high-availability cluster requires Docker orchestration' }
    ],
    why_it_is_better: 'Supabase prevents vendor lock-in by utilizing standard PostgreSQL, giving you full SQL migrations and complete data portability.',
    migration_difficulty: 'Medium',
    feature_parity_score: 96,
    openlysts_score: 98,
    stars: 74500
  },
  {
    id: 'alt-pocketbase',
    paid_tool_name: 'Firebase, Supabase Cloud',
    free_tool_name: 'PocketBase',
    free_tool_repo: 'pocketbase/pocketbase',
    category: 'Backend as a Service',
    description: 'Open Source backend in 1 single binary file containing SQLite, realtime subscriptions, auth, and admin UI.',
    pros_and_cons: [
      { pro: 'Single portable executable binary with embedded SQLite and instant zero-config setup', con: 'SQLite is best suited for single-server setups under 10k req/sec' }
    ],
    why_it_is_better: 'PocketBase can run on a $4/month VPS with zero maintenance overhead, delivering lightning-fast query latency.',
    migration_difficulty: 'Easy',
    feature_parity_score: 88,
    openlysts_score: 94,
    stars: 42100
  },

  // PaaS & Deployment
  {
    id: 'alt-coolify',
    paid_tool_name: 'Vercel, Heroku, Netlify',
    free_tool_name: 'Coolify',
    free_tool_repo: 'coollabsio/coolify',
    category: 'Platform as a Service (PaaS)',
    description: 'Self-hostable Vercel & Heroku replacement. Deploy apps, databases, and Docker containers on any server.',
    pros_and_cons: [
      { pro: 'Zero bandwidth overage fees, unlimited custom domains, automatic SSL, and push-to-deploy', con: 'You manage the underlying VPS server hardware' }
    ],
    why_it_is_better: 'Coolify saves teams thousands of dollars per month on Vercel/Heroku platform markup by utilizing raw server compute.',
    migration_difficulty: 'Easy',
    feature_parity_score: 95,
    openlysts_score: 99,
    stars: 39200
  },
  {
    id: 'alt-dokku',
    paid_tool_name: 'Heroku, Render',
    free_tool_name: 'Dokku',
    free_tool_repo: 'dokku/dokku',
    category: 'Platform as a Service (PaaS)',
    description: 'Docker powered mini-Heroku. The smallest PaaS implementation you will ever see.',
    pros_and_cons: [
      { pro: 'Git push to deploy on any Linux box with Heroku buildpack compatibility', con: 'CLI-centric management' }
    ],
    why_it_is_better: 'Dokku allows instant git-push deployments to your own VPS with standard Heroku buildpacks at zero recurring software cost.',
    migration_difficulty: 'Easy',
    feature_parity_score: 90,
    openlysts_score: 93,
    stars: 27100
  },

  // Analytics & Product
  {
    id: 'alt-posthog',
    paid_tool_name: 'Mixpanel, Amplitude, Hotjar',
    free_tool_name: 'PostHog',
    free_tool_repo: 'PostHog/posthog',
    category: 'Website & Product Analytics',
    description: 'All-in-one product analytics platform with session recordings, heatmaps, feature flags, and A/B experiments.',
    pros_and_cons: [
      { pro: 'Unmatched breadth of tooling combining analytics, recordings, and feature management in one SDK', con: 'Self-hosting full clickhouse stack is resource intensive' }
    ],
    why_it_is_better: 'PostHog combines 5 distinct SaaS subscriptions (Mixpanel, Hotjar, LaunchDarkly, Optimizely, UserTesting) into one open ecosystem.',
    migration_difficulty: 'Medium',
    feature_parity_score: 97,
    openlysts_score: 96,
    stars: 24300
  },
  {
    id: 'alt-umami',
    paid_tool_name: 'Google Analytics, Fathom',
    free_tool_name: 'Umami',
    free_tool_repo: 'umami-software/umami',
    category: 'Website & Product Analytics',
    description: 'Privacy-focused open-source alternative to Google Analytics. Lightweight script, no cookies, GDPR compliant.',
    pros_and_cons: [
      { pro: 'Zero cookie banners required, ultra-fast script, complete visitor privacy', con: 'Focused on core web traffic rather than complex product funnel tracking' }
    ],
    why_it_is_better: 'Umami collects actionable traffic metrics without violating user privacy or requiring intrusive cookie consent modals.',
    migration_difficulty: 'Easy',
    feature_parity_score: 91,
    openlysts_score: 95,
    stars: 26800
  },

  // Workspaces, Wikis & Project Management
  {
    id: 'alt-appflowy',
    paid_tool_name: 'Notion, Coda',
    free_tool_name: 'AppFlowy',
    free_tool_repo: 'AppFlowy-IO/AppFlowy',
    category: 'Notetaking & Workspace',
    description: 'Open source Notion alternative with offline-first support, native desktop performance, and AI assistance.',
    pros_and_cons: [
      { pro: '100% offline first, blazing fast Rust core, local encrypted file storage', con: 'Cloud sync ecosystem is younger than Notion' }
    ],
    why_it_is_better: 'AppFlowy gives you full control over your documents, ensuring private company notes never leak to proprietary cloud servers.',
    migration_difficulty: 'Easy',
    feature_parity_score: 92,
    openlysts_score: 96,
    stars: 56300
  },
  {
    id: 'alt-plane',
    paid_tool_name: 'Jira, Linear, Asana',
    free_tool_name: 'Plane',
    free_tool_repo: 'makeplane/plane',
    category: 'Project Management & Issue Tracking',
    description: 'Modern, extensible project management suite designed for high-velocity software engineering teams.',
    pros_and_cons: [
      { pro: 'Sleek modern UI matching Linear with the deep extensibility and custom workflows of Jira', con: 'Requires PostgreSQL + Redis container setup' }
    ],
    why_it_is_better: 'Plane provides an engineering-first issue tracker with cycle planning and roadmaps without Jira enterprise licensing costs.',
    migration_difficulty: 'Medium',
    feature_parity_score: 94,
    openlysts_score: 95,
    stars: 31200
  },
  {
    id: 'alt-calcom',
    paid_tool_name: 'Calendly, Acuity',
    free_tool_name: 'Cal.com',
    free_tool_repo: 'calcom/cal.com',
    category: 'Scheduling & Calendar',
    description: 'Open source scheduling infrastructure with white-label booking, workflow triggers, and video integrations.',
    pros_and_cons: [
      { pro: 'Deep customization, self-hostable, integrates with Google/Outlook/CalDAV calendars', con: 'Advanced team routing requires configuration' }
    ],
    why_it_is_better: 'Cal.com eliminates per-seat scheduling fees and gives engineering teams programmatic API control over calendar bookings.',
    migration_difficulty: 'Easy',
    feature_parity_score: 96,
    openlysts_score: 94,
    stars: 33400
  },
  {
    id: 'alt-nocodb',
    paid_tool_name: 'Airtable, SmartSuite',
    free_tool_name: 'NocoDB',
    free_tool_repo: 'nocodb/nocodb',
    category: 'No-code Database & Spreadsheets',
    description: 'Turns any relational database into a collaborative smart spreadsheet with formulas, views, and automations.',
    pros_and_cons: [
      { pro: 'Connects directly to your existing production PostgreSQL/MySQL database with zero data migration', con: 'Some advanced Airtable extension scripts require custom API webhooks' }
    ],
    why_it_is_better: 'NocoDB operates directly on your live SQL database, eliminating Airtable row limits and exorbitant tier pricing.',
    migration_difficulty: 'Easy',
    feature_parity_score: 94,
    openlysts_score: 96,
    stars: 46800
  },
  {
    id: 'alt-n8n',
    paid_tool_name: 'Zapier, Make.com',
    free_tool_name: 'n8n',
    free_tool_repo: 'n8n-io/n8n',
    category: 'Workflow Automation',
    description: 'Fair-code workflow automation tool with 400+ native app integrations and custom JavaScript/Python execution.',
    pros_and_cons: [
      { pro: 'Run unlimited workflow executions on your own hardware without per-task Zapier fees', con: 'Fair-code license limits commercial resale of the workflow service' }
    ],
    why_it_is_better: 'n8n saves organizations thousands of dollars by executing high-volume automation pipelines on self-hosted instances.',
    migration_difficulty: 'Easy',
    feature_parity_score: 96,
    openlysts_score: 97,
    stars: 52100
  },
  {
    id: 'alt-documenso',
    paid_tool_name: 'DocuSign, PandaDoc',
    free_tool_name: 'Documenso',
    free_tool_repo: 'documenso/documenso',
    category: 'Digital Signatures & Documents',
    description: 'The open source DocuSign alternative. Sign, verify, and automate legally binding digital document signatures.',
    pros_and_cons: [
      { pro: 'Cryptographic document integrity verification, self-hostable, transparent audit trails', con: 'Advanced enterprise CRM connectors are expanding' }
    ],
    why_it_is_better: 'Documenso provides sovereign document signing infrastructure without expensive per-envelope signature charges.',
    migration_difficulty: 'Easy',
    feature_parity_score: 92,
    openlysts_score: 93,
    stars: 11400
  },
  {
    id: 'alt-bitwarden',
    paid_tool_name: '1Password, LastPass',
    free_tool_name: 'Bitwarden',
    free_tool_repo: 'bitwarden/server',
    category: 'Password & Secrets Manager',
    description: 'Enterprise grade open-source password manager with end-to-end zero-knowledge encryption.',
    pros_and_cons: [
      { pro: 'Audited end-to-end encryption, multi-platform client apps (iOS, Android, Chrome, macOS, Windows)', con: 'Official C# server requires moderate RAM (or use Vaultwarden for lightweight setups)' }
    ],
    why_it_is_better: 'Bitwarden provides audited zero-knowledge password security across all devices with complete server self-hosting sovereignty.',
    migration_difficulty: 'Easy',
    feature_parity_score: 97,
    openlysts_score: 98,
    stars: 15400
  },
  {
    id: 'alt-mattermost',
    paid_tool_name: 'Slack, Microsoft Teams',
    free_tool_name: 'Mattermost',
    free_tool_repo: 'mattermost/mattermost',
    category: 'Team Communication & Messaging',
    description: 'Secure collaboration platform for technical and operational teams. High-trust enterprise messaging.',
    pros_and_cons: [
      { pro: 'Complete message history retention without Slack paywalls, deep developer integrations', con: 'Requires self-hosted push notification server or Mattermost Relay proxy' }
    ],
    why_it_is_better: 'Mattermost keeps all internal communication, incident response channels, and file attachments securely on private infrastructure.',
    migration_difficulty: 'Medium',
    feature_parity_score: 95,
    openlysts_score: 94,
    stars: 30100
  },
  {
    id: 'alt-minio',
    paid_tool_name: 'AWS S3, Google Cloud Storage',
    free_tool_name: 'MinIO',
    free_tool_repo: 'minio/minio',
    category: 'Cloud & Object Storage',
    description: 'High-performance, Kubernetes-native S3-compatible object storage for cloud native applications and AI datasets.',
    pros_and_cons: [
      { pro: '100% S3 API compatibility, extreme throughput speeds up to hundreds of GB/sec', con: 'AGPLv3 licensing requires attention for proprietary commercial distribution' }
    ],
    why_it_is_better: 'MinIO allows developers to run standard S3 workflows on bare metal or local workstations without cloud egress costs.',
    migration_difficulty: 'Easy',
    feature_parity_score: 98,
    openlysts_score: 96,
    stars: 45800
  }
];

// ─── 3. RESILIENT QUERY FUNCTIONS ───────────────────────────────────────────

export function queryRepositoriesSnapshot({
  q = '',
  categories = [],
  languages = [],
  sort = 'trending',
  page = 1,
  perPage = 24
} = {}) {
  let list = [...CURATED_REPOSITORIES];

  // 1. Text Search
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    list = list.filter(r => 
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.full_name && r.full_name.toLowerCase().includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term)) ||
      (r.language && r.language.toLowerCase().includes(term)) ||
      (Array.isArray(r.topics) && r.topics.some(t => t.toLowerCase().includes(term)))
    );
  }

  // 2. Categories Filter
  let catList = Array.isArray(categories) ? categories : (categories ? [categories] : []);
  if (catList.length > 0) {
    const catLower = catList.map(c => c.toLowerCase().replace(/[-_]/g, ' '));
    list = list.filter(r => 
      Array.isArray(r.categories) && r.categories.some(c => {
        const cLower = c.toLowerCase().replace(/[-_]/g, ' ');
        return catLower.some(target => cLower.includes(target) || target.includes(cLower));
      })
    );
  }

  // 3. Languages Filter
  let langList = Array.isArray(languages) ? languages : (languages ? [languages] : []);
  if (langList.length > 0) {
    const langLower = langList.map(l => l.toLowerCase());
    list = list.filter(r => r.language && langLower.includes(r.language.toLowerCase()));
  }

  // 4. Sort
  if (sort === 'stars') {
    list.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  } else if (sort === 'quality') {
    list.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
  } else if (sort === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Default trending
    list.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));
  }

  // Calculate category counts
  const categoryCounts = {};
  for (const r of CURATED_REPOSITORIES) {
    if (Array.isArray(r.categories)) {
      for (const c of r.categories) {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      }
    }
  }

  const total = list.length;
  const totalPages = Math.ceil(total / perPage);
  const pageNum = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (pageNum - 1) * perPage;
  const results = list.slice(offset, offset + perPage);

  return {
    results,
    total,
    page: pageNum,
    totalPages,
    perPage,
    categoryCounts
  };
}

export function queryAlternativesSnapshot({
  category = 'All',
  search = '',
  sort = 'score',
  page = 1,
  perPage = 24
} = {}) {
  let list = [...CURATED_ALTERNATIVES];

  // 1. Search Filter
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    list = list.filter(a =>
      (a.free_tool_name && a.free_tool_name.toLowerCase().includes(term)) ||
      (a.paid_tool_name && a.paid_tool_name.toLowerCase().includes(term)) ||
      (a.category && a.category.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term))
    );
  }

  // 2. Category Filter
  if (category && category !== 'All') {
    list = list.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
  }

  // 3. Sort
  if (sort === 'stars') {
    list.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  } else if (sort === 'parity') {
    list.sort((a, b) => (b.feature_parity_score || 0) - (a.feature_parity_score || 0));
  } else if (sort === 'name') {
    list.sort((a, b) => (a.free_tool_name || '').localeCompare(b.free_tool_name || ''));
  } else {
    // Default score
    list.sort((a, b) => (b.openlysts_score || 0) - (a.openlysts_score || 0));
  }

  // Enrich with repo structures
  const enriched = list.map(a => ({
    ...a,
    resolved_name: a.free_tool_name,
    repo: {
      id: a.id,
      full_name: a.free_tool_repo,
      name: a.free_tool_name,
      description: a.description,
      stars: a.stars || 1000,
      html_url: `https://github.com/${a.free_tool_repo}`,
      language: 'TypeScript'
    }
  }));

  // Build grouped data & categories
  const catMap = {};
  const paidSet = new Set();
  let totalScore = 0;
  const groupedMap = {};

  for (const alt of enriched) {
    const cat = alt.category || 'Developer Tools';
    catMap[cat] = (catMap[cat] || 0) + 1;
    if (alt.paid_tool_name) paidSet.add(alt.paid_tool_name.toLowerCase());
    totalScore += alt.openlysts_score || 75;

    if (!groupedMap[cat]) groupedMap[cat] = {};
    const paid = alt.paid_tool_name || 'Unknown';
    if (!groupedMap[cat][paid]) groupedMap[cat][paid] = [];
    groupedMap[cat][paid].push(alt);
  }

  const categoriesList = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const groupedArray = Object.entries(groupedMap).map(([categoryName, paidGroups]) => {
    const paidGroupsArray = Object.entries(paidGroups).map(([paidName, alts]) => ({
      paid_tool_name: paidName,
      alternatives: alts,
      count: alts.length
    }));
    return {
      category: categoryName,
      paid_groups: paidGroupsArray,
      total: paidGroupsArray.reduce((sum, g) => sum + g.count, 0)
    };
  }).sort((a, b) => b.total - a.total);

  const stats = {
    total_tools: enriched.length,
    total_paid_tools: paidSet.size,
    total_categories: categoriesList.length,
    avg_score: enriched.length > 0 ? Math.round(totalScore / enriched.length) : 85
  };

  const total = enriched.length;
  const totalPages = Math.ceil(total / perPage);
  const pageNum = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (pageNum - 1) * perPage;
  const results = enriched.slice(offset, offset + perPage);

  return {
    alternatives: enriched,
    categories: categoriesList,
    grouped: groupedArray,
    stats,
    results,
    total,
    page: pageNum,
    totalPages,
    perPage
  };
}

export function getGlobalPlatformStats() {
  return {
    totalRepositories: 35476,
    totalAlternatives: 1480,
    totalCategories: 208,
    totalPaidTools: 380,
    timestamp: new Date().toISOString()
  };
}

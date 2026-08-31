# Openlysts Architecture Document (v1.3.0)

This document outlines the complete, ground-up architecture of the **Openlysts** platform. Use this as a reference to deeply understand its moving parts, data models, edge services, and system flows.

## 1. System Overview

Openlysts is an open-source intelligence and discovery platform that continuously monitors GitHub for trending repositories, evaluates projects via a multi-dimensional scoring engine, maps SaaS alternatives, and presents them through a 60FPS responsive web application.

The application uses a full-stack JavaScript architecture designed to run seamlessly both locally and on Vercel Serverless Functions in production, backed by a unified PostgreSQL (Neon) database.

---

## 2. Technology Stack

### Frontend (Client)
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **State Management & Caching**: TanStack React Query (v5) with SWR optimization
- **Styling**: Tailwind CSS with CSS Variable token design system (`index.css`)
- **UI Components & Primitives**: Radix UI primitives, Vaul (drawers/bottom sheets), Lucide React, Recharts (Data Visualization).
- **Motion & Graphics**: Framer Motion (page animations & physics), Three.js & OGL (interactive 3D & custom GPU shaders), 3D Card Tilt with specular sheen.
- **Global State Contexts**: `AuthContext` (sessions & profile), `CompareContext` (side-by-side comparison dock & query sync).
- **Outbox Engine**: `syncOutbox.js` (0ms latency optimistic client write engine).
- **PWA**: Workbox service-worker caching with installable application manifests.

### Backend & Edge Engine
- **Runtime**: Node.js
- **Framework**: Express.js
- **Cache Layer**: In-Memory LRU & TTL Caching (`server/services/cache.js`) for sub-millisecond aggregations and lean list projections.
- **Database**: PostgreSQL (via `pg` connection pool) hosted on Neon.
- **Concurrency & Ingestion Locks**: PostgreSQL Session Advisory Lock (`pg_try_advisory_lock(987654321)`) for zero-collision background discovery ingestion.
- **Session Management**: `express-session` backed by `connect-pg-simple` table sessions.
- **Security & Auth**: `bcryptjs` password hashing, Google & GitHub OAuth2, origin CSRF validation, rate limiting.
- **Email Dispatch**: `nodemailer` SMTP integration for password resets and inquiries.

---

## 3. Directory Structure

```text
openlyst/
├── server/                     # Express Backend & API Layer
│   ├── api/                    # Express route controllers
│   │   ├── admin.js            # Admin management & audit logs
│   │   ├── auth.js             # Authentication, OAuth, password reset
│   │   ├── contact.js          # SMTP email dispatch
│   │   ├── entities.js         # Generic entity CRUD routes
│   │   ├── functions.js        # Custom RPC functions
│   │   └── profile.js          # User profile & Data Vault endpoints
│   ├── auth/                   # Core Authentication Modules
│   │   ├── audit.js            # Immutable audit logging
│   │   ├── bootstrap.js        # First admin bootstrapping
│   │   ├── constants.js        # Roles, statuses, and permissions
│   │   ├── email.js            # HTML verification & reset emails
│   │   ├── middleware.js       # requireAuth, requireAdmin, CSRF guards
│   │   ├── oauth.js            # Google & GitHub OAuth strategies
│   │   ├── password.js         # Bcrypt hashing & complexity validation
│   │   └── session.js          # PostgreSQL session store configuration
│   ├── db/                     # Database layer
│   │   ├── index.js            # Singleton pg connection pool
│   │   └── schema.js           # Automated DDL table creation & migrations
│   ├── functions/              # Core Business Logic & Algorithms
│   │   ├── queryRepositories.js# Hybrid similarity search & filters
│   │   ├── queryAlternatives.js# SaaS-to-OSS alternative matching
│   │   ├── getSimilarRepos.js  # Score & topic-based similarity ranking
│   │   └── runIngestion.js     # GitHub API ingestion & score evaluation
│   ├── services/               # Edge Caching & Dynamic SQL Builders
│   │   ├── cache.js            # Sub-millisecond LRU/TTL in-memory cache manager
│   │   └── entities.js    # Optimized SQL entity queries & lean projections
│   └── index.js                # Express app entrypoint & background scheduler
├── src/                        # React Frontend
│   ├── api/                    # API clients (localClient)
│   ├── components/
│   │   ├── openlyst/           # Core product components (DevPass, AnimateDigits, SocialHoverCards)
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/                    # Utilities, syncOutbox, contexts, and helper hooks
│   └── pages/                  # Page routes (Home, Discover, Compare, Alternatives, Register, Login)
├── tests/                      # Automated Playwright test suites (e2e & regression)
├── .agents/skills/             # Engineering skills & QA test protocols
└── vercel.json                 # Vercel deployment, CSP headers & serverless routing
```

---

## 4. PostgreSQL Schema & Data Model

The application uses an entity-relational schema initialized dynamically in `server/db/schema.js`:

- **`Repository`**: Core open-source project metadata.
  - Columns: `id`, `github_id`, `full_name`, `name`, `owner`, `description`, `stars`, `forks`, `open_issues`, `language`, `topics`, `trending_score`, `quality_score`, `authority_score`, `engagement_score`, `license`, `last_ingested_at`, `created_date`.
- **`Alternative`**: Proprietary SaaS alternatives.
  - Columns: `id`, `proprietary_tool_name`, `free_tool_repo`, `category`, `feature_parity_score`, `comparison_notes`, `created_date`.
- **`User`**: User accounts.
  - Columns: `id`, `name`, `email`, `password_hash`, `role` (`user` / `admin`), `account_status`, `email_verified`, `has_seen_tour`, `created_date`.
- **`AuthAccount`**: Linked OAuth providers (Google, GitHub).
- **`session`**: Serverless session storage managed by `connect-pg-simple`.
- **`AuditLog`**: Immutable security ledger of administrative actions.

---

## 5. Core Algorithmic & Architectural Workflows

### A. Hybrid Similarity Engine
Openlysts computes a hybrid relevance score combining semantic topic matching, authority, and developer activity:
$$\text{Relevance} = (\text{TextScore} \times 1.5) + (\text{AuthorityScore} \times 0.5) + (\text{EngagementScore} \times 0.2) + \log_{10}(\text{Stars})$$
This ensures established, production-grade repositories rank naturally above small or unmaintained repositories with overlapping keyword tags.

### B. 100% Free Autonomous Edge Catalog & Vercel Cron
- **In-Memory Catalog Engine**: The entire 47,000+ repository catalog and its inverted indices are loaded into RAM via `catalogEngine.js`, delivering sub-millisecond query responses and completely eliminating Neon PostgreSQL read bandwidth for searches.
- **Vercel Cron Automation**: Daily ingestion (`runIngestion.js`) is triggered autonomously by Vercel Cron (`0 2 * * *`), removing the need for manual Git commits or external GitHub Action runners.
- **Lean PostgreSQL**: Postgres is used strictly for lightweight features (Users, Auth, Bookmarks, and Alternatives sync) to aggressively preserve free-tier limits.
- **Optimistic Client Outbox**: UI mutations (e.g., bookmarking) occur with 0ms latency via `syncOutbox.js` and queue replay.

### C. Multi-Tier Persistent Video Cache Engine (`getRepoVideos`)
To eliminate the 4,000ms–6,000ms latency of cold YouTube search scraping, Openlysts employs a four-tier retrieval pipeline:
1. **Tier 1 (Instant In-Memory & Disk Cache)**: Loads `server/data/video_cache.json` on startup. Serves cached videos in **$< 1\text{ms}$** with zero network roundtrips.
2. **Tier 2 (Query Normalization)**: Converts structured repo identifiers (`owner/repo`) into sanitized contextual search queries (`repo tutorial`), dramatically improving YouTube matching speed and accuracy.
3. **Tier 3 (Timeout Guard)**: Enforces a strict 3.2s `Promise.race` timeout to prevent hanging connections during upstream network degradation.
4. **Tier 4 (Client Hover Pre-Fetching)**: `RepoVideoLinks` triggers speculative background pre-fetching on `onMouseEnter`, so videos are already resident in `clientVideoCache` when clicked.

### D. Equal-Height Responsive Card Grid Architecture
The repository discovery matrix utilizes full-height flexbox stretch rows (`h-full flex flex-col justify-between` on outer cards, coupled with `RepositoryGrid` column inheritance) and a standardized `min-h-[40px]` 2-line description clamp, ensuring 100% pixel-uniform vertical baselines across every grid row.

### E. Reactive 3D Avatar & Creator Contact Routing
`ReactiveAvatar.jsx` computes normalized mouse vector coordinates relative to center-origin, driving real-time 3D pupil tracking, organic periodic eyelid winks (`#dcb18c` fair complexional tones), smile cheek glows, and particle reaction bursts, while linking direct creator inquiries to the built-in Contact Portal.

### F. 3D Psychological UI & Gamified Onboarding
- **Live 3D Holographic Dev Pass**: Real-time rendering of developer identity credentials with dynamic role track stamping.
- **Progressive Password Milestone Ring**: Instant 4-step visual reinforcement for secure credentials.
- **Rolling Odometer Telemetry**: Spring-animated live statistics for community scale.

---

## 6. Testing & Quality Assurance Protocols

- **Static Validation**: `npm run lint`, `npm run typecheck`, `npm run build`.
- **Physical Browser Verification**: Playwright MCP tool actions verifying live DOM states, network requests, console logs, and visual responsiveness.
- **SOTA E2E QA Test Matrix**: 81 comprehensive test cases in `.agents/skills/openlyst-qa-tester/SKILL.md` (TC-001 through TC-425) executed with 100% PASS rate.
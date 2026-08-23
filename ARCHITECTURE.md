# Openlysts Architecture Document (v1.2.0)

This document outlines the complete, ground-up architecture of the **Openlysts** platform. Use this as a reference to deeply understand its moving parts, data models, and system flows.

## 1. System Overview

Openlysts is an open-source intelligence and discovery platform that continuously monitors GitHub for trending repositories, evaluates projects via a multi-dimensional scoring engine, maps SaaS alternatives, and presents them through a 60FPS responsive web application.

The application uses a full-stack JavaScript architecture designed to run seamlessly both locally and on Vercel Serverless Functions in production, backed by a unified PostgreSQL (Neon) database.

---

## 2. Technology Stack

### Frontend (Client)
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **State Management & Caching**: TanStack React Query (v5)
- **Styling**: Tailwind CSS with CSS Variable token design system (`index.css`)
- **UI Components & Primitives**: Radix UI primitives, Vaul (drawers/bottom sheets), Lucide React.
- **Motion & Graphics**: Framer Motion (page animations), Three.js & OGL (interactive 3D particle hero).
- **Global State Contexts**: `AuthContext` (sessions & profile), `CompareContext` (side-by-side comparison dock & query sync), `BookmarkContext` (cross-device/local storage bookmarking).
- **PWA**: Workbox service-worker caching with installable application manifests.

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` connection pool) hosted on Neon.
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
│   ├── services/               # Dynamic SQL entity builders
│   └── index.js                # Express app entrypoint & background scheduler
├── src/                        # React Frontend
│   ├── api/                    # API clients (localClient)
│   ├── components/
│   │   ├── openlyst/           # Core product components (Cards, Docks, Nav)
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/                    # Utilities, contexts, and helper hooks
│   └── pages/                  # Page routes (Home, Discover, Compare, Alternatives, etc.)
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

### B. Background Ingestion & Real-Time Polling
- **Backend**: Periodic ingestion runs fetch trending projects from GitHub, calculate score attributes, and perform atomic `UPSERT` queries.
- **Frontend**: TanStack React Query hooks poll on a 60-second window, silently updating cache state when background ingestion runs without requiring user page reloads.

### C. Cross-Device Responsive Layer
- **Desktop ($\ge 1280\text{px}$)**: Full horizontal navigation bar with inline search triggers and floating compare bar.
- **Tablet ($768\text{px} - 1279\text{px}$)**: Slide-over navigation drawer portal with touch-optimized target spacing.
- **Mobile ($< 768\text{px}$)**: Fixed bottom navigation bar with live bookmark badge notifications and Vaul bottom-sheet filter drawers.

---

## 6. Testing & Quality Assurance Protocols

- **Static Validation**: `npm run lint`, `npm run typecheck`, `npm run build`.
- **Physical Browser Verification**: Playwright MCP tool actions verifying live DOM states, network requests, console logs, and visual responsiveness.
- **Automated Regression Suite**: 50 automated tests in `tests/e2e.spec.js` and `tests/regression.spec.js` covering navigation, search debouncing, security, compare dock sync, theme switches, and mobile drawer flows.
# Openlysts Architecture Document

This document outlines the complete, ground-up architecture of the Openlyst platform. Use this as a reference if you ever need to rebuild the application from scratch or deeply understand its moving parts.

## 1. System Overview

Openlysts is an open-source discovery platform that continuously monitors GitHub for trending repositories, scores them based on quality and velocity, and presents them in a beautiful, filterable UI. 

The application uses a full-stack JavaScript architecture, designed to run both locally for development and on Vercel Serverless Functions in production. It connects to a centralized PostgreSQL (Neon) database.

## 2. Technology Stack

### Frontend (Client)
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **State Management / Data Fetching**: TanStack React Query (v5)
- **Styling**: Tailwind CSS + standard CSS (`index.css`)
- **UI Components**: Shadcn UI (Radix primitives), Framer Motion (animations), Lucide React (icons).

### Backend (Server)
- **Runtime**: Node.js
- **Server**: Express.js
- **Database**: PostgreSQL (via `pg` pool) hosted on Neon.
- **Execution**: Runs on Vercel Serverless Functions (subject to execution timeouts) or concurrently with Vite locally using `npm-run-all`.

### Security & Auth Stack
- **Session Management**: Database-backed sessions via `express-session` and `connect-pg-simple`.
- **Password Hashing**: `bcryptjs` (Cost factor 12).
- **Authentication**: Local Email/Password + OAuth2 (Google & GitHub).
- **Rate Limiting**: `express-rate-limit` to prevent brute force and enumeration attacks.
- **Email Dispatch**: NodeMailer (SMTP via Gmail for Password Resets and Contact Forms).

## 3. Directory Structure

```text
openlyst/
├── server/                     # Express Backend
│   ├── api/                    # Express route definitions
│   │   ├── admin.js            # Admin user management & audit logs
│   │   ├── auth.js             # Login, register, oauth, resets
│   │   ├── contact.js          # SMTP Email dispatch via nodemailer
│   │   ├── entities.js         # Generic CRUD routes for all tables
│   │   ├── functions.js        # Custom RPC routes (querying, ingestion)
│   │   └── profile.js          # Self-service user profile updates
│   ├── auth/                   # Core Authentication Modules
│   │   ├── audit.js            # Audit logging system
│   │   ├── bootstrap.js        # Auto-creation of first admin
│   │   ├── constants.js        # Roles, statuses, actions
│   │   ├── email.js            # Verification & Reset emails
│   │   ├── middleware.js       # Auth guards (requireAuth, requireRole)
│   │   ├── oauth.js            # OAuth provider logic
│   │   ├── password.js         # Bcrypt hashing & strength checks
│   │   └── session.js          # Session store config
│   ├── db/                     # Database connection and schema
│   │   ├── index.js            # PostgreSQL connection pool singleton
│   │   └── schema.js           # CREATE TABLE statements (auto-init)
│   ├── functions/              # Core Business Logic
│   │   ├── runIngestion.js     # GitHub API fetching and updating logic
│   │   └── queryRepositories.js# Advanced filtering and sorting logic
│   ├── services/               # Database interaction layer
│   │   └── entities.js         # Dynamic SQL generation for CRUD
│   └── index.js                # Express app entry point & Background Worker loop
├── src/                        # React Frontend
│   ├── api/                    # API clients
│   │   └── localClient.js      # Fetch wrapper for generic entity calls
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities and configuration
│   │   ├── local-runtime/      # Auth client wrapper communicating with Express
│   │   ├── api.js              # Wrappers around localClient calls
│   │   └── AuthContext.jsx     # Global authentication state
│   └── pages/                  # Top-level route components (Home, Search, Admin, etc.)
└── package.json
```

## 4. Data Model (PostgreSQL Schema)

The application uses a generic entity-based model augmented by dedicated auth tables. Key tables include:

- **`Repository`**: The core entity. Stores GitHub metadata.
  - Columns: `id`, `github_id`, `full_name`, `description`, `stars`, `language`, `topics`, `trending_score`, `quality_score`, `last_ingested_at`, etc.
  
- **`User`**: Core user accounts.
  - Columns: `id`, `name`, `email`, `password_hash`, `role` (`user`, `admin`), `account_status`, `email_verified`.
  
- **`AuthAccount`**: Linked OAuth providers.
  - Columns: `id`, `user_id`, `provider` (`google`, `github`), `provider_id`.
  
- **`session`**: Serverless-compatible session store. Managed by `connect-pg-simple`.
- **`PasswordResetToken` / `EmailVerificationToken`**: Time-limited cryptographic hashes for secure flows.
- **`AuditLog`**: Immutable ledger of administrative and sensitive actions (role changes, suspensions).

## 5. Core Workflows

### A. Authentication & Session Flow
1. Users authenticate via `/api/auth/login` (email/password) or `/api/auth/:provider` (OAuth).
2. The server verifies credentials and establishes a session using `express-session` with the `connect-pg-simple` store.
3. A `connect.sid` cookie is set (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
4. The frontend (`AuthContext.jsx`) calls `/api/auth/me` on load to hydrate user state.
5. Mutating API endpoints in `/api/entities` and `/api/functions` are protected by `requireAdmin` middleware, checking `req.user`.

### B. Autonomous Background Ingestion (Backend)
1. In `server/index.js`, a `setInterval` is established to run every 10 minutes locally.
2. It executes `executeIngestion()` (`server/functions/runIngestion.js`).
3. This function fetches standard queries from the GitHub API, calculates a `trending_score` and `quality_score` for each repository based on activity and completeness, and runs `INSERT ... ON CONFLICT DO UPDATE` into the PostgreSQL database.
4. *Note: On Vercel, this is typically adapted to a Cron Job due to serverless timeouts.*

### C. Backend Email Dispatch (SMTP)
1. A user triggers a password reset or submits a contact form.
2. The Express server uses `nodemailer` configured with the SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) in `.env.local`.
3. Standardized, professional HTML emails are sent to the user or platform owner securely.

### D. Real-Time UI Syncing (Frontend)
1. Pages like `Home.jsx` and `Trending.jsx` use `@tanstack/react-query`.
2. The queries are configured with `refetchInterval: 60000` (1 minute).
3. If the user leaves the page open, React Query quietly polls the backend every minute. When background ingestion finishes a batch, the frontend instantly reflects the new database state without requiring a page refresh.

## 6. Git Workflow (Releases & Environments)

Openlysts strictly follows a 3-branch strategy for stability and rapid development:

- **`dev`**: The active development branch. All day-to-day AI changes, new features, and bug fixes happen here.
- **`main`**: The latest stable version (Production). When `dev` is ready, it merges here and semantic version tags (e.g. `1.0.0`) are applied for official GitHub Releases.
- **`backup`**: The most stable, "last known good" version. When `main` proves reliable in production, it is backed up here to serve as an immediate rollback point in case of critical failures.

All AI interactions and workflows must default to the `dev` branch unless performing a specific release action.
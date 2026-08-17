# Openlyst Architecture Document

This document outlines the complete, ground-up architecture of the Openlyst local-first platform. Use this as a reference if you ever need to rebuild the application from scratch or deeply understand its moving parts.

## 1. System Overview

Openlyst is an open-source discovery platform that continuously monitors GitHub for trending repositories, scores them based on quality and velocity, and presents them in a beautiful, filterable UI. 

Originally built on a proprietary cloud backend, it has been fully migrated to a **local-first, autonomous architecture** where the entire database and ingestion engine run directly on the user's machine.

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
- **Database**: SQLite (via `better-sqlite3` - synchronous, high performance)
- **Execution**: Run concurrently with Vite using `npm-run-all` or `concurrently`.

## 3. Directory Structure

```text
openlyst/
├── data/                       # Local SQLite database files (ignored in git)
│   └── openlyst.db
├── server/                     # Express Backend
│   ├── api/                    # Express route definitions
│   │   ├── entities.js         # Generic CRUD routes for all tables
│   │   ├── functions.js        # Custom RPC routes (querying, ingestion)
│   │   └── contact.js          # SMTP Email dispatch via nodemailer
│   ├── db/                     # Database connection and schema
│   │   ├── index.js            # better-sqlite3 connection singleton
│   │   └── schema.js           # CREATE TABLE statements
│   ├── functions/              # Core Business Logic
│   │   ├── runIngestion.js     # GitHub API fetching and updating logic
│   │   └── queryRepositories.js# Advanced filtering and sorting logic
│   ├── services/               # Database interaction layer
│   │   └── entities.js         # Dynamic SQL generation for CRUD
│   └── index.js                # Express app entry point & Background Worker loop
├── src/                        # React Frontend
│   ├── api/                    # API clients
│   │   └── localClient.js      # Replaces the legacy Base44 SDK
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities and configuration
│   │   ├── local-runtime/      # The mock SDK logic that communicates with Express
│   │   └── api.js              # Wrappers around localClient calls
│   └── pages/                  # Top-level route components (Home, Search, etc.)
└── package.json
```

## 4. Data Model (SQLite Schema)

The application uses a generic entity-based model. Key tables include:

- **`Repository`**: The core entity. Stores GitHub metadata.
  - Columns: `id`, `github_id`, `full_name`, `description`, `stars`, `language`, `topics`, `trending_score`, `quality_score`, `last_ingested_at`, etc.
  - Indexes: Indexed on `stars`, `trending_score`, and `created_date` for fast querying.
  
- **`User`**: Local profile data.
  - Columns: `id`, `name`, `email`, `role`, `settings`, `onboarded`.
  
- **`Goal`, `Task`, `Update`, `AgentActivity`**: 
  - Supports the Orbital/AgentPM workflow functionality embedded in the app.

## 5. Core Workflows

### A. The SDK Mock Layer (Frontend)
To avoid rewriting hundreds of React components that originally relied on a cloud SDK, we implemented an interceptor pattern in `src/lib/local-runtime/`.
1. The frontend calls `localClient.entities.Repository.list()`.
2. The mock SDK intercepts this, converts it to a standard `fetch()` POST request.
3. The request hits `/api/entities/Repository/list` on the Express server.
4. The backend dynamically translates this to `SELECT * FROM Repository`, runs it via `better-sqlite3`, and returns JSON.

### B. Autonomous Background Ingestion (Backend)
1. In `server/index.js`, a `setInterval` is established to run every 10 minutes (600,000 ms).
2. It executes `executeIngestion()` (`server/functions/runIngestion.js`).
3. This function fetches standard queries from the GitHub API, calculates a `trending_score` and `quality_score` for each repository based on activity and completeness, and runs `INSERT OR REPLACE` into the local SQLite database.

### C. Backend Email Dispatch (Contact Form)
1. A user submits the contact form (`Contact.jsx`) on the frontend.
2. The frontend sends a POST request to `/api/contact/send` with the form data.
3. The Express server uses `nodemailer` configured with the SMTP credentials in `.env.local` to securely dispatch the email to the platform owner without exposing email addresses or relying on local OS clients.

### D. Real-Time UI Syncing (Frontend)
1. Pages like `Home.jsx` and `Trending.jsx` use `@tanstack/react-query`.
2. The queries are configured with `refetchInterval: 60000` (1 minute).
3. If the user leaves the page open, React Query quietly polls the backend every minute. When the background ingestion worker finishes a batch, the frontend instantly reflects the new database state without requiring a page refresh.

## 6. Authentication

Because this is a local-first application, true cloud authentication is unnecessary.
- The `AuthContext.jsx` and `src/lib/local-runtime/auth.js` automatically create a local anonymous user profile (`local-admin`).
- This bypasses login screens and allows the user immediate access to the platform while preserving the structural requirement of having an authenticated "User" attached to goals and bookmarks in the database.

# Local Runtime Architecture

This document describes the unified local and production backend architecture for **Openlysts**.

## Architecture Overview

Openlysts utilizes a full-stack, standalone architecture designed for unified local development and production deployment on Vercel:

- **Frontend**: React 18 + Vite SPA located in `src/`. API requests are routed through `src/api/localClient.js` and `src/lib/api.js`.
- **Backend API**: Node.js Express server located in `server/` (running on port `3001` and proxied via Vite locally).
- **Database**: PostgreSQL hosted on [Neon](https://neon.tech), utilizing the `pg` connection pool with automatic table schema initialization on boot.
- **Session & Auth**: Serverless-compatible database sessions via `connect-pg-simple` and `express-session`, with bcrypt password hashing and OAuth2 providers (Google & GitHub).

## Getting Started Locally

To run the full-stack application locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file with the required credentials:
   ```env
   DATABASE_URL="postgres://user:password@hostname/dbname?sslmode=require"
   GITHUB_TOKEN=your_github_personal_access_token
   SESSION_SECRET=your_super_secret_session_key_min_32_chars
   ```

3. **Start the Unified Development Environment**:
   ```bash
   npm run dev
   ```
   This concurrently runs the Express API server (`http://localhost:3001`) and the Vite development server (`http://localhost:5173`).

## Database Management & Schema

The application uses PostgreSQL with automatic table creation and migrations defined in `server/db/schema.js`.

### Core Tables & Entities
- **`Repository`**: Stores GitHub project metrics, stars, velocity, `authority_score`, `engagement_score`, `trending_score`, and categorization.
- **`Alternative`**: Stores SaaS-to-open-source mappings with `feature_parity_score` and comparison data.
- **`User`** & **`AuthAccount`**: Stores authenticated user profiles, credentials, and OAuth accounts.
- **`session`**: Database-persisted user sessions managed by `connect-pg-simple`.
- **`AuditLog`**: Ledger for administrative changes and security audit events.

### Modifying Schema
To add new tables or alter schema definitions, update `server/db/schema.js`. On startup, `server/db/schema.js` executes `CREATE TABLE IF NOT EXISTS` and index migrations against the PostgreSQL connection pool.

## Backend RPC Functions & Endpoints

All custom RPC actions are located in `server/functions/*.js`:
- `queryRepositories.js`: Hybrid similarity filtering and search.
- `queryAlternatives.js`: Category and keyword-based alternative search.
- `getSimilarRepos.js`: High-precision topic and score similarity matching.
- `runIngestion.js`: Automated GitHub API data fetching and score computation.

### Adding a New Backend Function
1. Create a function file in `server/functions/` (e.g., `myNewFunction.js`):
   ```javascript
   export default async function myNewFunction(req, res) {
     try {
       const { param } = req.body;
       // Execute logic, db query, or external API fetch
       return res.json({ success: true, data: [] });
     } catch (err) {
       return res.status(500).json({ error: true, message: err.message });
     }
   }
   ```
2. Register the function in `server/api/functions.js`.
3. Invoke from frontend via `localClient.functions.invoke('myNewFunction', { param })`.

## Quality Assurance & Automated Testing

- **Linting**: `npm run lint`
- **Type Checking**: `npm run typecheck`
- **Production Build**: `npm run build`
- **Playwright Regression Suite**: `npx playwright test`

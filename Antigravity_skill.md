---
name: openlyst-migration-guide
description: Complete guide and skill for migrating Openlysts from a Base44 backend to an independent local SQLite + Express backend. Includes architecture, gotchas, what worked, and what failed.
---

# Openlysts Migration Skill & Guide

This document serves as a historical record, guide, and agent skill for understanding how Openlysts was migrated from a proprietary cloud backend (Base44) to a completely independent, local-first architecture (Express + SQLite).

If you are tasked with rebuilding this project from scratch, debugging it, or extending it, this document outlines the exact path to success and the pitfalls to avoid.

## 🎯 The Objective
Convert a React/Vite application heavily dependent on a proprietary backend SDK (`@base44/sdk`) into a standalone application that runs entirely locally, without redesigning the UI or throwing away the existing React components.

## ✅ What Worked (Best Practices)

1. **The "SDK Mock" Pattern**
   - Instead of rewriting every React component to use native `fetch()` calls, we created a local mock (`src/lib/local-runtime/`) that perfectly mirrored the API surface of the original Base44 SDK.
   - We swapped `import { base44 } from '@base44/sdk'` with `import { localClient } from '@/api/localClient'`.
   - **Result**: We preserved 100% of the frontend UI and React component logic without having to rewrite the application.

2. **Synchronous SQLite (`better-sqlite3`)**
   - We used `better-sqlite3` on the Node.js backend. It is synchronous, extremely fast, and drastically simplified the backend database logic. No async/await overhead for simple queries.

3. **Autonomous Background Workers**
   - Instead of relying on Admin UI buttons to trigger GitHub API data ingestion, we extracted the ingestion logic (`server/functions/runIngestion.js`) and attached it to a `setInterval` loop in `server/index.js`.
   - **Result**: The backend became a self-sustaining engine that autonomously updates data every 10 minutes.

4. **Algorithmic Infrastructure (Hybrid Similarity)**
   - Instead of simple text matching or relying purely on vector embeddings (which can be too narrow), we introduced calculated heuristic columns (`authority_score` and `engagement_score`) based on stars, forks, and issues during ingestion.
   - We updated search functions (`queryRepositories` and `getSimilarRepos`) to fuse vector similarity (`_hybrid_relevance`) with these calculated scores: `(textScore * 1.5) + (authority_score * 0.5) + (engagement_score * 0.2) + log10(stars)`.
   - **Result**: Superior search results where highly-adopted, canonical projects naturally outrank obscure projects with exact keyword matches.

5. **Real-Time Frontend Syncing**
   - We added `refetchInterval: 60000` (60 seconds) to the `@tanstack/react-query` hooks on the frontend.
   - **Result**: The UI updates automatically as the background worker fetches new data, creating a magical "Live" feeling for the user without websockets.

## ❌ What Failed (What NOT to do next time)

1. **Altering API Response Structures**
   - **The Mistake**: When rewriting the API wrapper (`api.js`), we assumed the new backend returned data in a wrapped `{ data: ... }` object like Axios did previously, resulting in `return res.data;`. Because the local API returned the JSON directly, `res.data` was `undefined`.
   - **The Consequence**: The frontend received `undefined` data and was permanently stuck on the "Syncing repositories" loading screen, despite the database being full of data.
   - **The Fix**: Always `console.log` or strictly verify the exact shape of the JSON response from your local API to ensure it matches what the legacy frontend expects perfectly.

2. **Incomplete Schema Migrations**
   - **The Mistake**: When we created the SQLite schema for the `User` table, we forgot to include the `name` and `email` columns.
   - **The Consequence**: The frontend's automatic "Anonymous Login" system attempted to `INSERT INTO User (id, name, email)` and threw a fatal `SQLITE_ERROR: table User has no column named name`.
   - **The Fix**: Before migrating, do a complete audit of the exact payload the frontend sends. The schema MUST match the payload exactly.

3. **Waiting for Cron Jobs on Boot**
   - **The Mistake**: We set a 10-minute `setInterval` for the GitHub ingestion worker, but forgot to trigger it immediately on server startup.
   - **The Consequence**: A user booting the app for the first time would stare at an empty screen for 10 full minutes before any data loaded.
   - **The Fix**: Always use `setTimeout(() => execute(), 2000)` alongside `setInterval` to guarantee immediate execution upon boot.

4. **Port Hijacking Confusion (Vite)**
   - **The Mistake**: The user had an old `npm run dev` terminal session running in a different folder (`openlysts_main`), which occupied port `5173`. When we started the updated dev server in our working directory (`openlyst`), Vite silently fell back to port `5174`.
   - **The Consequence**: The user refreshed `localhost:5173` and repeatedly saw the old, unmodified code, leading to immense confusion.
   - **The Fix**: Always kill stale Node processes (`Stop-Process -Id ...`) or instruct the user to completely close their old terminals before testing new backend changes.

## 5. Branch Architecture & Production Deployment Protocol

Openlysts enforces a strict 4-branch architecture (`experimental` -> `dev` -> `main` -> `backup`):
- **`experimental`**: Working branch where active coding occurs.
- **`dev`**: Staging sync.
- **`main`**: Production release branch. **Vercel CLI production deployments MUST ONLY and ALWAYS be triggered while on `main` (`git checkout main`).**
- **`backup`**: Rollback snapshot.

### Production Release Sequence:
1. `npm run build` (Verify zero errors).
2. Commit on `experimental`.
3. Fast-forward merge `experimental` -> `dev` -> `main` -> `backup` and push all branches.
4. `git checkout main`
5. `npx vercel --prod --yes --force` (or `vercel build --prod` + `vercel deploy --prebuilt --prod --yes`).
6. Verify live deployment (`https://openlysts.vercel.app`).
7. `git checkout experimental`

---
*Created by Antigravity IDE during the Openlysts Migration.*

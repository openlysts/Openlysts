---
name: openlyst-fullstack-guide
description: Complete guide and reference skill for Openlysts full-stack architecture, PostgreSQL (Neon) database, autonomous background workers, hybrid scoring engine, and multi-branch release protocol.
---

# Openlysts Full-Stack System Guide & Skill

This document serves as a comprehensive technical guide and agent skill for maintaining, debugging, extending, and operating the **Openlysts** full-stack ecosystem.

---

## 1. System Overview

- **Frontend**: React 18 + Vite SPA styled with Tailwind CSS design tokens and animated with Framer Motion.
- **Backend**: Express.js server on Node.js running on port 3001 (proxied via Vite).
- **Database**: PostgreSQL on [Neon](https://neon.tech), connected via the `pg` pool singleton in `server/db/index.js`.
- **Session Layer**: PostgreSQL database-backed sessions with `express-session` and `connect-pg-simple`.

---

## 2. Core Architectural Patterns

### A. The Direct API Client Pattern
Frontend components access backend services via `src/api/localClient.js` and `src/lib/api.js`. Custom backend RPC endpoints in `server/functions/*.js` are registered in `server/api/functions.js` and invoked with `localClient.functions.invoke(name, payload)`.

### B. Algorithmic Infrastructure (Hybrid Similarity)
The search and similarity engine in `queryRepositories.js` and `getSimilarRepos.js` fuses full-text relevance with computed heuristic scores:
$$\text{Relevance} = (\text{TextScore} \times 1.5) + (\text{AuthorityScore} \times 0.5) + (\text{EngagementScore} \times 0.2) + \log_{10}(\text{Stars})$$

### C. Real-Time UI Synchronization
The frontend uses `@tanstack/react-query` with background polling (`refetchInterval: 60000`). When background ingestion updates the PostgreSQL database, the user interface updates seamlessly without requiring a hard refresh.

---

## 3. Engineering Best Practices & Gotchas

1. **PostgreSQL Casing & Identifier Safety**:
   - Table names and column names must remain consistent with `server/db/schema.js`.
   - The `Alternative` table uses `feature_parity_score` (not `quality_score`).
2. **React State Reducer Purity**:
   - Never call external UI side effects (e.g. `toast()`) inside state setter functions (`setState(prev => ...)`). Always call them in the outer event handler to prevent React render-cycle warnings.
3. **Tailwind Responsive Breakpoints**:
   - The desktop header uses `xl:flex` ($\ge 1280\text{px}$). Slide-over drawer portals must use `xl:hidden` so that tablet and small laptop viewports ($1024\text{px} - 1279\text{px}$) can trigger and interact with the navigation drawer.
4. **Content Security Policy (CSP)**:
   - External embeds (such as YouTube tutorial iframes) must be whitelisted under `frame-src` in `vercel.json`.

---

## 4. Multi-Branch Git & Production Release Workflow

Openlysts enforces a strict 4-branch architecture (`experimental` -> `dev` -> `main` -> `backup`):

- **`experimental`**: Working branch where active coding occurs.
- **`dev`**: Staging sync.
- **`main`**: Production release branch. **Vercel production deployments MUST ONLY and ALWAYS be executed while checked out to `main` (`git checkout main`).**
- **`backup`**: Rollback snapshot.

### Production Release Protocol:
1. `npm run lint; npm run typecheck; npm run build` (Verify 0 errors).
2. Commit on `experimental`.
3. Fast-forward merge `experimental` -> `dev` -> `main` -> `backup` and push all branches to remote.
4. `git checkout main`
5. `npx vercel --prod --yes --force` (or `vercel build --prod` + `vercel deploy --prebuilt --prod --yes`).
6. Verify live deployment at `https://openlysts.vercel.app`.
7. `git checkout experimental`

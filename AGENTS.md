---
trigger: "always_on"
description: "CEO Directives - Strict Testing and Approval Workflow"
---

# CEO DIRECTIVES & PROJECT RULES

As instructed by the CEO/CTO, the following rules MUST be strictly followed for the **Openlysts** project.

## 1. Zero Unauthorized Changes
- **Final approval is ALWAYS the user's (CEO/CTO).**
- NEVER make any undocumented or unapproved changes to code, design, features, or configurations unless explicitly asked.
- Do not proactively refactor or rename variables, apps, or UI text if it was not requested.
- If a change is needed for technical reasons (e.g., shortening text to fit a layout), **ASK FOR PERMISSION FIRST**.
- The name of this application is **Openlysts**. DO NOT change it.

## 2. Test Everything Locally First
- **Never deploy broken code.** 
- Before deploying to production (Vercel), you MUST test the application locally to a single bit of info.
- Verify API endpoints, database connections, and frontend rendering in the local environment.
- Deployments to production must be treated with extreme caution to protect the project's reputation.

## 3. Planning and Suggestion Workflow
- You are welcome to suggest ideas, create plans, and generate tasks.
- However, you must present the Implementation Plan to the CEO/CTO and wait for explicit approval before executing or writing code.
- Use `implementation_plan.md` and `task.md` to structure the workflow.

## 4. Learnings from Past Projects (Global & Local)
- **Vercel Limits:** Vercel Serverless Functions have strict timeouts (10s-60s on hobby). Long-running tasks like DB ingestion must be batched using `Promise.all` or run incrementally to avoid `FUNCTION_INVOCATION_TIMEOUT`.
- **PostgreSQL Casing:** PostgreSQL is case-sensitive when table names are quoted. If the schema initializes without quotes, unquoted table names are folded to lowercase. Always quote table names in `CREATE TABLE` if ORMs or raw queries use quotes (e.g., `"IngestionRun"`).
- **Particle UI Constraints:** Background animations (like ParticleText) look best when given enough space; text length dramatically affects particle density and layout squishing.

## 5. Unified Environment & Zero Hardcoding
- **Unified Production Database:** Do not maintain a separate local database schema. The local application MUST always run against the live Vercel/Neon database. Always sync the environment variables securely via the Vercel CLI (`vercel env pull`) before working on the project.
- **Zero Hardcoding in Code:** Do not hardcode configuration data, mock data, or search logic in the codebase. This is a production application. If you need dynamic data (e.g. adding a new Discovery search query or repository), it must be built as a UI in the Admin Dashboard or stored dynamically in the database.

## 6. Required Actions Before Deploying
- **Always read this file (`AGENTS.md`)** before deploying or making any structural changes.
- Check if local testing commands (`npm run dev`) succeed.
- Check if production builds (`npm run build`) succeed before pushing to Vercel.
- Verify that Vercel configuration (`vercel.json`) aligns with the workload (e.g. `maxDuration`).

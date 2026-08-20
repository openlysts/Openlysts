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

## 7. Agent Coding Behavior Guidelines
*These rules reduce common LLM coding mistakes. They bias toward caution over speed. Apply judgment for trivial tasks.*

### 7.1 Think Before Coding
- State assumptions explicitly before implementing. If uncertain, **ask**.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so and push back when warranted.
- If something is unclear, **stop and name what's confusing**.

### 7.2 Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 7.3 Surgical Changes
- **Touch only what you must.** Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that aren't broken.
- Match existing code style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — do not delete it.
- When your changes create orphaned imports/variables, remove **only those your changes made unused**.
- Every changed line must trace directly to the user's request.

### 7.4 Goal-Driven Execution
- Transform tasks into verifiable goals before starting.
  - "Fix the bug" → "Reproduce it, then verify it's gone"
  - "Add feature X" → "Define what done looks like, then implement"
- For multi-step tasks, state a brief plan with verification steps before executing.
- Surface clarifying questions **before** implementation, not after mistakes.

## 8. Physical Browser Testing Protocol (Playwright MCP)
- **Zero reliance on `browser_subagent`**: When executing browser QA tests or verifying UI, **NEVER use the `browser_subagent` tool container** (due to known upstream Azure CDN driver 404 issues on `open_browser_url`).
- **Always use raw Playwright MCP tools**: Always execute browser actions via `call_mcp_tool` using the Playwright MCP server:
  - `browser_navigate` (navigate to `http://localhost:5173/...`)
  - `browser_click`, `browser_type`, `browser_press_key`, `browser_hover`, `browser_select_option`
  - `browser_take_screenshot` (capture full page / element screenshots saved to artifacts)
  - `browser_snapshot`, `browser_evaluate`, `browser_console_messages`, `browser_network_requests`
- **Mandatory Physical Verification**: Check actual rendered DOM, network timings, and visual layout on the local running instance before reporting completion. **Do a physical test yourself always before letting the user test the fix, feature, and so on.**

## 9. CRITICAL Physical QA STANDARD — NON-NEGOTIABLE

Perform **exhaustive 10/10 QA with zero skipped steps, assumptions, shortcuts, or unverified claims.**

First, inspect the **entire implementation and architecture** and derive a complete QA/test matrix from the actual codebase, requirements, features, integrations, dependencies, and user workflows. **Do not assume the listed tests are sufficient.**

Test the complete integrated system end-to-end, including:
- Frontend/UI and every user-facing workflow
- Backend/services/business logic
- APIs and API contracts
- Database, persistence, migrations, and data integrity
- Authentication, authorization, roles, and permissions
- Third-party and internal integrations
- State management and synchronization
- Input validation and sanitization
- Loading, success, empty, failure, timeout, retry, and recovery states
- Positive, negative, boundary, edge, and unexpected-user scenarios
- Security-critical paths
- Responsive behavior and supported environments

**PASS requires actual execution and verification in the real integrated application.** Never declare PASS based solely on code inspection, compilation, static analysis, absence of obvious errors, or the assumption that something “should work.”

For **every failure or defect**:
**reproduce → identify root cause → fix completely → re-run the failed test → test affected dependencies → perform regression testing → verify the fix in the integrated application.**

After **every code change**, re-test all functionality that could reasonably be affected by that change. Do not introduce regressions while fixing another issue.

Before completion, verify there are **zero known or reproducible**:
- Broken workflows or integrations
- Frontend/backend mismatches
- API, database, authentication, or authorization failures
- Console, runtime, network, build, or server errors
- Dead buttons, links, routes, forms, or controls
- Placeholder, mock, fake, hardcoded, or incomplete production logic
- Missing loading, success, empty, error, timeout, or recovery states
- Unhandled edge cases, validation failures, or regressions
- Broken dependencies or integration contracts
- Data integrity or persistence issues

### FINAL RELEASE GATE

Do **NOT** say **PASS, COMPLETE, DONE, READY, or PRODUCTION-READY** until:
1. Every identified requirement and feature has been tested.
2. Every applicable positive and negative scenario has been tested.
3. Every discovered failure has been fixed and re-tested.
4. Regression testing has passed across all affected functionality.
5. Frontend, backend, database, APIs, and integrations have been verified working together.
6. No known or reproducible blocking defects remain.
7. **Test evidence/results support every PASS claim.**

If something cannot be verified, **do not mark it PASS**. Clearly report it as **UNVERIFIED** and continue testing or fixing.

**Evidence over assumption. Execution over inspection. Verification over confidence. Zero known gaps.**

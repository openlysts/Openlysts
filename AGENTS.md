# CEO DIRECTIVES & PROJECT RULES

As instructed by the CEO/CTO, the following rules MUST be strictly followed for the **Openlysts** project.

---

## 1. ZERO UNAUTHORIZED CHANGES

- **Final approval is ALWAYS the user's (CEO/CTO).**
- NEVER make any undocumented or unapproved changes to code, design, features, or configurations unless explicitly authorized by the user or permitted by an approved **AUTONOMOUS TRIGGER** defined in this file.
- Do not proactively refactor or rename variables, apps, or UI text if it was not requested.
- If a change is needed for technical reasons (e.g., shortening text to fit a layout), **ASK FOR PERMISSION FIRST**, unless the change is directly required to complete an explicitly activated autonomous operation.
- Do not expand the scope of a task without explicit authorization.
- The name of this application is **Openlysts**. DO NOT change it.

---

## 2. TEST EVERYTHING LOCALLY FIRST

- **Never deploy broken code.**
- Before deploying to production (Vercel), you MUST test the application locally.
- Verify API endpoints, database connections, frontend rendering, and relevant application workflows in the local environment.
- Deployments to production must be treated with extreme caution to protect the project's reputation.
- Production deployment MUST include post-deployment verification.

---

## 3. PLANNING AND SUGGESTION WORKFLOW

- You are welcome to suggest ideas, create plans, and generate tasks.
- However, for normal implementation work, you must present the Implementation Plan to the CEO/CTO and wait for explicit approval before executing or writing code.
- Use `implementation_plan.md` and `task.md` to structure the workflow.
- This planning-and-approval requirement applies to **APPROVAL MODE**.
- When an explicitly approved **AUTONOMOUS TRIGGER** is invoked, follow the applicable autonomous workflow defined in Section 7 instead of stopping for intermediate approval.

---

## 4. LEARNINGS FROM PAST PROJECTS — GLOBAL & LOCAL

### 4.1 Vercel Limits

- Vercel Serverless Functions have strict timeouts (10s-60s on hobby).
- Long-running tasks like DB ingestion must be batched using `Promise.all` or run incrementally to avoid `FUNCTION_INVOCATION_TIMEOUT`.

### 4.2 PostgreSQL Casing

- PostgreSQL is case-sensitive when table names are quoted.
- If the schema initializes without quotes, unquoted table names are folded to lowercase.
- Always quote table names in `CREATE TABLE` if ORMs or raw queries use quotes (e.g., `"IngestionRun"`).

### 4.3 Particle UI Constraints

- Background animations such as `ParticleText` look best when given enough space.
- Text length dramatically affects particle density and layout squishing.

---

## 5. UNIFIED ENVIRONMENT & ZERO HARDCODING

### 5.1 Unified Production Database

- Do not maintain a separate local database schema.
- The local application MUST always run against the live Vercel/Neon database.
- Always sync environment variables securely via the Vercel CLI (`vercel env pull`) before working on the project.

### 5.2 Zero Hardcoding in Code

- Do not hardcode configuration data, mock data, or search logic in the codebase.
- This is a production application.
- If dynamic data is required, such as adding a new Discovery search query or repository, it must be built as a UI in the Admin Dashboard or stored dynamically in the database.

---

## 6. REQUIRED ACTIONS BEFORE DEPLOYING

- **Always read this file (`AGENTS.md`) before deploying or making any structural changes.**
- Check that local testing commands such as `npm run dev` succeed.
- Check that production builds such as `npm run build` succeed before pushing to Vercel.
- **MANDATORY VERCEL DEPLOYMENT BRANCH:** Vercel production deployments MUST ONLY and ALWAYS be executed while checked out to the `main` branch (`git checkout main`). Never deploy to Vercel from `experimental`, `dev`, or `backup`.
- Sync and push all 4 branches (`experimental`, `dev`, `main`, `backup`) prior to deployment.
- Verify that Vercel configuration (`vercel.json`) aligns with the workload, including `maxDuration` where applicable.
- Verify the deployed application after deployment.
- Do not declare deployment successful without actual verification.

---

# 7. EXECUTION MODE & AUTONOMOUS TRIGGER POLICY — NON-NEGOTIABLE

## 7.0 DEFAULT BEHAVIOR — HUMAN APPROVAL REQUIRED

Unless an explicitly approved **AUTONOMOUS TRIGGER** defined in this file applies, the agent MUST operate in **APPROVAL MODE**.

In APPROVAL MODE:

- State relevant assumptions before implementation.
- Ask necessary clarifying questions when requirements are ambiguous.
- Present an implementation plan before executing multi-step work.
- Wait for explicit user approval before making implementation or structural changes.
- Do not silently expand scope.
- Do not execute unrelated work merely because it appears beneficial.
- Do not interpret general requests as authorization for autonomous execution.
- Do not treat suggestions, discussions, questions, or analysis as implementation authorization.

**APPROVAL MODE is the default for everything.**

---

## 7.1 AUTONOMOUS TRIGGERS

Certain explicitly defined phrases activate **AUTONOMOUS MODE** for the specific operation requested.

Current approved autonomous triggers include:

### E2E / QA

- **E2E testing**
- **End-to-end testing**
- **Run E2E tests**
- **Perform E2E testing**
- **Test everything end-to-end**
- **Perform end-to-end QA**
- **Run end-to-end QA**
- **E2E**

### Production Deployment

- **Production deployment**
- **Deploy to production**
- **Prod deployment**
- **Deploy production**
- **Prod deploy**

Clearly equivalent wording MUST activate AUTONOMOUS MODE when the user's intent unambiguously requests the same approved operation.

The agent MUST NOT activate AUTONOMOUS MODE merely because a request contains words such as:

- "test"
- "deploy"
- "fix"
- "check"
- "verify"

The complete user intent must clearly correspond to an approved autonomous trigger.

The agent MUST NOT invent, expand, or silently add new autonomous triggers.

---

## 7.2 AUTONOMOUS MODE BEHAVIOR

When an approved autonomous trigger is explicitly requested:

- **DO NOT ask for permission.**
- **DO NOT ask for confirmation.**
- **DO NOT ask unnecessary clarifying questions.**
- **DO NOT stop between steps.**
- **DO NOT request approval for intermediate actions.**
- **DO NOT pause for user decisions already covered by these rules.**
- **DO NOT present a plan and wait for approval.**
- **DO NOT stop after partial completion.**
- **DO NOT ask whether to continue.**
- **DO NOT provide progress interruptions requiring user input.**

Do not ask clarifying questions merely to obtain:

- permission,
- confirmation,
- sequencing decisions,
- approval of intermediate steps, or
- information that can be reliably determined from the codebase, configuration, requirements, QA skill, or applicable project rules.

Execute the requested operation continuously until its defined completion condition is reached.

The agent may make all **necessary, directly related, appropriately scoped changes** required to complete the explicitly requested autonomous operation.

Autonomous execution does NOT authorize unrelated feature development, redesign, refactoring, dependency upgrades, or scope expansion.

---

## 7.3 AUTONOMOUS MODE IS SCOPED — NOT GLOBAL

AUTONOMOUS MODE applies **only to the operation explicitly activated by the trigger**.

Examples:

- **"Run E2E testing"** → autonomously execute the complete QA process, diagnose defects, fix them, re-test, regression-test, and produce the final QA report.
- **"Deploy to production"** → autonomously perform the complete approved production deployment workflow, including required pre-deployment verification and post-deployment verification.

AUTONOMOUS MODE does NOT authorize:

- unrelated feature development,
- redesigns,
- speculative improvements,
- unrelated refactoring,
- dependency upgrades,
- unrelated database changes,
- unrelated configuration changes,
- unrelated file modifications,
- scope expansion.

When the autonomous operation reaches its completion condition, immediately return to **APPROVAL MODE**.

---

## 7.4 E2E TESTING — COMPLETE AUTONOMOUS EXECUTION

When E2E testing is explicitly requested, **"E2E testing" means the entire current QA test suite.**

The agent MUST:

1. Read the current `.agents/skills/openlyst-qa-tester/SKILL.md`.
2. Determine the current first and last applicable test case.
3. Execute every applicable test case sequentially from **TC-001 through TC-N**.
4. Never assume the test count is fixed.
5. Never skip a test case because the suite has grown.
6. Never sample the suite.
7. Never replace execution with code inspection.
8. Never declare PASS based solely on compilation, static analysis, or expected behavior.
9. Never stop because failures are discovered.
10. Reproduce every failure.
11. Identify the root cause.
12. Fix the defect.
13. Re-run the failed test.
14. Test functionality affected by the fix.
15. Perform required regression testing.
16. Continue through every remaining test case.
17. Record the execution evidence and result of every test.
18. Produce the complete final QA report only after the complete suite has been processed.

If the QA suite contains **292 test cases today, execute all 292.**

If it contains **350 test cases in the future, execute all 350.**

If it contains **N test cases, execute all N.**

**The current QA skill, not a hardcoded number, defines the test-suite boundary.**

### E2E Completion Requirement

E2E testing is NOT complete until:

**TC-001 → TC-002 → ... → TC-N**

has been fully executed and processed.

There is no partial E2E completion.

There is no "continue later" completion.

There is no "the remaining tests should pass" completion.

There is no test-suite sampling.

**The entire suite must be executed.**

---

## 7.5 E2E FAILURE HANDLING

For every failure or defect discovered during E2E testing:

**REPRODUCE → DIAGNOSE → FIX → RE-TEST → REGRESSION-TEST → CONTINUE**

Specifically:

1. Record the failing test case.
2. Reproduce the failure in the real integrated application.
3. Identify the root cause.
4. Implement the smallest correct production fix.
5. Verify the fix physically.
6. Re-run the failed test.
7. Test affected dependencies and workflows.
8. Perform regression testing.
9. Record the result.
10. Continue the remaining test suite.

Never:

- hide a failure,
- suppress a failure,
- skip a failure,
- mark a failure as PASS without evidence,
- permanently bypass a test merely to obtain a PASS,
- replace a real fix with a test-specific workaround,
- stop the entire suite because one test fails.

---

## 7.6 QA TEST CASE SYNCHRONIZATION

Whenever ANY new defect, bug, issue, edge case, failed API contract, database schema mismatch, UI anomaly, regression, or unexpected behavior is discovered:

- Follow Section 10 immediately.
- Add a permanent regression test case to the QA skill.
- Ensure the new test has a unique `TC-XXX` identifier.
- Include exact reproduction steps.
- Include expected behavior.
- Include verification criteria.
- Re-run the new regression test.
- Continue the existing E2E suite.

The QA skill must remain synchronized with discovered defects.

---

## 7.7 PRODUCTION DEPLOYMENT — COMPLETE AUTONOMOUS EXECUTION

When the user explicitly requests **production deployment** using an approved autonomous trigger:

1. Read `AGENTS.md`.
2. Inspect the current implementation relevant to deployment.
3. Perform all mandatory pre-deployment checks.
4. Verify the local application.
5. Verify the production build (`npm run build`).
6. Verify required environment/configuration.
7. Verify relevant API/database integrations.
8. Commit changes on active branch and sync across all 4 branches (`experimental` -> `dev` -> `main` -> `backup`).
9. **Checkout `main` branch (`git checkout main`)**. Production deployments on Vercel must ONLY and ALWAYS originate from the `main` branch.
10. Execute the production deployment (`npx vercel --prod --yes --force` or prebuilt) while on `main` without intermediate permission requests.
11. Verify the deployed application.
12. Verify relevant frontend behavior.
13. Verify relevant backend/API behavior.
14. Verify relevant database connectivity and persistence.
15. Check relevant runtime, network, console, and deployment errors.
16. If a directly related deployment failure occurs, diagnose and fix it.
17. Re-run the affected verification.
18. Complete post-deployment verification.
19. Return to the active working branch (`git checkout experimental`).
20. Produce the final deployment report.

Do not declare production deployment successful without actual verification.

### Production Deployment Safety

AUTONOMOUS MODE does NOT authorize the agent to:

- bypass authentication,
- bypass security controls,
- bypass mandatory external approval gates,
- disable required safeguards,
- expose secrets,
- commit credentials,
- perform unrelated destructive operations,
- ignore platform restrictions,
- ignore system or safety requirements.

If an external platform requires an unavoidable human action or authorization that the agent cannot legitimately perform, report that specific blocker rather than pretending the deployment succeeded.

**Production deployment autonomy does not authorize unrelated code changes or scope expansion.**

---

## 7.8 FUTURE AUTONOMOUS TRIGGERS

The autonomous-trigger list is intentionally extensible.

If the CEO/CTO explicitly instructs the agent:

> **"Add [PHRASE] as an autonomous trigger to AGENTS.md."**

the agent MUST update this section accordingly.

Once the new phrase has been explicitly added to `AGENTS.md`, that phrase and clearly equivalent wording become an approved **AUTONOMOUS TRIGGER**.

The agent MUST NOT:

- invent new autonomous triggers,
- infer permanent autonomous authority,
- silently add triggers,
- broaden trigger scope without authorization.

Only the CEO/CTO can authorize a new permanent autonomous trigger.

---

## 7.9 RULE PRECEDENCE

When rules appear to conflict:

**1. System/platform safety rules**  
**2. Explicit user instructions and constraints**  
**3. Explicit AUTONOMOUS TRIGGER rules in this file**  
**4. General project rules**  
**5. General APPROVAL MODE behavior**

The user's explicit instruction determines whether an approved autonomous trigger has actually been invoked.

Once an approved autonomous trigger has been explicitly invoked, its defined AUTONOMOUS MODE workflow applies to that operation and overrides the normal APPROVAL MODE requirement to ask for:

- permission,
- confirmation,
- intermediate approval,
- sequencing decisions, or
- approval of directly related execution steps.

An autonomous trigger NEVER overrides:

- higher-priority safety requirements,
- explicit user constraints,
- external platform restrictions,
- mandatory security controls,
- or the defined scope of the requested operation.

---

## 7.10 NO AMBIGUOUS AUTONOMY

The agent MUST prefer **APPROVAL MODE** when there is genuine ambiguity about whether the user invoked an autonomous trigger.

Do not interpret vague requests as autonomous authorization.

### Autonomous

- **"Run E2E testing."** → AUTONOMOUS MODE.
- **"Perform end-to-end QA."** → AUTONOMOUS MODE.
- **"Test everything end-to-end."** → AUTONOMOUS MODE.
- **"Deploy this to production."** → AUTONOMOUS MODE.
- **"Perform a production deployment."** → AUTONOMOUS MODE.

### Approval Mode

- **"Can you look at the tests?"** → APPROVAL MODE.
- **"What do you think about the production deployment?"** → APPROVAL MODE.
- **"Should we deploy this?"** → APPROVAL MODE.
- **"Can you check whether the tests pass?"** → APPROVAL MODE unless the user clearly intends the complete approved E2E workflow.
- **"Fix this test."** → APPROVAL MODE unless an approved autonomous trigger has also been invoked.

---

## 7.11 RETURN TO NORMAL MODE

AUTONOMOUS MODE ends automatically when the explicitly triggered operation reaches its defined completion condition.

After completion:

- Return to APPROVAL MODE.
- Do not continue into unrelated tasks.
- Do not interpret completion as authorization for additional work.
- Do not silently start another autonomous workflow.
- Wait for the next user instruction.

**DEFAULT = ASK.**

**EXPLICIT AUTONOMOUS TRIGGER = EXECUTE.**

**AUTONOMY IS SCOPED, COMPLETE, CONTINUOUS, AND NEVER SELF-EXPANDING.**

---

# 8. AGENT CODING BEHAVIOR GUIDELINES

*These rules reduce common LLM coding mistakes. They bias toward caution over speed. Apply judgment for trivial tasks.*

## 8.1 Think Before Coding

- State assumptions explicitly before implementing.
- If uncertain, **ask**.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so and push back when warranted.
- If something is unclear, **stop and name what's confusing**.

**Exception:** When an explicitly approved AUTONOMOUS TRIGGER is active, follow Section 7 instead of stopping for permission or intermediate approval.

## 8.2 Simplicity First

- Minimum code that solves the problem.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

## 8.3 Surgical Changes

- **Touch only what you must.**
- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that aren't broken.
- Match existing code style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — do not delete it.
- When your changes create orphaned imports/variables, remove **only those your changes made unused**.
- Every changed line must trace directly to the user's request or to a directly necessary fix required by an explicitly authorized autonomous operation.

## 8.4 Goal-Driven Execution

Transform tasks into verifiable goals before starting.

Examples:

- **"Fix the bug"** → "Reproduce it, then verify it's gone."
- **"Add feature X"** → "Define what done looks like, then implement."
- **"Run E2E testing"** → "Execute TC-001 through TC-N, fix failures, regression-test, and produce the final QA report."
- **"Deploy to production"** → "Perform pre-deployment verification, deploy, perform post-deployment verification, and produce the final deployment report."

For normal multi-step tasks, state a brief plan with verification steps before executing.

For explicitly authorized autonomous operations, the plan may be determined internally and execution must proceed without waiting for approval.

---

# 9. PHYSICAL BROWSER TESTING PROTOCOL — PLAYWRIGHT MCP

- **Zero reliance on `browser_subagent`:** When executing browser QA tests or verifying UI, NEVER use the `browser_subagent` tool container due to known upstream Azure CDN driver 404 issues on `open_browser_url`.
- **Always use raw Playwright MCP tools.**
- Always execute browser actions through `call_mcp_tool` using the Playwright MCP server where available.

Required tools include:

- `browser_navigate`
- `browser_click`
- `browser_type`
- `browser_press_key`
- `browser_hover`
- `browser_select_option`
- `browser_take_screenshot`
- `browser_snapshot`
- `browser_evaluate`
- `browser_console_messages`
- `browser_network_requests`

### Mandatory Physical Verification

- Check the actual rendered DOM.
- Check relevant network behavior.
- Check visual layout.
- Check browser console output.
- Check runtime behavior.
- Verify the real locally running application before reporting completion.

**Do a physical test yourself before letting the user test the fix, feature, or workflow.**

---

# 10. CRITICAL PHYSICAL QA STANDARD — NON-NEGOTIABLE

Perform **exhaustive 10/10 QA with zero skipped steps, assumptions, shortcuts, or unverified claims.**

First, inspect the entire implementation and architecture and derive a complete QA/test matrix from:

- actual codebase,
- requirements,
- features,
- integrations,
- dependencies,
- data flows,
- user workflows,
- authentication,
- authorization,
- configuration,
- supported environments.

**Do not assume the listed tests are sufficient.**

Test the complete integrated system end-to-end, including:

- Frontend/UI and every user-facing workflow
- Backend/services/business logic
- APIs and API contracts
- Database, persistence, migrations, and data integrity
- Authentication, authorization, roles, and permissions
- Third-party and internal integrations
- State management and synchronization
- Input validation and sanitization
- Loading states
- Success states
- Empty states
- Failure states
- Timeout states
- Retry states
- Recovery states
- Positive scenarios
- Negative scenarios
- Boundary scenarios
- Edge scenarios
- Unexpected-user scenarios
- Security-critical paths
- Responsive behavior
- Supported environments

**PASS requires actual execution and verification in the real integrated application.**

Never declare PASS based solely on:

- code inspection,
- compilation,
- static analysis,
- absence of obvious errors,
- expected behavior,
- assumptions,
- or confidence.

For **every failure or defect**:

**reproduce → identify root cause → fix completely → re-run failed test → test affected dependencies → perform regression testing → verify the fix in the integrated application.**

After **every code change**, re-test all functionality that could reasonably be affected by that change.

Do not introduce regressions while fixing another issue.

Before completion, verify there are **zero known or reproducible**:

- Broken workflows or integrations
- Frontend/backend mismatches
- API, database, authentication, or authorization failures
- Console, runtime, network, build, or server errors
- Dead buttons, links, routes, forms, or controls
- Placeholder, mock, fake, hardcoded, or incomplete production logic
- Missing loading, success, empty, error, timeout, or recovery states
- Unhandled edge cases
- Validation failures
- Regressions
- Broken dependencies
- Broken integration contracts
- Data integrity issues
- Persistence issues

---

## FINAL RELEASE GATE

Do NOT say **PASS, COMPLETE, DONE, READY, or PRODUCTION-READY** until:

1. Every identified requirement and feature has been tested.
2. Every applicable positive and negative scenario has been tested.
3. Every discovered failure has been fixed and re-tested.
4. Regression testing has passed across all affected functionality.
5. Frontend, backend, database, APIs, and integrations have been verified working together.
6. No known or reproducible blocking defects remain.
7. **Test evidence/results support every PASS claim.**

If something cannot be verified:

- **Do not mark it PASS.**
- Mark it **UNVERIFIED**.
- Clearly explain why.
- Continue testing or fixing wherever possible.

**Evidence over assumption.**

**Execution over inspection.**

**Verification over confidence.**

**Zero known gaps.**

---

# 11. MANDATORY QA SKILL SYNCHRONIZATION ON EVERY DEFECT & ANOMALY — NON-NEGOTIABLE

Whenever ANY new:

- defect,
- bug,
- issue,
- edge case,
- failed API contract,
- database schema mismatch,
- UI anomaly,
- regression,
- unexpected behavior,
- or user/CEO-reported problem

is discovered, the agent MUST immediately synchronize the QA skill.

### 11.1 Immediate Test Case Creation

Create an explicit, detailed test case and add it to:

`.agents/skills/openlyst-qa-tester/SKILL.md`

### 11.2 No Uncovered Fixes

NEVER apply a fix or close an issue without documenting its permanent regression test case in the QA Matrix, unless technically impossible; if impossible, document the reason in the final report.

### 11.3 Traceability

Every reported finding MUST have a corresponding:

`TC-XXX`

test case containing:

- exact reproduction steps,
- expected behavior,
- verification criteria,
- relevant preconditions,
- relevant test data,
- regression purpose.

### 11.4 Permanent Regression Shield

Every discovered defect becomes part of the permanent QA suite.

The purpose is not merely to fix today's defect.

The purpose is to ensure the defect **cannot silently return in a future change**.

---

# 12. FINAL OPERATING PRINCIPLE

The agent MUST operate according to this model:

## NORMAL WORK

**READ → UNDERSTAND → STATE ASSUMPTIONS → PLAN → ASK → WAIT → IMPLEMENT → VERIFY**

## EXPLICIT AUTONOMOUS WORK

**READ → UNDERSTAND → EXECUTE → FIX → VERIFY → REGRESSION-TEST → COMPLETE → REPORT**

## E2E TESTING

**READ AGENTS.md → READ QA SKILL → DETERMINE TC-N → TC-001 → TC-002 → ... → TC-N → FIX FAILURES → RE-TEST → REGRESSION → FINAL QA REPORT**

## PRODUCTION DEPLOYMENT

**READ AGENTS.md → PRE-FLIGHT CHECKS → BUILD → VERIFY → DEPLOY → POST-DEPLOY VERIFY → FINAL DEPLOYMENT REPORT**

### The governing rule

> **ASK BY DEFAULT.**
>
> **EXECUTE AUTONOMOUSLY ONLY WHEN AN EXPLICITLY APPROVED AUTONOMOUS TRIGGER IS INVOKED.**
>
> **WHEN AUTONOMOUS MODE IS ACTIVE, EXECUTE THE ENTIRE REQUESTED OPERATION CONTINUOUSLY WITHOUT INTERMEDIATE PERMISSION REQUESTS.**
>
> **AUTONOMOUS AUTHORITY IS SCOPED TO THE TRIGGERED OPERATION AND NEVER SELF-EXPANDS.**
>
> **WHEN THE OPERATION IS COMPLETE, RETURN TO APPROVAL MODE.**

# Changelog

All notable changes to Openlysts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Alternatives page broken cards + duplicates (zoom repro)**: Neon-fused alternative rows were never given the `resolved_name`/`repo` fields the UI card renders — searching "zoom" showed ~15 blank cards ("View details of this tool", "Compare undefined") plus raw markdown leaking into labels (`[Zoom](https://zoom.com)` as a card label AND a category). Root causes: (1) `ingestCatalogAlternative` stored rows without the enrichment `buildIndices` applies; (2) the file-load dedupe + ingest dedupe compared RAW names, so `Zoom` vs `[Zoom](https://zoom.com)` rows survived as duplicates; (3) alternatives were enriched before the 50k-repo catalog loaded, so repo cross-referencing (stars/language) never matched. Fixes: shared `enrichAlternative()` used by BOTH the file loader and the Neon-fusion path (clean markdown labels, `resolved_name`, `repo` object, honest scores, GitHub URL fallback for `owner/repo`), cleaned-name dedupe keys at file-load and ingest, and alternatives enrichment moved AFTER repositories load so real stars/language fuse (BigBlueButton ★9.2k, Jitsi-Meet ★29.9k …). Verified live: catalog dedupes 2,821 → 2,768, zoom query returns 19 rows with 0 missing names/repos and 0 duplicates, and the UI renders 19 unique named cards.
- **Sponsor/domain corrections**: all `openlysts.com` and legacy `openlysts.pages.dev` references replaced with the real domain `https://openlysts.dpdns.org` (`FUNDING.yml`, issue-template placeholder, `docs/index.html` canonical/OG/JSON-LD, `.env.example`, server CORS allow-list entry removed for pages.dev); CORS keeps `https://openlysts.dpdns.org` + Vercel preview origins; crawler user-agent + README badges/nav updated (legacy pages.dev animated-preview badge dropped)
- **Contact-info privacy (no fake-domain emails)**: Privacy Policy Grievance Officer now points to the in-app contact page instead of `privacy@openlysts.com` (en + hi); SECURITY.md reporting moved to GitHub private advisories (`…/security/advisories/new`) instead of `security@openlysts.com`; CODE_OF_CONDUCT enforcement via the GitHub repo; admin/dev scripts use `admin@example.com` placeholders — no personal or unowned-domain contact info anywhere
- **Public tree content**: `docs/PITCH.md` and `docs/OPENLYSTS_EXPLAINED.md` are private-only — excluded from the generated public tree, and the "New reader" README line linking them is stripped from the public README (kept in the private README)

### Added
- **One-command public release** (`scripts/public-release/publish-public.sh`): regenerates the sanitized public tree, runs the repo secrets scan + an independent secret-pattern scan + a private-file audit (fails on any leak), proves a fresh clone builds (`npm ci && npm run build`), commits with the owner identity only, and force-pushes `main` to `openlysts/Openlysts`; `DRY_RUN=1` stops before the push
- Public README is now generated from the private README design (animated typing title, shields, feature/security tables, FAQ) with only the private bits stripped (legacy pages.dev preview badge, `docs/API.md`/`docs/adr/` links)

### Fixed
- **Catalog delta-sync wedge (CRITICAL data lag)**: `ingestCatalogAlternative` stamped `updated_at = now()` on every ingest, permanently advancing the alt delta watermark so any bulk backfill older than the last in-RAM ingest never fused into the RAM catalog — the served counter stayed at 1,879 while Neon held 2,782 alternatives (docs claimed 2,800+). Fix: preserve the DB/file timestamp on ingest (no more self-bumping watermark) AND add a count-based self-heal in `syncDeltasFromDB` — when Neon has more DISTINCT alternative keys than RAM, the whole table is fused (upsert-safe, deduped). After the fix the served catalog converged 1,879 → **2,829 alternatives** (2,769 distinct Neon keys, 232 categories, 363 paid tools) — verified live

### Added
- **Two-repo public/private split**: full development source now lives in the private `openlysts/Openlysts_Development` (all 4 branches + full history, mirrored to `backup` + offline bundle); the future-public `openlysts/Openlysts` carries ONLY the generated public tree on `main` with a fresh history. `scripts/public-release/make-public-tree.mjs` rewritten with the exact public/private allow/deny rules (whole runnable product ships incl. `server/` + catalogs + `vercel.json`; private = `.agents/`, `AGENTS.md`, `tests/`, `QA_Audit/`, `dev/`, `scripts/`, internal docs, runtime state) and generates the public README, NOTICE, `.env.example` and a public `.gitignore` that commits `package-lock.json`
- **Repository restructure**: root clutter (alter.js, dom.html, screenshot.js, verifyUser.js, tc_list.txt, walkthrough.md, implementation_plan.md, Antigravity_skill.md, SKILLS_AND_RESOURCES.md, skills-lock.json, watch.json, scratch-clear-session.js, QA_Audit/) moved into a single `dev/` folder — root is now only app code, config, and docs
- `docs/OPENLYSTS_EXPLAINED.md` — the whole project explained for non-technical readers (layman's guide)
- `docs/PITCH.md` — client/partner pitch deck document (market, product, traction, business model, ways to work together)
- `docs/PUBLIC_REPOSITORY.md` rewritten for the two-repo model (development vs public, exact include/exclude rules, operator steps, risks)

### Added
- **Monetization Phase 1 (admin GUI-only)**: new Admin **Monetization** tab to schedule sponsored/featured placements (repository or alternative, badge label, sponsor name/URL, start/end dates, active toggle, live/scheduled/expired/paused status) and configure the footer Donate/Support button — no code or CLI needed; audit-logged
- **Sponsored badge**: amber `Sponsored` pill rendered on matching repository cards and alternative cards (disclosure always shown, sponsor name in tooltip); data comes from the new edge-cached `GET /api/sponsorships` endpoint; donation button in the footer appears only when enabled in admin
- **Neon Transfer Guard** (`server/services/transferGuard.js`): autonomous read-mode switching — at ≥85 % of the 5 GB/mo transfer cap the app serves RAM/edge-only (no Neon delta-syncs, enrichment or live table counts); mode surfaced in the Free-Tier Budget tab and tunable via `NEON_TRANSFER_WARN_PCT` / `NEON_TRANSFER_CRITICAL_PCT`
- **AwesomeSelfHosted ingestion source**: 1,100+ curated self-hosted web apps parsed per daily cycle (677 mapped paid→free rows on first run; catalogue grew 1879 → 2809 alternatives), whole-line GitHub repo detection incl. `([Source Code](…))` links, section→paid map with unambiguous counterparts only
- `docs/COST_AND_RESILIENCE.md` — Neon free-tier survival playbook (read-path layers, guard, upgrade ladder, backup-of-backup, measured waste); MONETIZATION.md §7 documents the shipped Phase-1 GUI workflows
- `scripts/auth/update_pw.js` and `scripts/tests/test_login_playwright.mjs` are now env-driven (`ADMIN_EMAILS` / `DEV_RESET_PASSWORD` / `TEST_LOGIN_EMAIL` / `TEST_LOGIN_PASSWORD`) — no personal accounts in source
- Funding: footer Sponsor button pre-configured to the PayPal sponsor page (`https://paypal.me/buymegoodcoffee/sponsor`, label "Sponsor Openlysts", managed live from Admin → Monetization) and `.github/FUNDING.yml` now lists that PayPal link first for GitHub's repo Sponsor button
- Permanent regression spec `tests/e2e/21-monetization.spec.js` (TC-MON-001…003) + QA-skill entries TC-MON-001…004; docs updated (ARCHITECTURE §L, docs/API.md, MONETIZATION §7, COST_AND_RESILIENCE)
- **E2E: 210/210 passing** (serial)

### Added
- `MONETIZATION.md` — revenue playbook (sponsored placements, Pro tier, API keys, affiliates, donations) that keeps the product free for users
- OpenSourceMacOSApps ingestion source (serhii-londar/open-source-mac-os-apps): 230 curated macOS app entries parsed per run, 224 rows added to Neon on first run; refreshed automatically by the daily ingestion cron
- `[COMMITS]` governance rule in `AGENTS.md` + `git-release-workflow/SKILL.md`: every commit must be authored by `Openlysts <openlysts@gmail.com>` only — no AI/agent names or generated footers, ever

### Fixed
- **Privacy**: removed the public support email from the Cookie Policy page (EN + Hindi), the Contact page mailto/Telegram links (Contact is now the in-app form only), `docs/legal/COOKIE_POLICY.md`, and the BUSL `LICENSE` contact line — no personal contact info is exposed anywhere in the app
- GitHub Actions billing 404: admin budget panel now shows a human-readable reason (token lacks repo-admin access; snapshot fallback shown) instead of raw API JSON
- Google Preferred Sources footer button: kept Google's official advanced implementation (publisher.js manual queue), added an automatic deeplink fallback if the library fails, centered and aligned the strip with the app UI, and clarified the copy ("Make Openlysts a Preferred Source on Google")
- Nested/duplicate `<footer>` landmark removed (OpenlystLayout wrapper is now a div; Footer.jsx is the single contentinfo)
- E2E hardening: TC-PERF-005 measures the Discover feed at its settled steady state, TC-PERF-003 warms the route before measuring navigation timing, TC-AUTH-013 waits for the SPA to mount (all were timing-dependent in dev mode)

### Added
- `LazySection` component for below-fold rendering (reduces initial DOM by ~86%)
- Admin access from the UI: admins now see an Admin Panel shortcut in the header, the mobile nav drawer, and the Developer Hub (route + all API endpoints remain server-side role-gated)
- Avatar system single source: shared `src/lib/avatars.js` presets render the saved avatar (preset archetype or custom image URL) in the header, drawer, and profile; custom avatar URL input added to the avatar studio
- Cloudflare Turnstile resilience: login/register widgets now surface load/expiry errors with a Retry control instead of silently disabling the submit button (fixes stuck forms in installed PWA windows)
- Neon network-transfer guard: `/api/admin/budget` now reports the 5 GB/mo transfer usage via the Neon Management API (`NEON_API_KEY` + `NEON_PROJECT_ID`), shown in the Free-Tier Budget panel with warning colors
- Google Preferred Sources badge: publisher.js + `google-add-preferred-source-btn` in the footer so readers can add Openlysts as a preferred source (AI Overviews / AI Mode / Top Stories); CSP updated to allow it
- Cookie Policy page (`/cookie-policy`, EN/HI) + footer link; legal drafts in `docs/legal/` (MSA, cookie policy, cyber-liability checklist, compliance gap checklist)
- BUSL 1.1 `LICENSE` with Additional Use Grant + `docs/PUBLIC_REPOSITORY.md` + `scripts/public-release/make-public-tree.mjs` for the public/private repo split
- `docs/SECURITY_OPERATIONS.md`: Cloudflare edge hardening guide (WAF custom rules, rate-limiting rules, bot fight mode, SEO crawler allowances)

### Fixed
- **CRITICAL**: Login rate limiter crashed every login with 500 (`ipKeyGenerator` v8 signature mismatch) — fixed to use v8's `ipKeyGenerator(ip, subnet)` form
- **CRITICAL**: Non-JSON content-type requests (e.g. `text/plain`) crashed with 500 instead of 400 — added global `req.body` guard after JSON parsers
- Discover page DOM slashed ~86% (9892 → ~1650 initial nodes): animated digits settle to static spans after the entrance spring, below-fold sections (Rising Stars, Personalized, AI, Fresh Drops) render only when scrolled near via `LazySection`, and the Trending feed renders the first 12 cards with lazy paging
- Horizontal overflow at ~1280px caused by the header actions row (nav link padding tightened at `xl`, Welcome-warp button deferred to `2xl`)
- Register/reset rate limiters were relaxed (`max: 5000`) outside production — they are now strict (`3`/`3`/`5`) in every environment, with only the window shortened in dev (60s vs 15 min) so the 429 path stays testable
- OAuth/login `redirect` query param was echoed raw into the URL and used unvalidated — it is now restricted to same-origin relative paths and an unsafe value is stripped from the address bar
- Welcome page had no `<nav>` landmark (now `motion.nav aria-label="Primary"`)
- Login/Register inputs now carry explicit `aria-required="true"`; register password input enforces `minLength={8}` natively
- Search page missing `<h1>` (now an accessible sr-only heading)
- `/admin` kept the previous page's document title (now "Admin Hypervisor")
- `/about` document title now contains "About" (matches route + nav tests)
- Contact form success/error banner now clears when the user edits the form
- Register page removed unverified "100,000+ developers" claim
- Compare tray width on small screens (`w-[calc(100vw-1.25rem)]`), quick-filter bar on mobile now spans the viewport with a scroll affordance instead of clipping chips
- Compare tray now clears on logout/account deletion; local bookmarks cleared on account deletion
- Login rate limiter now keys on IP **and** account email (per-email throttling); IPv6-safe via `ipKeyGenerator`

### Added
- Translation: chunked, parallel, code-safe description/README translation — long text is split on paragraph/sentence boundaries, fenced & inline code blocks pass through untranslated, results cached 24h keyed by language + content hash, 80k-char guard
- Translation language list centralized in `src/lib/languages.js` (single source of truth for the repo-detail dropdown, 19 languages)
- Neon budget snapshots: `ActionsBudgetSnapshot` table persists a daily GitHub Actions usage row; `/api/admin/budget` now reads the single `actions/billing/usage` endpoint and falls back to the persisted monthly total when the GitHub token is rate-limited (`billing-stale`/`snapshot-sum` states with snapshot date/days shown in the panel)
- Edge-cache refresh after every ingestion cycle: `server/services/edgeCachePurger.js` resets the in-process stats counters and best-effort purges the public stats/query URLs when Cloudflare (`CLOUDFLARE_ZONE_ID`/`CLOUDFLARE_API_TOKEN`) or a generic purge hook (`EDGE_CACHE_PURGE_URL`/`EDGE_CACHE_PURGE_TOKEN`) is configured; otherwise the existing 60s `s-maxage` bounds staleness
- Window-cron budget-health line: the daily `githubActionWindowCycle` prints a single stable `[WINDOW-CRON] BUDGET_HEALTH {neonPercent,actionsMinutesMonthly,counterDelta}` JSON line to the Actions log and persists the day's snapshot to Neon
- 12 new agent skills (postgresql-db-engineering, security-auditing, error-resilience, performance-core-web-vitals, responsive-mobile-first, accessibility-wcag, oauth-auth-flows, cicd-pipeline, pwa-offline-first, email-smtp, documentation-consistency, cost-infra-efficiency)
- 11 new agent rules (code-conventions, api-design-standards, database-query-standards, security-standards, react-component-standards, error-handling-standards, git-workflow-standards, deployment-checklist, performance-budget, testing-standards, accessibility-standards)
- 13 new QA automation test suites (260+ test cases total)
- 8 audit automation scripts (security, performance, code-quality, dependency, database, documentation, a11y, run-all)
- Post-change trigger script for automated regression testing
- Git hooks (pre-commit, pre-push) for quality gates
- CI/CD workflows (pr-checks, audit, deploy-staging)
- Docker support (Dockerfile, docker-compose.yml)
- Complete project documentation (CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md)
- GitHub templates (issue templates, PR template, CODEOWNERS, dependabot.yml)
- Editor configuration (.editorconfig, .prettierrc, .nvmrc)
- Test fixtures and shared test utilities
- API documentation (docs/API.md)
- Deployment guide (docs/DEPLOYMENT.md)

### Fixed
- Contact form no longer claims a fake successful email send when SMTP is unconfigured — the message is persisted to Neon and the API honestly returns `status: "accepted"` with "Message saved. We will reply to you by email." (`server/api/contact.js`)
- Malformed `q` search params (e.g. `?q={...}` JSON) now return a clean 400 `Invalid q: expected a string.` instead of a 500 deep inside the search engine
- Admin budget panel crashed with `repoPublic is not defined` when GitHub billing was unreachable (shorthand-typo in the rewrite above)
- React duplicate-copy crash on Discover page (via Vite dedupe config)
- Undefined USER_DELETED_SELF audit action constant
- Debug console.log leaking request bodies in entities API
- Missing db:seed script reference in package.json
- Incomplete user deletion cascade (missing bookmarks, cache, sessions cleanup)

### Security
- Added account lockout after 10 failed login attempts
- Added rate limiting on password reset token execution
- Removed TOTP secret from setup response body (returned in env only)
- Added comprehensive security audit automation

### E2E Test Suite
- All 207 E2E tests now pass (fixed A11Y timing, repo detail navigation, bookmark persistence, offline mode, tour overlay blocking)
- Added `tests/e2e/helpers.js` with `dismissTour()` utility for functional tests
- Updated spec selectors to use `getByRole` for visible elements only
- Added `waitForLoadState('networkidle')` to prevent timing-related failures
- Used local database repos for detail page tests (avoids GitHub API rate limits)

## [1.0.0] - 2026-08-16

### Added
- Initial release of Openlysts
- Repository discovery and search engine
- GitHub integration with repository metadata
- YouTube video integration
- Alternative repository recommendations
- Similarity engine for finding related repos
- User authentication (email/password, Google OAuth, GitHub OAuth)
- Two-factor authentication (TOTP, WebAuthn/Passkeys)
- User profiles with bookmarks and preferences
- Admin dashboard with user management
- Contact form and data rights requests
- Catalog engine with mega-catalogs
- Ingestion pipeline for repository data
- Caching layer with Redis/in-memory fallback
- Rate limiting and security headers
- Responsive design with dark/light themes
- 3D particle background animation
- Offline support with local runtime
- Comprehensive E2E test suite
- Deployment automation for Vercel/Neon

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2026-08-16 | Initial production release |
| Unreleased | 2026-09-01 | Skills, rules, tests, audits, docs |
| Unreleased | 2026-09-05 | Translation chunking/caching + language source; honest contact states; budget snapshots + edge-cache refresh + cron health line |

---

For a detailed list of changes, see the [commit history](https://github.com/openlysts/openlysts/commits/main).

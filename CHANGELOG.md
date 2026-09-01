# Changelog

All notable changes to Openlysts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

---

For a detailed list of changes, see the [commit history](https://github.com/openlysts/openlysts/commits/main).

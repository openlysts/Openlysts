# Openlysts - Complete Forensic System Audit Report

**Audit Date:** August 30, 2026
**Application:** Openlysts - Open Source Intelligence Platform
**Version:** 1.0.0
**Auditor:** Adil
**Scope:** Full codebase (1,377 files), all 18 audit areas.

---

## Executive Summary

Openlysts is an ambitious open-source intelligence platform with a well-architected in-memory catalog engine, multi-source ingestion pipeline, and a polished React frontend. The application is **substantially well-engineered** with strong patterns in security (CSRF, rate limiting, audit logging, MFA, OAuth), performance (in-memory inverted index, LRU cache, lazy loading), and resilience (dual-session store, advisory locks, timeout guards).

**24 genuine findings** across 18 audit areas. No Critical-severity vulnerabilities.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 5 |
| Medium | 11 |
| Low | 8 |

---

## Top High-Severity Findings

### F1.3/F15.1 - Password Hash Logging (HIGH)
- **Location:** server/api/auth.js:112-113
- Logs bcrypt hash to stdout on every login attempt. Enables offline brute-force.

### F2.5 - Session Cookie Name Mismatch (HIGH)
- **Location:** server/api/auth.js:155
- clearCookie uses 'openlysts.sid' but production cookie is '__Host-openlysts.sid'. Session never cleared on logout.

### F1.1/F2.1 - updateConfig Writes Secrets (HIGH)
- **Location:** server/functions/updateConfig.js
- Writes GITHUB_TOKEN to .env.local as plaintext. No allowlisting.

### F2.3 - Contact Form Email Header Injection (MEDIUM)
- **Location:** server/api/contact.js:56-58
- name/email passed directly into email headers without sanitization.

---

## Complete Findings by Area

### 1. System Audit
- F1.1 (HIGH): updateConfig bypasses file permission model
- F1.2 (MEDIUM): Contact form dev bypass returns fake success without production guard
- F1.3 (HIGH): Password hash logged on every login
- F1.4 (MEDIUM): Debug logs enable user enumeration
- F1.5 (LOW): Duplicate health endpoint

### 2. Security
- F2.1 (HIGH): updateConfig writes plaintext secrets
- F2.2 (MEDIUM): CSP unsafe-inline, missing upgrade-insecure-requests
- F2.3 (MEDIUM): Email header injection in contact form
- F2.4 (LOW): In-memory rate limits ineffective in serverless
- F2.5 (HIGH): Session cookie not cleared on logout
- F2.6 (LOW): Non-constant-time HMAC comparison

### 3. Architecture
- F3.1 (MEDIUM): Ingestion exceeds Vercel 60s timeout
- F3.2 (MEDIUM): Dual data source race conditions
- F3.3 (LOW): undici not in package.json

### 4. Performance
- F4.1 (MEDIUM): Alternatives cold-start loads entire dataset
- F4.2 (MEDIUM): Unbounded catalog memory growth
- F4.3 (LOW): getRepoReadme cascading fallback (24 requests)
- F4.4 (LOW): reclassifyRepos N+1 UPDATE pattern

### 5. Database
- F5.1 (MEDIUM): Session invalidation via fragile JSON LIKE
- F5.2 (LOW): ALTER TABLE error suppression too broad
- F5.3 (LOW): createTableIfMissing: false risks session loss

### 6. Authentication
- F6.1 (LOW): Used verification token auto-creates session

### 7. API
- F7.1 (MEDIUM): Query params auto-parsed into req.body
- F7.2 (LOW): syncBookmarks endpoint missing
- F7.3 (LOW): Admin API leaks error messages

### 8. UI/UX
- F8.1 (LOW): 7 unused import lint errors
- F8.2 (LOW): TypeScript import.meta.env missing types

### 9. QA
- F9.1 (MEDIUM): Only 2 test files in npm test pipeline

### 10-11. Responsive/Accessibility
- PWA infrastructure present. Radix UI baseline. Physical verification needed.

### 12. Business Logic
- F12.1 (LOW): getRandomRepo biased to first 1000 repos
- F12.2 (LOW): Hash ID collision risk in fallback

### 13. Deployment
- F13.1 (MEDIUM): CRON_SECRET only checked if env var set

### 14. Documentation
- F14.1 (LOW): ARCHITECTURE.md lists entityService.js, actual is entities.js
- F14.2 (LOW): 81 tests spanning TC-001 to TC-425 (inconsistent)
- F14.3 (LOW): BookmarkContext referenced but doesn't exist

### 15. Code Quality
- F15.1 (HIGH): Multiple [AUTH DEBUG] console.log statements
- F15.2 (LOW): Legacy SQLite db:reset script

### 16. Resilience
- All patterns well-designed: YouTube timeout, catalog degradation, session fallback, advisory locks

### 17. Data Integrity
- F17.1 (MEDIUM): bulkCreate uses individual INSERTs
- F17.2 (MEDIUM): data-rights.js queries wrong column name (user_id vs actor_id)

### 18. Cost/Efficiency
- Neon usage well-optimized. GitHub quota well-managed.

---

## Remediation Roadmap

### P0 - Before Next Deploy
1. Remove password hash logging (F1.3)
2. Fix session cookie name in logout (F2.5)
3. Remove debug email enumeration logs (F1.4)

### P1 - This Sprint
4. Remove/restrict updateConfig (F1.1/F2.1)
5. Sanitize contact form email headers (F2.3)
6. Fix data-rights.js column reference (F17.2)
7. Always require CRON_SECRET (F13.1)

### P2 - Within 2 Weeks
8. Split ingestion for Vercel timeout (F3.1)
9. Replace session LIKE with JSONB operators (F5.1)
10. Add alternatives pagination (F4.1)
11. Sanitize query param merging (F7.1)
12. Strengthen CSP headers (F2.2)

### P3 - Backlog
All LOW-severity items.

---

## Strengths
1. In-Memory Catalog Engine - 47K+ repos with sub-ms search
2. Security Architecture - CSRF, rate limiting, audit logging, MFA
3. Resilient Session Store - Dual-layer with graceful fallback
4. Multi-Source Ingestion - GitHub, trending, HN, awesome lists, RSS
5. Optimistic UI - 0ms bookmark operations with outbox sync
6. Video Cache Engine - Four-tier with timeout guards
7. Chunk Recovery - Auto-refresh on deployment chunk failure

---

*No modifications were made. Physical browser verification recommended for UI/accessibility items.*
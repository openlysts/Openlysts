# Cyber Liability Insurance — Requirements & Coverage Checklist

> **Status: REQUIREMENTS DOCUMENT.** Openlysts does **not** currently hold a cyber liability policy; this document is the internal checklist to obtain one and to keep it aligned with the product. Do not present this document as proof of insurance.

## 1. Why this matters
Openlysts stores personal data (names, emails, hashed passwords, bookmarks), integrates third-party services (GitHub, Neon, Cloudflare, Vercel), and is exposed to the public internet. A breach or service incident could trigger notification duties (DPDP Act 2023, GDPR), third-party claims, and business interruption. Cyber insurance transfers a portion of that financial risk and, importantly, funds breach-response services (forensics, legal, notification, credit monitoring).

## 2. Coverage to request (target limits: starter $1M–$2M per occurrence)

| Coverage block | What it pays for | Recommended minimum |
|---|---|---|
| **Network security & privacy liability** | Third-party claims from data breaches, unauthorized access, privacy violations | $1,000,000 |
| **Network business interruption** | Lost income from cyber incidents (incl. cloud provider outage knock-on) | $250,000–$500,000 |
| **Data recovery / forensic investigation** | Incident response, forensic analysis, restoration | $100,000+ sublimit |
| **Breach response costs** | Notification, call center, credit monitoring, legal counsel | $100,000–$250,000 |
| **Regulatory defense & fines** | Defense costs + statutory fines where insurable | Included where available |
| **Media liability (optional)** | Defamation/copyright claims from published content (reviews, comparisons) | $1,000,000 |
| **Social engineering / funds transfer fraud** | Phishing-induced fraud (relevant if you accept payments later) | $100,000 |
| **Cyber extortion / ransomware** | Ransom payments + negotiation | $250,000 |

## 3. Underwriting requirements — what the insurer will ask
1. **Access control**: MFA enforced for all admin/operator accounts (implemented: TOTP + passkeys in app; ensure operator accounts use it).
2. **Patching & dependencies**: documented dependency audit (`npm run audit:deps`) and update cadence.
3. **Backups & disaster recovery**: documented backup procedure (`npm run db:backup`) + recovery runbook. Neon branch/time-travel restore should be documented.
4. **Security testing**: regular audits (repo `scripts/audit/*`), plus at least an annual third-party penetration test as revenue grows.
5. **Logging & monitoring**: audit logs (implemented: `AuditLog` table), error tracking, anomaly detection.
6. **Data inventory**: list of stored PII and retention schedule (see Privacy Policy + COMPLIANCE_GAP_CHECKLIST.md).
7. **Incident response plan**: documented IR runbook with roles, notification SLA (72h DPDP / 72h GDPR), and carrier hotline.

## 4. Recommended carriers / approach
- Obtain quotes from cyber-focused brokers (e.g., Coalition, Vouch, specialty brokers) — online application process suits small SaaS.
- Re-quote at each growth milestone: >10k users, first paid tier, first enterprise contract, first employee handling data.
- Store policy + certificates in `docs/legal/insurance/` (do not commit sensitive policy PDFs to the public repo).

## 5. Ongoing obligations
- Notify the carrier of material changes (new paid tier, new jurisdictions, M&A).
- Keep the incident-response plan tested yearly (tabletop exercise).
- Keep this checklist current as the product changes.
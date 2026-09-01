# Security Policy

## Reporting a Vulnerability

The Openlysts team takes security seriously. We appreciate your efforts to responsibly disclose any security vulnerabilities you find.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send details to security@openlysts.com
2. **Subject line**: `[SECURITY] Brief description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Include

- **Type of vulnerability** (e.g., SQL injection, XSS, CSRF, authentication bypass)
- **Location** (URL, endpoint, parameter)
- **Impact** (what an attacker could achieve)
- **Reproduction steps** (detailed steps to verify)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix development | Depends on severity |
| Public disclosure | After fix is deployed |

### What We Promise

- **Acknowledgment** of your report within 48 hours
- **Regular updates** on the fix progress
- **Credit** in the security advisory (unless you prefer anonymity)
- **No legal action** for good-faith security research

## Security Measures

### Authentication & Authorization

- **Password hashing**: bcrypt with 12 rounds
- **Session management**: HTTP-only cookies with secure flags
- **Rate limiting**: 6 attempts per 15 minutes on auth endpoints
- **Account lockout**: Temporary lock after 10 failed attempts
- **MFA support**: TOTP (Google Authenticator) and WebAuthn/Passkeys
- **OAuth**: Google and GitHub OAuth2 with PKCE

### Data Protection

- **Parameterized queries**: All SQL uses prepared statements
- **Input validation**: Zod schemas on all API inputs
- **Output sanitization**: HTML entities escaped, no raw user content
- **CORS**: Restricted to same-origin in production
- **CSP**: Content Security Policy headers enabled
- **Secrets**: Never committed to repository, environment variables only

### Infrastructure Security

- **HTTPS**: Enforced via Vercel/Cloudflare
- **Headers**: Helmet.js security headers (HSTS, X-Frame-Options, etc.)
- **Database**: Neon PostgreSQL with SSL, connection pooling
- **Serverless**: Vercel with isolation, automatic scaling
- **Dependencies**: Automated vulnerability scanning (npm audit)

### Monitoring & Logging

- **Audit logging**: All auth events logged to database
- **Error tracking**: Generic error messages to users, detailed logs server-side
- **Rate limit headers**: X-RateLimit-* headers on all responses

## Scope

### In Scope

- Authentication and authorization flaws
- SQL injection, XSS, CSRF, and other injection attacks
- IDOR (Insecure Direct Object Reference) vulnerabilities
- Session management issues
- Sensitive data exposure
- Server-side request forgery (SSRF)
- Broken access control
- Cryptographic weaknesses
- Security misconfigurations

### Out of Scope

- Denial of service (DoS) attacks
- Social engineering
- Physical security
- Third-party services (Google, GitHub OAuth)
- Issues in development/local environments only

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | ✅ |
| Previous | ❌ |

Always run the latest version for security patches.

## Security Best Practices for Contributors

1. **Never commit secrets** — Use environment variables
2. **Validate all input** — Use Zod schemas
3. **Parameterize SQL** — Never use string concatenation
4. **Escape output** — Prevent XSS
5. **Rate limit** — Protect sensitive endpoints
6. **Log auth events** — Track suspicious activity
7. **Review dependencies** — Check for vulnerabilities

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/security-best-practices.html)

---

Thank you for helping keep Openlysts secure! 🔒

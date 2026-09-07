# Cookie Policy — Openlysts

> **Status: operational policy, ready for legal review.** This policy describes the actual storage mechanisms used by the application. It is written to match the code (see Privacy Policy page and `src/lib/settings.js`, `src/lib/bookmarks.js`, `src/lib/CompareContext.jsx`, `server/auth/session.js`).

**Effective date:** September 2026

## 1. What this policy covers
This policy explains what cookies and similar storage technologies ("trackers") Openlysts uses, why we use them, and the choices you have. It applies to openlysts.dpdns.org and any subdomains or installed-app (PWA) instance of the Service.

## 2. What we store and why

| Purpose | Mechanism | Data stored | Lifespan |
|---|---|---|---|
| **Essential — session (login)** | HTTP cookie (`connect.sid`) | Random session identifier; session state kept server-side in PostgreSQL | Until you sign out; otherwise expires per session policy |
| **Essential — CSRF & security** | SameSite=Lax cookie behavior + Origin checks | None stored | n/a |
| **Essential — security challenge (bot check)** | Cloudflare Turnstile widget | Turnstile may set its own tokens/local state in its iframe to validate you are human | Per Turnstile's policy (see cloudflare.com) |
| **Essential — preferences** | `localStorage` (`openlyst_theme`, settings) | Theme choice, GitHub token pool (stored only in your browser), background preference, onboarding state | Until you clear site data |
| **Essential — features** | `localStorage` (`openlyst_bookmarks`, `openlyst_compare`) | Guest bookmark ids and compare-tray selections; synced to your account when signed in | Until cleared or account deletion |
| **Performance — third party** | Google Publisher JS (Preferred Sources button, optional) | Only loaded to render the "Add to Preferred Sources" button; see Google's policy | Per Google policy |
| **Analytics** | None | Openlysts does **not** run third-party analytics trackers today | n/a |

## 3. Strictly necessary vs optional
- **Strictly necessary** (session, security, preferences): required for the Service to function. Not subject to consent banners under most regulations (e.g., GDPR Art. 5(3) exception, ePrivacy).
- **Optional/third-party**: we currently set none. If we introduce analytics or advertising cookies in the future, we will update this policy and obtain consent where required.

## 4. Your choices
- Sign out to end your session cookie.
- Use "Settings → Reset to defaults" or "Delete my account" to clear `localStorage`-backed data (bookmarks, compare, preferences).
- Clear site data via your browser (Settings → Privacy → Clear site data). For installed PWAs, clear storage from the browser menu or reinstall the app.
- Browser "Do Not Track" signals are honored by not running third-party analytics.

## 5. How to contact us
Privacy contact: submit requests through the Contact form on the Openlysts website — see the Privacy Policy for full rights (access, correction, erasure, portability, complaint to a supervisory authority).
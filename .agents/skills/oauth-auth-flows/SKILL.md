---
name: oauth-auth-flows
description: "OAuth and authentication flow skill for Openlysts. Covers OAuth2 PKCE, session management, MFA/TOTP, Passkey/WebAuthn, password reset flows, and token lifecycle management."
---

# OAuth & Authentication Flows Skill

## Role & Identity
Authentication Engineer ensuring Openlysts' auth stack is secure, resilient, and user-friendly. Every auth flow is a potential attack surface — treat it as such.

---

## 1. Openlysts Auth Architecture

```
Auth Flow Map:
├── Email/Password Registration
│   ├── Validate inputs (Zod/manual)
│   ├── Hash password (bcrypt, 12 rounds)
│   ├── Create user in "User" table
│   ├── Generate email verification token
│   ├── Send verification email
│   └── Return 201 (generic response, no enumeration)
│
├── Email/Password Login
│   ├── Rate limit check (loginRateLimiter)
│   ├── Account lockout check (in-memory)
│   ├── Find user by email_normalized
│   ├── Verify password (bcrypt.compare)
│   ├── Check account_status
│   ├── Check email_verified
│   ├── Check 2FA (TOTP + Passkeys)
│   │   ├── If 2FA required → return requires2FA: true
│   │   └── If no 2FA → create session
│   ├── Update last_login_at
│   └── Log audit event
│
├── OAuth (Google / GitHub)
│   ├── Generate state token (CSRF protection)
│   ├── Redirect to provider
│   ├── Handle callback
│   ├── Exchange code for profile
│   ├── findOrCreateOAuthUser
│   ├── Link to existing user if email matches
│   └── Create session
│
├── 2FA Verification
│   ├── TOTP: verify code via otplib
│   └── Passkey: verify via SimpleWebAuthn
│
├── Password Reset
│   ├── Request: generate token, hash it, store hash, send email
│   └── Execute: verify token hash, update password, invalidate sessions
│
└── Session Management
    ├── Express-session with connect-pg-simple
    ├── httpOnly, secure, sameSite cookies
    ├── 7-day max age
    └── Destroy on logout
```

---

## 2. OAuth2 Flow Implementation

### Google OAuth
```javascript
// 1. Generate authorization URL
const state = generateOAuthState(returnTo);
const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${redirectUri}&` +
  `response_type=code&` +
  `scope=openid email profile&` +
  `state=${state}`;

// 2. Handle callback
const { code, state } = req.query;
const { valid, redirect } = verifyOAuthState(state);
if (!valid) return res.redirect('/login?error=invalid_state');

const profile = await exchangeGoogleCode(code, req);
const { user } = await findOrCreateOAuthUser(profile, 'google');
req.session.userId = user.id;
```

### GitHub OAuth
```javascript
// Same pattern as Google
const url = `https://github.com/login/oauth/authorize?` +
  `client_id=${GITHUB_CLIENT_ID}&` +
  `redirect_uri=${redirectUri}&` +
  `scope=user:email&` +
  `state=${state}`;
```

### State Token (CSRF Protection)
```javascript
function generateOAuthState(returnTo) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expires = Date.now() + 10 * 60 * 1000; // 10 min
  return Buffer.from(JSON.stringify({ nonce, returnTo, expires })).toString('base64url');
}

function verifyOAuthState(state) {
  try {
    const data = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (Date.now() > data.expires) return { valid: false };
    return { valid: true, redirect: data.returnTo || '/discover' };
  } catch {
    return { valid: false };
  }
}
```

---

## 3. Session Security

### Cookie Configuration
```javascript
const cookieOptions = {
  httpOnly: true,           // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production',  // HTTPS only
  sameSite: 'lax',          // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/',
};
```

### Session Regeneration
```javascript
// On login, regenerate session ID to prevent fixation
req.session.regenerate((err) => {
  req.session.userId = user.id;
  req.session.save(() => {
    res.json({ success: true, user: sanitizeUser(user) });
  });
});
```

### Session Destruction (Logout)
```javascript
req.session.destroy((err) => {
  res.clearCookie(getSessionCookieName(), getSessionCookieOptions());
  res.json({ success: true });
});
```

---

## 4. MFA: TOTP

### Setup Flow
```javascript
// 1. Generate secret
import { authenticator } from 'otplib';
const secret = authenticator.generateSecret();

// 2. Generate QR code URL
const otpauthUrl = authenticator.keyuri(email, 'Openlysts', secret);

// 3. Store secret (NOT enabled yet)
await db.query('UPDATE "User" SET totp_secret = $1 WHERE id = $2', [secret, userId]);

// 4. Return QR to client
res.json({ secret, qrCodeUrl: otpauthUrl });
```

### Verification Flow
```javascript
import { verify } from 'otplib';

const result = await verify({ token: code, secret: user.totp_secret });
if (!result.valid) {
  return res.status(401).json({ error: true, message: 'Invalid code.' });
}
// Session upgrade: pendingUserId → userId
```

---

## 5. Password Reset Flow

### Step 1: Request Reset
```javascript
// Generate raw token, hash it, store hash
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

await db.query(
  'INSERT INTO "PasswordResetToken" (id, user_id, token_hash, expires_at, used, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
  [crypto.randomUUID(), userId, tokenHash, expiresAt, 0, new Date().toISOString()]
);

// Send email with rawToken (NOT the hash)
await sendPasswordResetEmail(email, rawToken, appUrl);
```

### Step 2: Execute Reset
```javascript
// Client sends rawToken, server hashes and looks up
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const { rows } = await db.query(
  'SELECT * FROM "PasswordResetToken" WHERE token_hash = $1 AND used = 0 AND expires_at > $2',
  [tokenHash, new Date().toISOString()]
);

if (rows.length === 0) {
  return res.status(400).json({ error: true, message: 'Invalid or expired link.' });
}

// Update password, mark token used, invalidate all sessions
```

---

## 6. Passkey (WebAuthn)

### Registration
```javascript
import { generateRegistrationOptions } from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  rpName: 'Openlysts',
  rpID: process.env.RP_ID || 'localhost',
  userID: user.id,
  userName: user.email,
});
// Store challenge, send options to client
```

### Authentication
```javascript
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const verification = await verifyAuthenticationResponse({
  response: body,
  expectedChallenge: storedChallenge,
  expectedOrigin: origin,
  expectedRPID: process.env.RP_ID || 'localhost',
  credential: storedCredential,
});
```

---

## 7. Common Auth Vulnerabilities

| Vulnerability | Prevention |
|---|---|
| Session fixation | Regenerate session ID on login |
| Brute force | Rate limiting + account lockout |
| Password spraying | Account lockout after N failures |
| Token reuse | Single-use tokens (mark `used = 1`) |
| Token leakage | Hash tokens before storage |
| CSRF | SameSite cookies + state parameter |
| Enumeraton | Generic responses for all auth failures |
| Timing attacks | Use constant-time comparison |
| Session hijacking | httpOnly + secure + sameSite cookies |
| OAuth state tampering | Signed state tokens with expiry |

---

## 8. Verification Checklist

- [ ] Session ID regenerated on login
- [ ] Tokens hashed before storage (SHA-256)
- [ ] Generic error messages (no enumeration)
- [ ] Rate limiting on login, register, reset-request
- [ ] Account lockout after 5 failed logins
- [ ] Password reset tokens expire after 1 hour
- [ ] All sessions invalidated on password change
- [ ] OAuth state parameter validated
- [ ] httpOnly cookies for session
- [ ] Secure cookies in production
- [ ] SameSite cookies for CSRF protection

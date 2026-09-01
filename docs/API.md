# Openlysts API Documentation

## Overview

The Openlysts API is built on Express 5 and provides endpoints for repository discovery, user management, and administrative functions.

**Base URL**: `http://localhost:3001` (development) or `https://openlysts.vercel.app` (production)

**Authentication**: Session-based (HTTP-only cookies) or API key in header.

## Response Format

All endpoints return responses in a consistent format:

### Success Response
```json
{
  "ok": true,
  "status": 200,
  "data": { ... }
}
```

### Error Response
```json
{
  "ok": false,
  "status": 400,
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

## Rate Limits

| Endpoint | Limit | Window | Headers |
|----------|-------|--------|---------|
| Auth endpoints | 6 requests | 15 minutes | X-RateLimit-* |
| Password reset | 3 requests | 15 minutes | X-RateLimit-* |
| General API | 100 requests | 1 minute | X-RateLimit-* |
| Admin endpoints | 30 requests | 1 minute | X-RateLimit-* |

## Endpoints

### Authentication

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "ok": true,
  "status": 201,
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- 400: Invalid input (email format, password strength)
- 409: Email already registered
- 429: Rate limit exceeded

---

#### `POST /api/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**
- 400: Invalid credentials
- 401: Account locked (too many failed attempts)
- 429: Rate limit exceeded

---

#### `POST /api/auth/logout`
Destroy the current session.

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "message": "Logged out successfully"
}
```

---

#### `GET /api/auth/me`
Get current authenticated user.

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "avatar_url": "https://..."
  }
}
```

**Errors:**
- 401: Not authenticated

---

#### `POST /api/auth/forgot-password`
Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "message": "If the email exists, a reset link has been sent"
}
```

---

#### `POST /api/auth/reset-password`
Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

---

### Two-Factor Authentication

#### `POST /api/mfa/totp/setup`
Initialize TOTP 2FA setup.

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/...",
  "backupCodes": ["XXXX-XXXX", "YYYY-YYYY"]
}
```

---

#### `POST /api/mfa/totp/verify`
Verify TOTP code during login.

**Request Body:**
```json
{
  "code": "123456"
}
```

---

### Entities (Repositories)

#### `GET /api/entities`
List repositories with filtering and pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` — Full-text search query
- `language` — Filter by programming language
- `sort` — Sort by: `stars`, `forks`, `recent`, `relevance`
- `license` — Filter by license type

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "repos": [
    {
      "id": "uuid",
      "full_name": "facebook/react",
      "description": "The library for web and native user interfaces.",
      "stars": 230000,
      "forks": 45000,
      "language": "JavaScript",
      "license": "MIT",
      "topics": ["ui", "javascript"],
      "is_oss": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75
  }
}
```

---

#### `GET /api/entities/:id`
Get a single repository by ID or full_name.

---

### Functions

#### `GET /api/functions/alternatives`
Get alternative repositories for a given repository.

**Query Parameters:**
- `repo` — Repository full_name (e.g., `facebook/react`)
- `limit` — Number of alternatives (default: 5)

---

#### `GET /api/functions/similar`
Get similar repositories based on vector similarity.

**Query Parameters:**
- `repo` — Repository full_name
- `limit` — Number of results (default: 10)

---

#### `GET /api/functions/trending`
Get trending repositories.

**Query Parameters:**
- `period` — Time period: `daily`, `weekly`, `monthly`
- `language` — Filter by language
- `limit` — Number of results (default: 20)

---

### User Profile

#### `GET /api/profile`
Get current user's profile.

---

#### `PUT /api/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Software developer",
  "avatar_url": "https://..."
}
```

---

#### `GET /api/profile/bookmarks`
Get user's bookmarked repositories.

---

#### `POST /api/profile/bookmarks`
Bookmark a repository.

**Request Body:**
```json
{
  "repository_id": "uuid"
}
```

---

### Admin (Requires admin role)

#### `GET /api/admin/users`
List all users with pagination.

---

#### `GET /api/admin/users/:id`
Get user details.

---

#### `PUT /api/admin/users/:id`
Update user (role, status).

**Request Body:**
```json
{
  "role": "admin",
  "is_active": true
}
```

---

#### `DELETE /api/admin/users/:id`
Delete a user and all associated data.

**Cascade:**
- Sessions
- Bookmarks
- Audit logs
- MFA secrets
- Password reset tokens

---

### Contact

#### `POST /api/contact`
Submit a contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "subject": "Question",
  "message": "How do I...?"
}
```

---

### Data Rights (GDPR/CCPA)

#### `POST /api/data-rights/export`
Request data export.

---

#### `POST /api/data-rights/delete`
Request account deletion.

---

### Health

#### `GET /api/health`
Check API health status.

**Response (200):**
```json
{
  "ok": true,
  "status": 200,
  "service": "openlysts-api",
  "version": "1.0.0",
  "timestamp": "2026-09-01T00:00:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Authentication required |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource doesn't exist |
| 409 | Conflict — Resource already exists |
| 429 | Rate Limited — Too many requests |
| 500 | Internal Server Error — Unexpected error |

## Security Notes

- All passwords are bcrypt-hashed (12 rounds)
- Sessions use HTTP-only, Secure cookies
- CSRF protection via SameSite cookies
- Rate limiting on all endpoints
- Input validation via Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via output sanitization

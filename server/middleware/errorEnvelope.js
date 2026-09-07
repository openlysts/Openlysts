/**
 * Structured API error envelope — ADDITIVE + backward compatible.
 *
 * Existing route code already responds with `{ error: true, message }`.
 * This module standardizes those responses by ADDING `code`, `requestId`,
 * and optional `details` — WITHOUT removing or renaming the fields the
 * frontend already reads (`error`, `message`). New-code callers may use
 * `sendApiError` / `apiError` directly.
 */

/** Stable machine-readable codes mapped from common message fragments. */
export function inferErrorCode(status, message = '') {
  if (typeof status === 'number' && status >= 500) return 'INTERNAL_ERROR';
  const msg = String(message || '').toLowerCase();
  const table = [
    ['rate limit', 'RATE_LIMITED'],
    ['too many login', 'RATE_LIMITED'],
    ['too many registration', 'RATE_LIMITED'],
    ['too many reset', 'RATE_LIMITED'],
    ['authentication required', 'AUTH_REQUIRED'],
    ['unauthorized', 'AUTH_REQUIRED'],
    ['insufficient permissions', 'FORBIDDEN'],
    ['account suspended', 'ACCOUNT_SUSPENDED'],
    ['account disabled', 'ACCOUNT_DISABLED'],
    ['account locked', 'ACCOUNT_LOCKED'],
    ['invalid email or password', 'INVALID_CREDENTIALS'],
    ['session expired', 'SESSION_EXPIRED'],
    ['csrf', 'CSRF_INVALID'],
    ['origin', 'CSRF_INVALID'],
    ['not allowed by cors', 'CORS_DENIED'],
    ['maintenance', 'MAINTENANCE_MODE'],
    ['registration', 'REGISTRATION_DISABLED'],
    ['consent', 'CONSENT_REQUIRED'],
    ['security check', 'CHALLENGE_FAILED'],
    ['2fa', 'MFA_REQUIRED'],
    ['passkey', 'PASSKEY_FAILED'],
    ['email and password are required', 'VALIDATION_ERROR'],
    ['password is required', 'VALIDATION_ERROR'],
    ['password must', 'VALIDATION_ERROR'],
    ['name must', 'VALIDATION_ERROR'],
    ['invalid email', 'VALIDATION_ERROR'],
    ['invalid ', 'VALIDATION_ERROR'],
    ['required', 'VALIDATION_ERROR'],
    ['not found', 'NOT_FOUND'],
    ['unknown entity', 'UNKNOWN_ENTITY'],
    ['method not allowed', 'METHOD_NOT_ALLOWED'],
    ['no repositories found', 'NOT_FOUND'],
    ['missing', 'VALIDATION_ERROR'],
  ];
  for (const [fragment, code] of table) {
    if (msg.includes(fragment)) return code;
  }
  if (typeof status === 'number') {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'AUTH_REQUIRED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 405) return 'METHOD_NOT_ALLOWED';
    if (status === 409) return 'CONFLICT';
    if (status === 422) return 'VALIDATION_ERROR';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 503) return 'SERVICE_UNAVAILABLE';
  }
  return 'API_ERROR';
}

/**
 * Create an Error-like object carrying HTTP status + machine code so the
 * centralized error middleware can render the standard envelope.
 */
export function apiError(status, message, code, details) {
  const err = new Error(message);
  err.status = status || 500;
  err.code = code || inferErrorCode(err.status, message);
  if (details !== undefined) err.details = details;
  return err;
}

/**
 * Send a structured error response directly (for route handlers that do not
 * delegate to `next()`).
 *
 * res.shape = {
 *   error: true,
 *   message,
 *   code,          // NEW additive field
 *   requestId,     // NEW additive field
 *   details,       // NEW additive field (optional)
 * }
 */
export function sendApiError(res, status, message, code, details) {
  const body = {
    error: true,
    message,
    code: code || inferErrorCode(status, message),
  };
  if (res.req?.requestId) body.requestId = res.req.requestId;
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

/**
 * RequestId guard for a request object — used by middleware mounted before
 * the request logger so errors always carry a traceable id.
 */
export function ensureRequestId(req) {
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return req.requestId;
}

/**
 * ADDITIVE response envelope middleware.
 *
 * Wraps res.json so every outbound object with `error === true` automatically
 * gains a stable machine `code` and the request's `requestId` — WITHOUT
 * rewriting the ~124 inline `{ error: true, message }` responses across the
 * routers. Backward compatible: existing fields are preserved untouched.
 */
export function responseErrorEnvelope(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && body.error === true) {
      if (!body.code) {
        body.code = inferErrorCode(res.statusCode, body.message);
      }
      if (!body.requestId) {
        body.requestId = ensureRequestId(req);
      }
    }
    return originalJson(body);
  };
  next();
}

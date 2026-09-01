/**
 * Shared API test utilities for Openlysts
 * Used by both E2E and server tests
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Make an API request with standard headers
 */
async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, cookies = '' } = options;

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (cookies) {
    fetchOptions.headers['Cookie'] = cookies;
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data,
    ok: response.ok,
  };
}

/**
 * Make an authenticated API request
 */
async function authenticatedRequest(endpoint, sessionCookie, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    cookies: `connect.sid=${sessionCookie}`,
  });
}

/**
 * Register a test user
 */
async function registerUser(userData) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: userData,
  });
}

/**
 * Login a test user
 */
async function loginUser(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/**
 * Get session cookie from login response
 */
function extractSessionCookie(response) {
  const setCookie = response.headers['set-cookie'] || '';
  const match = setCookie.match(/connect\.sid=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Check rate limit headers
 */
function checkRateLimitHeaders(headers) {
  return {
    limit: headers['x-ratelimit-limit'],
    remaining: headers['x-ratelimit-remaining'],
    reset: headers['x-ratelimit-reset'],
  };
}

/**
 * Wait for rate limit window to pass
 */
async function waitForRateLimit(ms = 60000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate error response format
 */
function validateErrorResponse(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }

  if (!response.data) {
    throw new Error('Response body is empty');
  }

  if (response.data.ok !== false) {
    throw new Error('Expected ok: false in error response');
  }

  if (!response.data.error) {
    throw new Error('Expected error field in response');
  }

  return true;
}

/**
 * Validate success response format
 */
function validateSuccessResponse(response, expectedStatus = 200) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }

  if (!response.ok) {
    throw new Error('Expected ok: true');
  }

  return true;
}

/**
 * Check security headers
 */
function validateSecurityHeaders(headers) {
  const required = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
  ];

  const missing = required.filter((h) => !headers[h]);

  if (missing.length > 0) {
    throw new Error(`Missing security headers: ${missing.join(', ')}`);
  }

  return true;
}

/**
 * Check for SQL injection patterns in response
 */
function checkForSqlInjection(response) {
  const body = JSON.stringify(response.data || '');
  const sqlPatterns = [
    /syntax error/i,
    /pg_/i,
    /postgresql/i,
    /sql/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(body)) {
      throw new Error(`Potential SQL injection leak: ${pattern}`);
    }
  }

  return true;
}

/**
 * Check for XSS in response
 */
function checkForXss(response) {
  const body = JSON.stringify(response.data || '');
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(body)) {
      throw new Error(`Potential XSS leak: ${pattern}`);
    }
  }

  return true;
}

module.exports = {
  BASE_URL,
  apiRequest,
  authenticatedRequest,
  registerUser,
  loginUser,
  extractSessionCookie,
  checkRateLimitHeaders,
  waitForRateLimit,
  validateErrorResponse,
  validateSuccessResponse,
  validateSecurityHeaders,
  checkForSqlInjection,
  checkForXss,
};

/**
 * Request/Response Logging Middleware for Openlysts
 * Logs every incoming request with timing, status, and context
 *
 * Usage:
 *   import { requestLogger } from '../middleware/requestLogger.js';
 *   app.use(requestLogger());
 */

import { apiLogger } from './logger.js';
import { ensureRequestId } from './errorEnvelope.js';
import { errorTracker } from '../services/errorTracker.js';

export function requestLogger(options = {}) {
  const { skipPaths = ['/api/health'], slowThreshold = 1000 } = options;

  return (req, res, next) => {
    // Skip health checks and static assets
    if (skipPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const start = Date.now();
    ensureRequestId(req);
    const requestId = req.requestId;

    // Capture the full path at request START — req.path mutates while the
    // request descends into mounted routers, so reading it at response time
    // yields a router-relative fragment (e.g. "/x" instead of "/api/fns/x").
    const fullPath = req.originalUrl || req.url;

    // Attach request ID
    res.setHeader('X-Request-Id', requestId);

    // Capture original end
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - start;
      const logData = {
        requestId,
        method: req.method,
        path: fullPath,
        statusCode: res.statusCode,
        duration,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']?.substring(0, 100),
        userId: req.session?.userId || req.user?.id || null,
        contentLength: res.getHeader('content-length') || 0,
      };

      // Feed 4xx/5xx responses to the error tracker for the admin dashboard.
      // 5xx errors already routed through the centralized error handler are
      // marked in res.locals.errorTracked so we never double-count them.
      if (res.statusCode >= 500 && !res.locals.errorTracked) {
        errorTracker.capture(
          new Error(`HTTP ${res.statusCode} on ${req.method} ${fullPath}`),
          {
            code: 'HTTP_' + res.statusCode,
            status: res.statusCode,
            method: req.method,
            path: fullPath,
            requestId,
            userId: req.user?.id,
          }
        );
        apiLogger.error('Request completed', logData);
      } else if (res.statusCode >= 400) {
        apiLogger.warn('Request completed', logData);
      } else if (duration > slowThreshold) {
        apiLogger.warn('Slow request', logData);
      } else {
        apiLogger.info('Request completed', logData);
      }

      originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Error logging middleware (place after routes)
 */
export function errorLogger(err, req, res, next) {
  ensureRequestId(req);
  const errorData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.id || req.session?.userId || null,
    ip: req.ip || req.connection?.remoteAddress,
  };

  errorTracker.capture(err, {
    code: err.code || 'UNHANDLED_ERROR',
    status: err.status || 500,
    method: req.method,
    path: req.path,
    requestId: req.requestId,
    userId: req.user?.id,
    stack: err.stack,
  });

  apiLogger.error('Unhandled error', errorData);

  // Don't leak error details in production
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal server error' : err.message;

  res.status(status).json({
    error: true,
    message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
    ...(err.details !== undefined ? { details: err.details } : {}),
  });
}

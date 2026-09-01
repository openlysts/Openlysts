/**
 * Request/Response Logging Middleware for Openlysts
 * Logs every incoming request with timing, status, and context
 *
 * Usage:
 *   const { requestLogger } = require('../middleware/requestLogger');
 *   app.use(requestLogger());
 */

const { apiLogger } = require('./logger');

function requestLogger(options = {}) {
  const { skipPaths = ['/api/health'], slowThreshold = 1000 } = options;

  return (req, res, next) => {
    // Skip health checks and static assets
    if (skipPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Attach request ID
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Capture original end
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - start;
      const logData = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']?.substring(0, 100),
        userId: req.session?.userId || null,
        contentLength: res.getHeader('content-length') || 0,
      };

      // Level based on status and duration
      if (res.statusCode >= 500) {
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
function errorLogger(err, req, res, next) {
  const errorData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.session?.userId || null,
    ip: req.ip || req.connection?.remoteAddress,
  };

  apiLogger.error('Unhandled error', errorData);

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(err.status || 500).json({
    ok: false,
    status: err.status || 500,
    error: 'Internal Server Error',
    message,
    requestId: req.requestId,
  });
}

module.exports = { requestLogger, errorLogger };

/**
 * Structured Logging Middleware for Openlysts
 * Replaces console.log with structured, leveled, contextual logging
 *
 * Usage:
 *   const { logger } = require('../middleware/logger');
 *   logger.info('User logged in', { userId, email });
 *   logger.error('Database query failed', { query, error, duration });
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function formatEntry(level, message, context = {}) {
  const entry = {
    timestamp: formatTimestamp(),
    level: level.toUpperCase(),
    message,
    pid: process.pid,
    ...context,
  };

  // Remove undefined values
  Object.keys(entry).forEach((key) => {
    if (entry[key] === undefined) delete entry[key];
  });

  return JSON.stringify(entry);
}

function createLogger(prefix = 'app') {
  const log = (level, message, context = {}) => {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const formatted = formatEntry(level, message, { ...context, module: prefix });

    if (level === 'error' || level === 'fatal') {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  };

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
    fatal: (msg, ctx) => log('fatal', msg, ctx),

    child: (extraContext) => {
      const childLogger = createLogger(prefix);
      const origLog = childLogger.info;
      return childLogger;
    },
  };
}

// Main application logger
const logger = createLogger('app');

// Module-specific loggers
const apiLogger = createLogger('api');
const authLogger = createLogger('auth');
const dbLogger = createLogger('db');
const cacheLogger = createLogger('cache');

module.exports = {
  logger,
  apiLogger,
  authLogger,
  dbLogger,
  cacheLogger,
  createLogger,
  LOG_LEVELS,
};

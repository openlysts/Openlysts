// ─── Client Error Intake Router ─────────────────────────────────────
// Mounted at /api/client-errors. Receives error reports from the browser
// (window.onerror / unhandledrejection / ErrorBoundary) and feeds the
// in-memory error tracker. No auth: any visitor may report. Strictly
// rate-limited and size-capped to stay free-tier safe.

import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { errorTracker } from '../services/errorTracker.js';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

const clientErrorSchema = z.object({
  message: z.string().optional(),
  error: z.object({
    message: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
  stack: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  component: z.string().optional(),
}).passthrough();

const intakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 reports per 15 min per IP is generous for real users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, code: 'RATE_LIMITED', message: 'Too many error reports. Please slow down.' },
});

function cleanStr(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, maxLen);
}

router.post('/report', intakeLimiter, validateBody(clientErrorSchema), (req, res) => {
  const body = req.validatedBody || {};
  const rawMessage = body.message || body.error?.message || '';
  // Basic spam guard: ignore empty reports
  if (!rawMessage) {
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'message is required' });
  }
  const message = cleanStr(rawMessage, 500);
  const stack = cleanStr(body.stack || body.error?.stack || '', 4000);
  const source = cleanStr(body.source || 'unknown', 50); // 'window.onerror' | 'unhandledrejection' | 'react'
  const url = cleanStr(body.url || '', 500);
  const component = cleanStr(body.component || '', 200);
  const userAgent = cleanStr(req.headers['user-agent'] || '', 200);

  errorTracker.capture(new Error(message), {
    code: 'CLIENT_' + (component || source || 'ERROR').toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 40),
    status: 400,
    method: 'CLIENT',
    path: url || `client:${source}`,
    requestId: req.requestId,
    stack,
    details: { source, url, component, userAgent },
  });

  res.status(202).json({ ok: true, message: 'Report received' });
});

export default router;

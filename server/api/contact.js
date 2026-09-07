import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { generalRateLimiter } from '../auth/middleware.js';

import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').max(200, 'Email cannot exceed 200 characters'),
  category: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, 'Message is required').max(5000, 'Message cannot exceed 5000 characters'),
}).strict();

function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.post('/send', generalRateLimiter, validateBody(contactSchema), async (req, res) => {
  const { name, email, message } = req.validatedBody;

  const safeName = sanitizeText(name).replace(/[\r\n]/g, "").substring(0, 100);
  const safeMessage = sanitizeText(message);
  const safeEmail = sanitizeText(email).replace(/[\r\n]/g, "").substring(0, 200);

  // Persist to database
  try {
    await db.query(
      `INSERT INTO "ContactMessage" (id, name, email, message) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), safeName, safeEmail, safeMessage]
    );
  } catch (dbErr) {
    console.error('[CONTACT DB ERROR]', dbErr.message);
    return res.status(500).json({ status: 'error', message: 'Failed to save contact message. Please try again later.' });
  }

  // Create reusable transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (!process.env.SMTP_USER) {
    // Honest state: the message IS saved (persisted above), but no email was
    // sent — never claim success without an SMTP delivery.
    console.log('[CONTACT] SMTP not configured — message persisted, email skipped.');
    return res.json({ status: 'accepted', message: 'Message saved. We will reply to you by email.' });
  }

  try {
    await transporter.verify();

    await transporter.sendMail({
      from: `"Openlysts Support Desk" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'openlysts@gmail.com'}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'openlysts@gmail.com',
      replyTo: safeEmail,
      subject: `Openlysts Contact Form: Message from ${safeName}`,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\n\nMessage:\n${safeMessage}`,
    });

    res.json({ status: 'success', message: 'Email sent successfully!' });
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Email sending failed: SMTP credentials are not configured or are invalid.' 
      });
    }
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error';
    res.status(500).json({ status: 'error', message: `Email sending failed: ${msg}` });
  }
});

export default router;

import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { generalRateLimiter } from '../auth/middleware.js';

const router = express.Router();

function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.post('/send', generalRateLimiter, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are required.' });
  }

  const safeName = sanitizeText(name);
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
    // Continue even if DB fails, so we can try to send the email
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
    console.log('[DEV] Simulating successful email send (no SMTP_USER configured).');
    return res.json({ status: 'success', message: 'Email sent successfully! (Simulated)' });
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

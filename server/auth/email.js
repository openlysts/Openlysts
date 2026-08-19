// ─── Email Sending ──────────────────────────────────────────────────
// Uses existing Nodemailer + Gmail SMTP config for password reset
// and email verification emails.

import nodemailer from 'nodemailer';

/**
 * Create a reusable SMTP transporter.
 * Uses the same SMTP config as the existing contact form.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send password reset email.
 * @param {string} toEmail
 * @param {string} token - Raw (unhashed) token for the URL
 * @param {string} appUrl - Base application URL
 */
export async function sendPasswordResetEmail(toEmail, token, appUrl) {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Openlysts" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Openlysts — Reset Your Password',
    text: `You requested a password reset for your Openlysts account.\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\n— Openlysts`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e0e0e0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #f8fafc; margin: 0;">Openlysts</h1>
        </div>
        <h2 style="font-size: 18px; color: #f8fafc; margin-bottom: 8px;">Reset Your Password</h2>
        <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6;">You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #8b5cf6; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 11px; text-align: center;">Openlysts — Open Source Discovery</p>
      </div>
    `,
  });
}

/**
 * Send email verification email.
 * @param {string} toEmail
 * @param {string} token - Raw (unhashed) token for the URL
 * @param {string} appUrl - Base application URL
 */
export async function sendVerificationEmail(toEmail, token, appUrl) {
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Openlysts" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Openlysts — Verify Your Email',
    text: `Welcome to Openlysts!\n\nPlease verify your email by clicking this link (expires in 24 hours):\n${verifyUrl}\n\n— Openlysts`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e0e0e0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #f8fafc; margin: 0;">Openlysts</h1>
        </div>
        <h2 style="font-size: 18px; color: #f8fafc; margin-bottom: 8px;">Verify Your Email</h2>
        <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6;">Welcome to Openlysts! Please verify your email address to access all features.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #8b5cf6; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="color: #555; font-size: 11px; text-align: center;">Openlysts — Open Source Discovery</p>
      </div>
    `,
  });
}

/**
 * Check if SMTP is configured.
 * @returns {boolean}
 */
export function isSmtpConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

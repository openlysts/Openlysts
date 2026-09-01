---
name: email-smtp
description: "Email and SMTP skill for Openlysts. Covers email template design, deliverability, nodemailer configuration, testing without live SMTP, and email flow verification."
---

# Email & SMTP Skill

## Role & Identity
Email Engineer ensuring Openlysts' transactional emails are delivered, readable, and secure.

---

## 1. Openlysts Email Flows

| Email Type | Trigger | Template |
|---|---|---|
| Verification | Registration | "Verify your email" with link |
| Password Reset | Reset request | "Reset your password" with link |
| Duplicate Registration | Already-registered email | "Account already exists" warning |

---

## 2. Nodemailer Configuration

```javascript
// server/auth/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
```

---

## 3. Email Templates

### Verification Email
```javascript
export async function sendVerificationEmail(email, token, appUrl) {
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: '"Openlysts" <noreply@openlysts.app>',
    to: email,
    subject: 'Verify your Openlysts account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to Openlysts!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
```

### Password Reset Email
```javascript
export async function sendPasswordResetEmail(email, token, appUrl) {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: '"Openlysts" <noreply@openlysts.app>',
    to: email,
    subject: 'Reset your Openlysts password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
```

---

## 4. Testing Without Live SMTP

### Dev Mode: Log to Console
```javascript
if (!isSmtpConfigured()) {
  console.log('\n==================================================');
  console.log(`[LOCAL DEV] Email Verification Link for ${email}:`);
  console.log(verifyUrl);
  console.log('==================================================\n');
  return; // Don't actually send
}
```

### Ethereal (Fake SMTP for Testing)
```javascript
import nodemailer from 'nodemailer';

// Create test account
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: { user: testAccount.user, pass: testAccount.pass },
});

// Send email
const info = await transporter.sendMail(mailOptions);
console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
```

---

## 5. Deliverability Best Practices

| Practice | Implementation |
|---|---|
| SPF record | Configure DNS TXT record |
| DKIM signing | Enable in SMTP provider |
| DMARC policy | Set `p=quarantine` minimum |
| Unsubscribe link | Required for marketing emails |
| Plain text fallback | Always include text version |
| Responsive design | Use table-based layouts |
| Avoid spam triggers | No "FREE!!!", ALL CAPS |
| Consistent sender | Same from address always |

---

## 6. Email Security

### Token in Email Links
- Tokens are single-use (mark `used = 1` after verification)
- Tokens expire (verification: 24h, reset: 1h)
- Raw token in URL, SHA-256 hash stored in DB
- Never log token values

### Anti-Enumeration
- Same response for existing and non-existing emails
- "If an account exists with that email, ..."

---

## 7. Verification Checklist

- [ ] SMTP configured or dev fallback works
- [ ] Verification email sent on registration
- [ ] Reset email sent on password reset request
- [ ] Tokens expire correctly
- [ ] Tokens are single-use
- [ ] Email templates render correctly
- [ ] Links use HTTPS in production
- [ ] No tokens logged in console
- [ ] Generic responses (no email enumeration)

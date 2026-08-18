import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are required.' });
  }

  // Create reusable transporter object using SMTP transport
  // Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // e.g. reviewzxone@gmail.com
      pass: process.env.SMTP_PASS, // App password
    },
  });

  try {
    // Verify connection configuration
    await transporter.verify();

    // Send email
    await transporter.sendMail({
      from: `"${name}" <${email}>`, // sender address
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'reviewzxone@gmail.com', // list of receivers
      replyTo: email,
      subject: `Openlysts Contact Form: Message from ${name}`, // Subject line
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, // plain text body
    });

    res.json({ status: 'success', message: 'Email sent successfully!' });
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    // If auth fails, provide a specific error so the user knows to configure .env
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Email sending failed: SMTP credentials are not configured or are invalid on the server (.env.local).' 
      });
    }
    res.status(500).json({ status: 'error', message: `Email sending failed: ${error.message}` });
  }
});

export default router;

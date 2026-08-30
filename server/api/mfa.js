import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../auth/middleware.js';
import { generateSecret, generateURI, verify } from 'otplib';
import qrcode from 'qrcode';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import crypto from 'crypto';

const router = Router();
const rpName = 'Openlysts';

function getExpectedOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.get?.('host') || 'openlysts.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const cleanHost = host.replace(':3001', ':5173');
  return (process.env.APP_URL || `${proto}://${cleanHost}`).replace(/\/$/, '');
}

// ─── TOTP (Authenticator App) ──────────────────────────────────────────

router.post('/totp/setup', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT email FROM "User" WHERE id = $1', [req.user.id]);
    const user = rows[0];

    const secret = generateSecret();
    const otpauth = generateURI({ label: user.email, issuer: rpName, secret });
    const imageUrl = await qrcode.toDataURL(otpauth);

    req.session.pendingTotpSecret = secret;

    res.json({ success: true, secret, imageUrl });
  } catch (error) {
    console.error('[MFA] TOTP setup error:', error);
    res.status(500).json({ error: true, message: 'Failed to setup TOTP' });
  }
});

router.post('/totp/verify', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const secret = req.session.pendingTotpSecret;

    if (!secret) {
      return res.status(400).json({ error: true, message: 'No pending TOTP setup found.' });
    }

    const result = await verify({ token: code, secret });
    const isValid = result.valid;

    if (!isValid) {
      return res.status(400).json({ error: true, message: 'Invalid verification code.' });
    }

    await db.query('UPDATE "User" SET totp_secret = $1, totp_enabled = 1 WHERE id = $2', [secret, req.user.id]);
    delete req.session.pendingTotpSecret;

    res.json({ success: true, message: 'TOTP enabled successfully.' });
  } catch (error) {
    console.error('[MFA] TOTP verify error:', error);
    res.status(500).json({ error: true, message: 'Failed to verify TOTP' });
  }
});

router.post('/totp/disable', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE "User" SET totp_secret = NULL, totp_enabled = 0 WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'TOTP disabled successfully.' });
  } catch (error) {
    console.error('[MFA] TOTP disable error:', error);
    res.status(500).json({ error: true, message: 'Failed to disable TOTP' });
  }
});

// ─── PASSKEYS (WebAuthn) ─────────────────────────────────────────────

router.post('/passkey/register/options', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name, email FROM "User" WHERE id = $1', [req.user.id]);
    const user = rows[0];

    const { rows: passkeys } = await db.query('SELECT credential_id FROM "Passkey" WHERE user_id = $1', [req.user.id]);

    const options = await generateRegistrationOptions({
      rpName,
      rpID: new URL(getExpectedOrigin(req)).hostname,
      userID: new Uint8Array(Buffer.from(req.user.id)),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: passkeys.map(pk => ({
        id: pk.credential_id, 
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    req.session.currentChallenge = options.challenge;

    res.json({ success: true, options });
  } catch (error) {
    console.error('[MFA] Passkey reg options error:', error);
    res.status(500).json({ error: true, message: 'Failed to generate passkey options' });
  }
});

router.post('/passkey/register/verify', requireAuth, async (req, res) => {
  try {
    const { response } = req.body;
    const expectedChallenge = req.session.currentChallenge;
    const origin = getExpectedOrigin(req);

    if (!expectedChallenge) {
      return res.status(400).json({ error: true, message: 'No active challenge found.' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: new URL(origin).hostname,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

      await db.query(
        `INSERT INTO "Passkey" (id, user_id, webauthn_user_id, credential_id, public_key, counter, device_type, backed_up, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          req.user.id,
          Buffer.from(req.user.id).toString('base64'),
          credential.id,
          Buffer.from(credential.publicKey).toString('base64'),
          credential.counter,
          credentialDeviceType,
          credentialBackedUp,
          new Date()
        ]
      );

      delete req.session.currentChallenge;
      res.json({ success: true, message: 'Passkey registered successfully.' });
    } else {
      res.status(400).json({ error: true, message: 'Passkey verification failed.' });
    }
  } catch (error) {
    console.error('[MFA] Passkey reg verify error:', error);
    res.status(500).json({ error: true, message: 'Failed to verify passkey' });
  }
});

router.post('/passkey/auth/options', async (req, res) => {
  try {
    const pendingUserId = req.session.pendingUserId;
    if (!pendingUserId) {
      return res.status(401).json({ error: true, message: 'No pending authentication session.' });
    }

    const { rows: passkeys } = await db.query('SELECT credential_id FROM "Passkey" WHERE user_id = $1', [pendingUserId]);
    
    if (passkeys.length === 0) {
      return res.status(400).json({ error: true, message: 'No passkeys registered for this user.' });
    }

    const options = await generateAuthenticationOptions({
      rpID: new URL(getExpectedOrigin(req)).hostname,
      allowCredentials: passkeys.map(pk => ({
        id: pk.credential_id,
        type: 'public-key',
      })),
      userVerification: 'preferred',
    });

    req.session.currentChallenge = options.challenge;
    res.json({ success: true, options });
  } catch (error) {
    console.error('[MFA] Passkey auth options error:', error);
    res.status(500).json({ error: true, message: 'Failed to generate auth options' });
  }
});

router.post('/passkey/auth/verify', async (req, res) => {
  try {
    const { response } = req.body;
    const pendingUserId = req.session.pendingUserId;
    const expectedChallenge = req.session.currentChallenge;
    const origin = getExpectedOrigin(req);

    if (!pendingUserId || !expectedChallenge) {
      return res.status(400).json({ error: true, message: 'Session expired. Please start over.' });
    }

    const { rows: passkeys } = await db.query(
      'SELECT public_key, counter FROM "Passkey" WHERE user_id = $1 AND credential_id = $2', 
      [pendingUserId, response.id]
    );

    if (passkeys.length === 0) {
      return res.status(400).json({ error: true, message: 'Passkey not found.' });
    }

    const passkey = passkeys[0];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: new URL(origin).hostname,
      authenticator: {
        credentialID: response.id,
        credentialPublicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64')),
        counter: Number(passkey.counter),
      },
    });

    const { verified, authenticationInfo } = verification;

    if (verified) {
      await db.query('UPDATE "Passkey" SET counter = $1 WHERE user_id = $2 AND credential_id = $3', 
        [authenticationInfo.newCounter, pendingUserId, response.id]
      );

      req.session.userId = pendingUserId;
      delete req.session.pendingUserId;
      delete req.session.currentChallenge;

      const { rows } = await db.query(
        'SELECT id, name, email, role, account_status, email_verified, avatar_url, has_seen_tour FROM "User" WHERE id = $1',
        [pendingUserId]
      );
      
      const user = rows[0];
      await db.query(
        'UPDATE "User" SET last_login_at = $1, updated_at = $1 WHERE id = $2',
        [new Date().toISOString(), user.id]
      );

      return res.json({ success: true, user });
    } else {
      return res.status(400).json({ error: true, message: 'Passkey verification failed.' });
    }
  } catch (error) {
    console.error('[MFA] Passkey auth verify error:', error);
    res.status(500).json({ error: true, message: 'Failed to verify passkey' });
  }
});

router.delete('/passkey/:credentialId', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM "Passkey" WHERE user_id = $1 AND credential_id = $2', [req.user.id, req.params.credentialId]);
    res.json({ success: true, message: 'Passkey removed.' });
  } catch (error) {
    console.error('[MFA] Remove passkey error:', error);
    res.status(500).json({ error: true, message: 'Failed to remove passkey' });
  }
});

router.get('/passkeys', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT credential_id, created_at, device_type FROM "Passkey" WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, passkeys: rows });
  } catch (error) {
    console.error('[MFA] Get passkeys error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch passkeys' });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT totp_enabled FROM "User" WHERE id = $1', [req.user.id]);
    // Fetch Passkeys
    const passkeyRows = await db.query(
      'SELECT id, created_at, last_used_at, device_type FROM "Passkey" WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({
      success: true,
      totpEnabled: Number(rows[0]?.totp_enabled) === 1,
      passkeys: passkeyRows.rows
    });
  } catch (error) {
    console.error('[MFA] Get status error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch MFA status' });
  }
});

export default router;

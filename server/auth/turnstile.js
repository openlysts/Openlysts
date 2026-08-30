import { request } from 'undici';

export async function verifyTurnstile(token) {
  if (process.env.NODE_ENV !== 'production') return true;
  
  const secret = process.env.TURNSTILE_SECRET;
  
  if (!secret) {
    console.warn('[AUTH] TURNSTILE_SECRET not configured. Bypassing check for development.');
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const { body } = await request('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });

    const data = await body.json();
    return data.success === true;
  } catch (error) {
    console.error('[AUTH] Turnstile verification failed:', error.message);
    return false;
  }
}

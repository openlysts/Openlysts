import './server/env.js';
import crypto from 'crypto';
import { db } from './server/db/index.js';

async function main() {
  const { rows } = await db.query('SELECT id FROM "User" WHERE email_normalized = $1', ['admin@openlysts.com']);
  const userId = rows[0].id;
  
  const sid = crypto.randomBytes(32).toString('hex');
  const sess = {
    cookie: { originalMaxAge: 2592000000, expires: new Date(Date.now() + 2592000000), httpOnly: true, path: '/' },
    userId: userId
  };
  const expire = new Date(Date.now() + 2592000000);
  
  await db.query(
    'INSERT INTO "session" (sid, sess, expire) VALUES ($1, $2, $3)',
    [sid, sess, expire]
  );
  console.log(sid);
  process.exit(0);
}
main();

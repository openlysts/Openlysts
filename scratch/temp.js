import './server/env.js';
import { db } from './server/db/index.js';
db.query('SELECT email, email_normalized, role FROM "User" LIMIT 10').then(r => {
  console.log(r.rows);
}).catch(console.error).finally(() => process.exit(0));

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
sql`UPDATE users SET email_verified = true WHERE email = 'playwright-qa-user@openlysts.test'`.then(() => console.log('Done')).catch(console.error);

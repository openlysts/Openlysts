import { db } from './db/index.js';

export async function getSystemConfig(key) {
  try {
    const { rows } = await db.query('SELECT value FROM "SystemConfig" WHERE key = $1', [key]);
    return rows[0]?.value;
  } catch (e) {
    return null;
  }
}

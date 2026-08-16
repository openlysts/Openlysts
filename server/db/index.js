import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'openlyst.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize tables if they don't exist
initSchema(db);

console.log('[DB] connected to SQLite');

export { db };

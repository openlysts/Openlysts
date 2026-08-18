import Database from 'better-sqlite3';

const db = new Database('data/openlyst.db');

try {
  db.prepare("ALTER TABLE Repository ADD COLUMN difficulty TEXT").run();
  console.log("Added difficulty column to Repository");
} catch (e) {
  console.log("difficulty column might already exist", e.message);
}

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Alternative (
      id TEXT PRIMARY KEY,
      created_date TEXT,
      paid_tool_name TEXT,
      open_source_repo_id TEXT,
      description TEXT
    );
  `).run();
  console.log("Ensured Alternative table exists");
} catch(e) {
  console.log("Alternative table error", e.message);
}

db.close();

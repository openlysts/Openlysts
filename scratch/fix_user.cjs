const db = require('better-sqlite3')('data/openlyst.db');
db.exec('ALTER TABLE "User" ADD COLUMN name TEXT');
db.exec('ALTER TABLE "User" ADD COLUMN email TEXT');
console.log('Done!');

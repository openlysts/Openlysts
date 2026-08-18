import db from './server/db/index.js';
console.log(db.prepare("SELECT * FROM Alternative LIMIT 2;").all());

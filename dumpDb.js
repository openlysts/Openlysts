import { db } from './server/db/index.js';
console.log(JSON.stringify(db.prepare('SELECT * FROM Alternative LIMIT 1').get(), null, 2));

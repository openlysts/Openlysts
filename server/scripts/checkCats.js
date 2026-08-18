import { entities } from '../services/entities.js';

async function run() {
  const alts = await entities.Alternative.list();
  const cats = new Set(alts.map(a => a.category).filter(Boolean));
  console.log("Categories found:", Array.from(cats));
  
  const blanks = alts.filter(a => !a.category).length;
  console.log(`Alternatives with blank category: ${blanks} out of ${alts.length}`);
}

run();

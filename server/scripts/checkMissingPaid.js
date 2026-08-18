import { entities } from '../services/entities.js';

async function run() {
  const alts = await entities.Alternative.list();
  const missing = alts.filter(a => !a.category).map(a => a.paid_tool_name);
  console.log("Missing paid tools:", Array.from(new Set(missing)));
}

run();

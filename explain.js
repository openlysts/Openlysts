import { db } from './server/db/index.js';

async function check() {
  const query = `
    EXPLAIN ANALYZE SELECT 
      a.id
    FROM "Alternative" a
    LEFT JOIN "Repository" r ON lower(a.free_tool_repo) = lower(r.full_name)
    ORDER BY a.feature_parity_score DESC, a.id DESC
  `;
  const { rows } = await db.query(query, []);
  console.log(rows.map(r => r['QUERY PLAN']).join('\n'));
  process.exit();
}
check();

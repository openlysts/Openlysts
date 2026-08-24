import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  try {
    const { db } = await import('../server/db/index.js');
    const { rows: altCount } = await db.query('SELECT count(*) as c FROM "Alternative"');
    console.log('COUNT OF ALTERNATIVE TABLE:', altCount[0].c);

    const { rows: categoriesCount } = await db.query('SELECT count(distinct category) as c FROM "Alternative"');
    console.log('DISTINCT CATEGORIES:', categoriesCount[0].c);

    const { rows: paidToolsCount } = await db.query('SELECT count(distinct paid_tool_name) as c FROM "Alternative"');
    console.log('DISTINCT PAID TOOLS:', paidToolsCount[0].c);

    const { rows: reposCount } = await db.query('SELECT count(*) as c FROM "Repository"');
    console.log('TOTAL REPOSITORIES:', reposCount[0].c);

    const { rows: dedupCount } = await db.query('SELECT count(distinct lower(trim(paid_tool_name)) || \'::\' || lower(trim(free_tool_repo))) as c FROM "Alternative"');
    console.log('DEDUPED ALTERNATIVES MAPPINGS:', dedupCount[0].c);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();

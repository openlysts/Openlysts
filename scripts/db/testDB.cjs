const { db } = require('./server/db/index.js');

async function testDatabase() {
    console.log('--- TC-148: Alternative Repository Linkage ---');
    const { rows: alts } = await db.query('SELECT * FROM "Alternative"');
    const { rows: repos } = await db.query('SELECT * FROM "Repository"');
    
    let linked = 0;
    let missingRepo = 0;
    for (const alt of alts) {
        if (alt.free_tool_repo) {
            const r = repos.find(rep => rep.full_name.toLowerCase() === alt.free_tool_repo.toLowerCase());
            if (r) linked++;
            else missingRepo++;
        }
    }
    console.log(`Total Alternatives: ${alts.length}`);
    console.log(`Linked to a Repo: ${linked}`);
    console.log(`Missing Repo Metadata: ${missingRepo}`);
    if (missingRepo === 0) {
        console.log('TC-148 PASS: 100% Linkage');
    }

    console.log('\n--- TC-149: Expanded Modern Alternatives ---');
    const modernCategories = new Set(alts.map(a => a.category));
    console.log('Categories present:', Array.from(modernCategories).slice(0, 5).join(', ') + '...');
    const topNames = ['OpenWebUI', 'Aider', 'AppFlowy', 'PostHog', 'Cal.com', 'Coolify', 'Supabase'];
    let found = 0;
    for (const name of topNames) {
        if (alts.find(a => a.free_tool_name && a.free_tool_name.toLowerCase().includes(name.toLowerCase()))) {
            found++;
        } else if (alts.find(a => a.free_tool_repo && a.free_tool_repo.toLowerCase().includes(name.toLowerCase()))) {
            found++;
        }
    }
    console.log(`Found ${found}/${topNames.length} top modern alternatives.`);
    if (found === topNames.length) console.log('TC-149 PASS');

    console.log('\n--- TC-151: Database Deduplication ---');
    const { rows: dupes } = await db.query('SELECT lower(full_name) as name, COUNT(*) as c FROM "Repository" GROUP BY lower(full_name) HAVING COUNT(*) > 1');
    console.log(`Duplicate repo names: ${dupes.length}`);
    if (dupes.length === 0) console.log('TC-151 PASS');
    
    process.exit(0);
}
testDatabase();

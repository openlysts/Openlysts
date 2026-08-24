import { db } from './server/db/index.js';

async function check() {
  console.time('DB Query');
  const query = `
    SELECT 
      a.id, a.created_date, a.paid_tool_name, a.free_tool_name, a.free_tool_repo,
      a.description as alt_description, a.pros_and_cons, a.youtube_tutorial_url,
      a.article_tutorial_url, a.why_it_is_better, a.migration_difficulty,
      a.feature_parity_score, a.category,
      r.id as repo_id, r.github_id, r.full_name as repo_full_name, r.owner as repo_owner,
      r.name as repo_name, r.description as repo_description, r.html_url as repo_html_url,
      r.homepage_url as repo_homepage_url, r.default_branch as repo_default_branch,
      r.language as repo_language, r.license_key as repo_license_key,
      r.license_name as repo_license_name, r.license_url as repo_license_url,
      r.license_status as repo_license_status, r.stars as repo_stars,
      r.forks as repo_forks, r.open_issues as repo_open_issues,
      r.topics as repo_topics, r.categories as repo_categories,
      r.quality_score as repo_quality_score, r.trending_score as repo_trending_score,
      r.difficulty as repo_difficulty
    FROM "Alternative" a
    LEFT JOIN "Repository" r ON lower(a.free_tool_repo) = lower(r.full_name)
    ORDER BY a.feature_parity_score DESC, a.id DESC
  `;
  const { rows } = await db.query(query, []);
  console.timeEnd('DB Query');
  console.log(`Fetched ${rows.length} rows`);

  console.time('JS Processing');
  // ... loop over it
  const enriched = rows.map(row => {
    // something
    return row.id;
  });
  console.timeEnd('JS Processing');
  process.exit();
}
check();

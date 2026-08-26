import fetch from 'node-fetch';

/**
 * Polite crawler for Hacker News using the official Algolia API.
 * Respects rate limits and extracts open-source related posts.
 */

const HN_ALGOLIA_URL = 'https://hn.algolia.com/api/v1/search';
const RATE_LIMIT_DELAY = 1000; // 1 request per second to be polite

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function crawlHackerNews(query = 'open source', pages = 1) {
  console.log(`[Crawler] Starting polite HN crawl for query: "${query}"`);
  const results = [];

  for (let page = 0; page < pages; page++) {
    try {
      const url = `${HN_ALGOLIA_URL}?query=${encodeURIComponent(query)}&tags=story&page=${page}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[Crawler] HN API returned status ${response.status}`);
        break;
      }

      const data = await response.json();
      
      for (const hit of data.hits) {
        // We aggressively segregate and only take tools with URLs
        if (hit.url && (hit.url.includes('github.com') || hit.url.includes('gitlab.com') || !hit.url.includes('ycombinator.com'))) {
          results.push({
            title: hit.title,
            external_url: hit.url,
            upvotes: hit.points,
            comments: hit.num_comments,
            source_site: 'hn',
            created_at: hit.created_at,
          });
        }
      }

      // Polite delay between pages
      await sleep(RATE_LIMIT_DELAY);

    } catch (error) {
      console.error('[Crawler] Error fetching HN data:', error.message);
      break;
    }
  }

  console.log(`[Crawler] Found ${results.length} relevant items from HN.`);
  return results;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('hackerNewsCrawler.js')) {
  crawlHackerNews('open source', 2).then(res => console.log(res.slice(0, 2)));
}

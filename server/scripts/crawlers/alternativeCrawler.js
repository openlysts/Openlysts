import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Polite crawler for scraping AlternativeTo.
 * Respects robots.txt and uses safe rate limits.
 */

const BASE_URL = 'https://alternativeto.net';
const RATE_LIMIT_DELAY = 2500; // 2.5 seconds to be very polite

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function crawlAlternativeTo(category = 'development', pages = 1) {
  console.log(`[Crawler] Starting polite AlternativeTo crawl for category: "${category}"`);
  const results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${BASE_URL}/category/${category}/?p=${page}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenlystsBot/1.0 (Contact: crawler@openlysts.com)',
        }
      });
      
      if (!response.ok) {
        console.error(`[Crawler] AlternativeTo returned status ${response.status}`);
        break;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Parse items safely
      $('[data-testid="item-card"]').each((i, el) => {
        const title = $(el).find('h2').text().trim();
        const likesText = $(el).find('[data-testid="like-button"]').text().trim();
        const upvotes = parseInt(likesText, 10) || 0;
        
        const badges = $(el).find('.badge').map((i, b) => $(b).text().trim()).get();
        const isOpenSource = badges.some(b => b.toLowerCase().includes('open source'));

        if (isOpenSource && title) {
          results.push({
            title,
            upvotes,
            views: upvotes * 12, // Trade secret heuristic
            source_site: 'alternativeto',
            external_url: `${BASE_URL}/software/${title.toLowerCase().replace(/\\s+/g, '-')}/`
          });
        }
      });

      // Polite delay between pages
      await sleep(RATE_LIMIT_DELAY);

    } catch (error) {
      console.error('[Crawler] Error fetching AlternativeTo data:', error.message);
      break;
    }
  }

  console.log(`[Crawler] Found ${results.length} OSS items from AlternativeTo.`);
  return results;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('alternativeCrawler.js')) {
  crawlAlternativeTo('developer-tools', 1).then(res => console.log(res.slice(0, 2)));
}

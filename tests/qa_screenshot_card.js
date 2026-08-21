import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    // Find a RepositoryCard to screenshot
    const card = page.locator('.card').first();
    await card.screenshot({ path: path.join(process.cwd(), 'card_overlap_check.png') });
    console.log('Screenshot saved to card_overlap_check.png');
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

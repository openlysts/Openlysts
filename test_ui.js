import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const log = (msg) => console.log(`[QA] ${msg}`);
  const errLog = (msg) => console.error(`[QA ERROR] ${msg}`);

  try {
    log('1. Testing Home Page (/)');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    let title = await page.title();
    if (!title.includes('Openlysts')) throw new Error('Home page title mismatch');
    
    // Check main sections
    const trendingCards = page.locator('section:has-text("Trending This Week") .card');
    await trendingCards.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await trendingCards.count();
    log(`Found ${count} trending cards.`);
    if (count === 0) throw new Error('No trending repositories loaded.');

    log('2. Testing Global Search');
    // Home search bar
    await page.fill('input[placeholder="Search open-source projects..."]', 'react');
    // The dropdown should appear
    await page.waitForTimeout(1000);
    // Submit search
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search?q=react');
    log('Reached Search page.');
    
    // Check search results
    await page.waitForSelector('p:has-text("for")');
    const searchCards = page.locator('.card');
    await searchCards.first().waitFor({ state: 'visible', timeout: 10000 });
    const searchCount = await searchCards.count();
    log(`Search results for "react": ${searchCount} cards found.`);
    
    log('3. Testing Repository Detail Page');
    // Click the first card
    const firstCard = searchCards.first();
    const repoTitleText = await firstCard.locator('h3').textContent();
    log(`Clicking repo: ${repoTitleText}`);
    await firstCard.click();
    await page.waitForURL('**/repo/**');
    log('Reached Repo Detail page.');
    
    // Check Repo Title
    await page.waitForSelector(`h1:has-text("${repoTitleText}")`);
    
    // Test Bookmarking Feature
    log('4. Testing Bookmarking Feature');
    const saveBtn = page.locator('button:has-text("Save")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForSelector('button:has-text("Saved")');
      log('Repo bookmarked.');
    }
    
    // Navigate to Bookmarks Page
    log('Navigating to Bookmarks Page...');
    await page.click('a[aria-label="Bookmarks"]');
    await page.waitForURL('**/bookmarks');
    await page.waitForSelector(`h3:has-text("${repoTitleText}")`);
    log('Verified repo appears in Bookmarks.');
    
    log('5. Testing Categories Page');
    await page.click('nav a:has-text("Categories")');
    await page.waitForURL('**/categories');
    await page.waitForSelector('h1:has-text("Categories")');
    const catCards = page.locator('a:has(h3)');
    const catCount = await catCards.count();
    log(`Found ${catCount} categories.`);
    
    // Click first category
    await catCards.first().click();
    await page.waitForURL('**/category/**');
    await page.waitForSelector('h1');
    log('Reached a specific Category page.');
    
    log('6. Testing Trending Page');
    await page.click('nav a:has-text("Trending")');
    await page.waitForURL('**/trending');
    await page.waitForSelector('h1:has-text("Trending Repositories")');
    log('Reached Trending page.');
    
    log('7. Testing Settings Page & Local Storage Sync');
    await page.click('a[aria-label="Settings"]');
    await page.waitForURL('**/settings');
    await page.waitForSelector('h1:has-text("Settings")');
    await page.fill('input[placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"]', 'ghp_playwright_test_token');
    await page.click('button:has-text("Save")');
    await page.waitForSelector('div:has-text("Saved")');
    
    // 8. Testing Static Pages (About, Contact)
    log('8. Testing Static Pages (About, Contact)');
    await page.click('nav a:has-text("About")');
    await page.waitForURL('**/about');
    await page.waitForSelector('h1:has-text("About Openlysts")');
    
    await page.click('nav a:has-text("Contact")');
    await page.waitForURL('**/contact');
    await page.waitForSelector('h1:has-text("Contact Us")');
    await page.waitForSelector('button:has-text("Send via Email")');
    await page.waitForSelector('button:has-text("Send via Telegram")');
    
    log('9. Testing Theme Toggle');
    // Click Theme toggle in header
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500); // let transition happen
        log('Theme toggle clicked.');
    }

    log('10. Taking Final Screenshot');
    // Use an absolute path if needed, or simply save in project root
    await page.screenshot({ path: path.join(process.cwd(), 'qa_full_ux_screenshot.png'), fullPage: true });
    
    log('ALL TESTS PASSED SUCCESSFULLY! ✅');

  } catch (err) {
    errLog(err.stack || err.message);
    await page.screenshot({ path: path.join(process.cwd(), 'qa_error_screenshot.png'), fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

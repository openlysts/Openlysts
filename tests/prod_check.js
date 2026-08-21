import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // === CHECK 1: Home page ===
    console.log('[1] Checking home page...');
    const res = await page.goto('https://openlysts.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[1] Status:', res.status());
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('[1] Title:', title);
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('[1] Body text snippet:', bodyText);
    const errors = await page.evaluate(() => {
      const errs = [];
      window.addEventListener && document.querySelectorAll('[data-testid="error"]').forEach(e => errs.push(e.innerText));
      return errs;
    });
    await page.screenshot({ path: 'prod_check_home.png', fullPage: false });
    results.push({ page: 'Home', status: res.status(), title });

    // === CHECK 2: Discover page ===
    console.log('[2] Checking /discover...');
    const res2 = await page.goto('https://openlysts.vercel.app/discover', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const title2 = await page.title();
    const bodyText2 = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('[2] Status:', res2.status(), '| Title:', title2);
    console.log('[2] Body snippet:', bodyText2);
    await page.screenshot({ path: 'prod_check_discover.png', fullPage: false });
    results.push({ page: 'Discover', status: res2.status(), title: title2 });

    // === CHECK 3: API health ===
    console.log('[3] Checking /api/functions/query-repos...');
    const res3 = await page.goto('https://openlysts.vercel.app/api/functions/query-repos?limit=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const apiBody = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('[3] API status:', res3.status());
    console.log('[3] API response snippet:', apiBody);
    results.push({ page: 'API', status: res3.status(), body: apiBody });

    console.log('\n===== RESULTS SUMMARY =====');
    results.forEach(r => console.log(JSON.stringify(r)));

  } catch (err) {
    console.error('[ERROR]', err.message);
    await page.screenshot({ path: 'prod_check_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

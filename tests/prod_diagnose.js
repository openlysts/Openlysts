import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Capture ALL console messages
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}\n${err.stack}`));

  try {
    await page.goto('https://openlysts.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 1000) : 'ROOT NOT FOUND';
    });
    console.log('ROOT innerHTML:', rootHTML);
    console.log('\n--- Console & Errors ---');
    consoleLogs.forEach(l => console.log(l));

    await page.screenshot({ path: 'prod_diagnose.png', fullPage: true });
  } catch (err) {
    console.error('[FATAL]', err.message);
    consoleLogs.forEach(l => console.log(l));
    await page.screenshot({ path: 'prod_diagnose_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

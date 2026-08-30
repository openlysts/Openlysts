import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err}`));

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login');
  
  console.log("Filling form...");
  await page.fill('input[type="email"]', 'sheenhatt@gmail.com');
  await page.fill('input[type="password"]', 'password123'); // Assuming test password is password or password123
  
  console.log("Clicking login...");
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/discover', { timeout: 10000 });
    console.log("Navigation successful!");
    await page.screenshot({ path: 'scratch/discover_success.png' });
  } catch (e) {
    console.error("Navigation failed:", e);
    await page.screenshot({ path: 'scratch/discover_failure.png' });
  }

  await browser.close();
})();

import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err}`));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  console.log('Filling form...');
  await page.fill('input[type="email"]', 'sheenhatt@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/discover', { timeout: 10000 });
    console.log('Navigation successful!');
    
    // Check if the user is seen as ADMIN in the DOM
    const content = await page.content();
    fs.writeFileSync('scratch/discover_page.html', content);
    console.log('Saved discover page HTML.');
  } catch (e) {
    console.error('Navigation failed:', e);
  }

  await browser.close();
})();

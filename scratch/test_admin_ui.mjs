import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[LOG] ${msg.text()}`));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'sheenhatt@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  
  // Go to profile panel
  console.log('Navigating to profile panel...');
  await page.goto('http://localhost:5173/profile');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'scratch/sheenhatt_profile.png' });
  
  // Also check local storage or auth response
  const userRole = await page.evaluate(() => {
    return document.body.innerText;
  });
  if (userRole.includes('Developer Hub & Settings')) {
    console.log('Found profile page!');
  } else {
    console.log('Did not find profile page, might have redirected?');
  }

  await browser.close();
})();

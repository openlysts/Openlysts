import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', response => {
    if (response.url().includes('/api/auth/me')) {
      response.json().then(data => console.log('Auth Me:', data)).catch(() => {});
    }
    if (response.url().includes('/api/auth/login')) {
      response.json().then(data => console.log('Login:', data)).catch(() => {});
    }
  });

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'sheenhatt@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  await browser.close();
})();

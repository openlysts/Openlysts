import { test } from '@playwright/test';
test('Capture console logs', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle' });
  console.log('BROWSER ERRORS:', errors);
});

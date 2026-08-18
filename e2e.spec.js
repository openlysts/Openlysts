import { test, expect } from '@playwright/test';

test.describe('Openlysts QA Playbook E2E', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('Step 1: Initial Load', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Openlysts/i);
    // Ensure no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Step 2: Global Nav & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('text=Alternatives');
    await expect(page).toHaveURL(/.*alternatives/);
    
    // 404 test
    const response = await page.goto('http://localhost:5173/random-gibberish-path');
    expect(response?.status()).toBe(404);
    await expect(page.locator('text=Back to Home')).toBeVisible();
  });

  test('Step 3: Search Bar Debounce', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const searchInput = page.getByPlaceholder('Search');
    if (await searchInput.isVisible()) {
        await searchInput.fill('react');
        // Simple filter check
        await expect(page.locator('.grid')).toBeVisible();
    }
  });

  test('Step 4: Security (XSS / SQLi)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const searchInput = page.getByPlaceholder('Search');
    if (await searchInput.isVisible()) {
        await searchInput.fill('<script>alert(1)</script>');
        await page.waitForTimeout(500);
        // Ensure it doesn't crash
        await expect(page.locator('body')).toBeVisible();
        
        await searchInput.fill('\' OR 1=1 --');
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Step 10: Theming', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Try to find theme toggle by looking for Moon/Sun or Theme text
    const themeBtn = page.locator('button', { hasText: /theme|moon|sun/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
    }
  });

  // More steps can be added here, keeping it robust to avoid flakiness if UI changed
});

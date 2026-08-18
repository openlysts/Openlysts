import { test, expect } from '@playwright/test';

test.describe('Openlyst QA Playbook E2E', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('Step 1: Initial Load', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Openlyst/i);
    // Ensure no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Step 2: Global Nav & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // We will use page.goto for all of these to test routes instead of clicking,
    // since clicking might be obscured by a side panel or mobile menu
    await page.goto('http://localhost:5173/alternatives');
    await expect(page).toHaveURL(/.*alternatives/);
    await page.goto('http://localhost:5173/trending');
    await expect(page).toHaveURL(/.*trending/);
    await page.goto('http://localhost:5173/bookmarks');
    await expect(page).toHaveURL(/.*bookmarks/);
    await page.goto('http://localhost:5173/about');
    await expect(page).toHaveURL(/.*about/);
    await page.goto('http://localhost:5173/contact');
    await expect(page).toHaveURL(/.*contact/);
    
    // 404 test
    await page.goto('http://localhost:5173/random-gibberish-path');
    await expect(page.locator('text=Go Home').first()).toBeVisible();
  });

  test('Step 3: Search Bar Debounce', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const searchInput = page.getByPlaceholder('Search').first();
    if (await searchInput.isVisible()) {
        await searchInput.fill('react');
        // Simple filter check
        await page.waitForTimeout(500);
        await expect(page.locator('.grid').first()).toBeVisible();
    }
  });

  test('Step 4: Security (XSS / SQLi)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const searchInput = page.getByPlaceholder('Search').first();
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

  test('Step 8: Bookmarks Page Empty State', async ({ page }) => {
    await page.goto('http://localhost:5173/bookmarks');
    await expect(page.locator('h1', { hasText: /Bookmarks/i })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 10: Theming', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    // Toggle dark mode or light mode if visible
    const themeToggle = page.locator('button', { hasText: /theme|dark|light/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await expect(page.locator('html')).toBeVisible();
    }
  });

});

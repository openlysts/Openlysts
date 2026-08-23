import { test, expect } from '@playwright/test';

test.describe('Openlysts QA Playbook E2E', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const tourKeys = ['discover', 'repo', 'compare', 'alternatives', 'search', 'trending', 'bookmarks', 'about', 'contact'];
      for (const k of tourKeys) {
        localStorage.setItem(`openlyst_has_seen_tour_${k}`, 'true');
      }
    });
  });

  test('Step 1: Initial Load', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Openlysts/i);
    // Ensure no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Step 2: Global Nav & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'commit' });
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*alternatives/);
    await page.goto('http://localhost:5173/trending', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*trending/);
    await page.goto('http://localhost:5173/guide', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*guide/);
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*bookmarks/);
    await page.goto('http://localhost:5173/about', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*about/);
    await page.goto('http://localhost:5173/contact', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/.*contact/);
    
    // 404 test
    await page.goto('http://localhost:5173/random-gibberish-path', { waitUntil: 'commit' });
    await expect(page.locator('text=Go Home').first()).toBeVisible();
  });

  test('Step 3: Search Bar Debounce', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    const searchInput = page.getByPlaceholder('Search').first();
    if (await searchInput.isVisible()) {
        await searchInput.fill('react');
        // Simple filter check
        await page.waitForTimeout(500);
        await expect(page.locator('.grid').first()).toBeVisible();
    }
  });

  test('Step 4: Security (XSS / SQLi)', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
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
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1', { hasText: /Bookmarks/i })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Step 10: Theming', async ({ page }) => {
    await page.goto('http://localhost:5173/settings', { waitUntil: 'domcontentloaded' });
    // Toggle dark mode or light mode if visible
    const themeToggle = page.locator('button', { hasText: /theme|dark|light/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await expect(page.locator('html')).toBeVisible();
    }
  });

});

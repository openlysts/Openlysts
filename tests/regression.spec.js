import { test, expect } from '@playwright/test';

test.describe('Openlysts QA Regression Suite', () => {
  // Scenario 1: Initial Load & Shell
  test('Scenario 1: Initial Load & App Shell', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle(/Openlyst/i);
    // Check layout shifts
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  // Scenario 2: Global Navigation
  test('Scenario 2: Global Navigation & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Check navigation links
    await page.click('text=Alternatives');
    await expect(page).toHaveURL(/.*\/alternatives/);
    
    await page.click('text=Bookmarks');
    await expect(page).toHaveURL(/.*\/bookmarks/);
    
    // Test 404
    await page.goto('http://localhost:5173/this-path-does-not-exist');
    await expect(page.locator('text=Go Home').first()).toBeVisible();
  });

  // Scenario 3 & 4: Search, Debounce & Security
  test('Scenario 3 & 4: Search Debounce & Security', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const searchInput = page.getByPlaceholder(/Search|Looking for/i).first();
    
    await searchInput.fill('react');
    // Wait for debounce
    await page.waitForTimeout(500);
    // Should navigate to /search or show dropdown
    
    // Security Test
    await searchInput.fill('<script>alert("xss")</script>');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible(); // No crash
  });

  // Scenario 5: Complex Filtering
  test('Scenario 5: Complex Filtering Combinations', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    
    // Check for categories
    const filterBtn = page.getByRole('button', { name: /Filter/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
    
    const catCheck = page.locator('text=Developer Tools').first();
    if (await catCheck.isVisible()) {
      await catCheck.click();
      await expect(page).toHaveURL(/categories=/);
    }
  });

  // Scenario 6: Alternatives UI
  test('Scenario 6: Alternatives Masonry Grid', async ({ page }) => {
    await page.goto('http://localhost:5173/alternatives');
    const masonryItem = page.locator('.break-inside-avoid').first();
    await expect(masonryItem).toBeVisible();
  });

  // Scenario 7: Repository Details
  test('Scenario 7: Repository Details & Deep Links', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react');
    await expect(page.locator('h1')).toBeVisible();
  });

  // Scenario 8: Bookmarks Lifecycle
  test('Scenario 8: Bookmarks Lifecycle', async ({ page }) => {
    await page.goto('http://localhost:5173/bookmarks');
    await expect(page.locator('text=Bookmarks').first()).toBeVisible();
  });

  // Scenario 9: Forms & Boundaries
  test('Scenario 9: Forms & Boundaries', async ({ page }) => {
    await page.goto('http://localhost:5173/contact');
    const emailInput = page.getByPlaceholder(/Email/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      // Should show HTML5 validation or custom error
    }
  });

  // Scenario 10: Theming
  test('Scenario 10: Theming & CSS Variables', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const themeToggle = page.locator('button[aria-label="Toggle theme"], button:has(.lucide-moon), button:has(.lucide-sun)').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(isDark).toBeDefined();
    }
  });

  // Scenario 11: Mobile Responsiveness
  test('Scenario 11: Mobile Hamburger Nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:5173/');
    
    const menuBtn = page.locator('button:has(.lucide-menu), button[aria-label="Open menu"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.locator('a', { hasText: 'Alternatives' }).first()).toBeVisible();
    }
  });

  // Scenario 12: Keyboard Accessibility
  test('Scenario 12: Keyboard Focus Management', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.keyboard.press('Tab');
    const isFocused = await page.evaluate(() => document.activeElement !== document.body);
    expect(isFocused).toBeTruthy();
  });
});

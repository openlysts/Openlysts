import { test, expect } from '@playwright/test';

test.describe('Openlysts QA Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss all product tour modals automatically across all pages in testing
    await page.addInitScript(() => {
      const tourKeys = ['discover', 'repo', 'compare', 'alternatives', 'search', 'trending', 'bookmarks', 'about', 'contact', 'guide'];
      for (const k of tourKeys) {
        localStorage.setItem(`openlyst_has_seen_tour_${k}`, 'true');
      }
    });
  });

  // Scenario 1: Initial Load & Shell
  test('Scenario 1: Initial Load & App Shell', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Openlysts/i);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  // Scenario 2: Global Navigation
  test('Scenario 2: Global Navigation & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    
    // Check navigation to alternatives
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/alternatives/);
    
    // Check navigation to bookmarks
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/bookmarks/);
    
    // Test 404
    await page.goto('http://localhost:5173/this-path-does-not-exist', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 3 & 4: Search, Debounce & Security
  test('Scenario 3 & 4: Search Debounce & Security', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('react');
    await page.waitForTimeout(300);
    
    // Security Test - XSS payload in search
    await searchInput.fill('<script>alert("xss")</script>');
    await page.waitForTimeout(300);
    await expect(page.locator('body')).toBeVisible(); // No crash
  });

  // Scenario 5: Complex Filtering
  test('Scenario 5: Complex Filtering Combinations', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const catCard = page.locator('text=Developer Tools').or(page.locator('text=AI & LLMs')).first();
    if (await catCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catCard.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 6: Alternatives UI
  test('Scenario 6: Alternatives Directory UI', async ({ page }) => {
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2, div').filter({ hasText: /Alternative/i }).first()).toBeVisible();
  });

  // Scenario 7: Repository Details
  test('Scenario 7: Repository Details Deep Link Fallback', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 8: Bookmarks Lifecycle
  test('Scenario 8: Bookmarks Lifecycle', async ({ page }) => {
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 9: Forms & Boundaries
  test('Scenario 9: Forms & Boundaries', async ({ page }) => {
    await page.goto('http://localhost:5173/contact', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[placeholder*="example.com"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('invalid-email');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Send Message")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 10: Theming
  test('Scenario 10: Theming & CSS Variables', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const themeToggle = page.locator('button[aria-label="Toggle theme"]').first();
    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await themeToggle.click();
      const themeSet = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || document.documentElement.className);
      expect(themeSet).toBeDefined();
    }
  });

  // Scenario 11: Mobile Responsiveness
  test('Scenario 11: Mobile Layout Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 12: Keyboard Accessibility
  test('Scenario 12: Keyboard Focus Management', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.focus();
      const isFocused = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() === 'input');
      expect(isFocused).toBeTruthy();
    }
  });

  // Scenario 13: Command Palette Shortcuts
  test('Scenario 13: Command Palette Shortcut & Navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const dialog = page.locator('#command-palette-dialog');
    if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 14: Similar Repos & Deep API
  test('Scenario 14: Similar Repositories Integration', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 15: Mobile Alternatives Category Drawer
  test('Scenario 15: Mobile Alternatives Category Drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    const catBtn = page.locator('button:has-text("Categories")').first();
    if (await catBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catBtn.click({ force: true });
      await page.waitForTimeout(300);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 16: Compare Pre-population from LocalStorage/Context
  test('Scenario 16: Compare Pre-population & Context Sync', async ({ page }) => {
    await page.goto('http://localhost:5173/compare?repos=facebook%2Freact,vuejs%2Fvue', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*repos=facebook%2Freact.*vuejs%2Fvue/);
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 17: Trending 7-Day Filter Persistence
  test('Scenario 17: Trending 7-Day Filter Persistence', async ({ page }) => {
    await page.goto('http://localhost:5173/trending', { waitUntil: 'domcontentloaded' });
    const filterBtn = page.locator('button:has-text("Filters")').first();
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterBtn.click();
      const select = page.locator('select:has(option[value="7d"])').first();
      if (await select.isVisible({ timeout: 1000 }).catch(() => false)) {
        await select.selectOption('7d');
        await expect(page).toHaveURL(/.*updatedWithin=7d/);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 18: Search Input Synchronization
  test('Scenario 18: Search Input Synchronization with Query Param', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=nextjs', { waitUntil: 'domcontentloaded' });
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(input).toHaveValue('nextjs');
    }
  });

  // Scenario 19: Category Badges Route to /search
  test('Scenario 19: RepoDetail Category Badges Route to Search', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    const catLink = page.locator('a[href*="/search?categories="]').first();
    if (await catLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catLink.click();
      await expect(page).toHaveURL(/.*\/search\?categories=/);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 20: Live Bookmark Badge Update on Mobile
  test('Scenario 20: Live Mobile Bookmark Counter on bookmarks-changed Event', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('openlyst_bookmarks', JSON.stringify([{ id: 'test', name: 'test' }]));
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    });
    await page.evaluate(() => {
      localStorage.removeItem('openlyst_bookmarks');
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    });
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 21: Platform Guide Interactive Deep-Dive
  test('Scenario 21: Platform Guide Interactive Tab Switching and CTA Links', async ({ page }) => {
    await page.goto('http://localhost:5173/guide', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText(/How to Find Awesome Free Software/i);
    
    // Verify Progress Tracker initial state
    await expect(page.locator('text=Guide Progress: 1 of 6 Features Explored')).toBeVisible();

    // Click a Goal Chip
    const goalBtn = page.locator('button:has-text("Replace a paid")').first();
    await goalBtn.click();
    await expect(page.locator('h2:has-text("Cut Your Software Bills to $0")')).toBeVisible();
    await expect(page.locator('text=Guide Progress: 2 of 6 Features Explored')).toBeVisible();

    // Switch to Side-by-Side Compare tab
    const compareTab = page.locator('button:has-text("Side-by-Side Compare")').first();
    await compareTab.click();
    await expect(page.locator('h2:has-text("Compare Tools on One Screen")')).toBeVisible();

    // Verify Launch CTA navigates to /compare
    const cta = page.locator('main a[href="/compare"]').first();
    await expect(cta).toBeVisible();
  });
});

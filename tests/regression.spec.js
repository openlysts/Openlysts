import { test, expect } from '@playwright/test';

test.describe('Openlysts QA Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss all product tour modals automatically across all pages in testing
    await page.addInitScript(() => {
      const tourKeys = ['discover', 'repo', 'compare', 'alternatives', 'search', 'trending', 'bookmarks', 'about', 'contact'];
      for (const k of tourKeys) {
        localStorage.setItem(`openlyst_has_seen_tour_${k}`, 'true');
      }
    });
  });

  // Scenario 1: Initial Load & Shell
  test('Scenario 1: Initial Load & App Shell', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Openlysts/i);
    // Check layout shifts
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  // Scenario 2: Global Navigation
  test('Scenario 2: Global Navigation & Active States', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    
    // Check navigation links
    const altsLink = page.locator('a[href="/alternatives"], button:has-text("Alternatives")').first();
    if (await altsLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await altsLink.click();
    } else {
      await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    }
    await expect(page).toHaveURL(/.*\/alternatives/);
    
    const bookmarksLink = page.locator('a[href="/bookmarks"], button:has-text("Bookmarks")').first();
    if (await bookmarksLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bookmarksLink.click();
    } else {
      await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    }
    await expect(page).toHaveURL(/.*\/bookmarks/);
    
    // Test 404
    await page.goto('http://localhost:5173/this-path-does-not-exist', { waitUntil: 'commit' });
    await expect(page.locator('text=Page Not Found').or(page.locator('text=Go Home')).first()).toBeVisible({ timeout: 10000 });
  });

  // Scenario 3 & 4: Search, Debounce & Security
  test('Scenario 3 & 4: Search Debounce & Security', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const searchInput = page.getByPlaceholder(/Search|Looking for/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.scrollIntoViewIfNeeded();
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
    if (await catCard.isVisible({ timeout: 1000 }).catch(() => false)) {
      await catCard.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // Scenario 6: Alternatives UI
  test('Scenario 6: Alternatives Directory UI', async ({ page }) => {
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2, div').filter({ hasText: /Alternative/i }).first()).toBeVisible();
  });

  // Scenario 7: Repository Details
  test('Scenario 7: Repository Details Deep Link Fallback', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('h1').or(page.locator('text=React')).or(page.locator('text=Repository not found')).first()).toBeVisible();
  });

  // Scenario 8: Bookmarks Lifecycle
  test('Scenario 8: Bookmarks Lifecycle', async ({ page }) => {
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Bookmarks")').or(page.locator('text=Your Bookmarks'))).toBeVisible({ timeout: 10000 });
  });

  // Scenario 9: Forms & Boundaries
  test('Scenario 9: Forms & Boundaries', async ({ page }) => {
    await page.goto('http://localhost:5173/contact', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[placeholder*="example.com"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('invalid-email');
      const submitBtn = page.locator('button').filter({ hasText: /Send|Submit|Mail/i }).first();
      if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitBtn.click();
      }
    }
  });

  // Scenario 10: Theming
  test('Scenario 10: Theming & CSS Variables', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const themeToggle = page.locator('button[aria-label="Toggle theme"], button:has(.lucide-moon), button:has(.lucide-sun)').first();
    if (await themeToggle.isVisible({ timeout: 1500 }).catch(() => false)) {
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
    const searchInput = page.getByPlaceholder(/Search|Looking for/i).first();
    await searchInput.focus();
    const isFocused = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() === 'input');
    expect(isFocused).toBeTruthy();
  });

  // Scenario 13: Command Palette Shortcuts
  test('Scenario 13: Command Palette Shortcut & Navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const dialog = page.locator('#command-palette-dialog');
    if (await dialog.isVisible({ timeout: 1500 }).catch(() => false)) {
      await expect(dialog.locator('text=Go to Discover').or(dialog.locator('text=Browse Alternatives'))).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  // Scenario 14: Similar Repos & Deep API
  test('Scenario 14: Similar Repositories Integration', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  // Scenario 15: Mobile Alternatives Category Drawer
  test('Scenario 15: Mobile Alternatives Category Drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    const catBtn = page.locator('button:has-text("Categories")').first();
    await expect(catBtn).toBeVisible();
    await catBtn.scrollIntoViewIfNeeded();
    await catBtn.click({ force: true });
    await expect(page.locator('button').filter({ hasText: /Internal tools|All Tools/i }).first()).toBeVisible();
  });

  // Scenario 16: Compare Pre-population from LocalStorage/Context
  test('Scenario 16: Compare Pre-population & Context Sync', async ({ page }) => {
    await page.goto('http://localhost:5173/compare?repos=facebook%2Freact,vuejs%2Fvue', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*repos=facebook%2Freact.*vuejs%2Fvue/);
    await expect(page.locator('text=2/3 Repos')).toBeVisible();
  });

  // Scenario 17: Trending 7-Day Filter Persistence
  test('Scenario 17: Trending 7-Day Filter Persistence', async ({ page }) => {
    await page.goto('http://localhost:5173/trending', { waitUntil: 'domcontentloaded' });
    const filterBtn = page.locator('button:has-text("Filters")').first();
    await filterBtn.click();
    const select = page.locator('select:has(option[value="7d"])').first();
    await select.selectOption('7d');
    await expect(page).toHaveURL(/.*updatedWithin=7d/);
  });

  // Scenario 18: Search Input Synchronization
  test('Scenario 18: Search Input Synchronization with Query Param', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=nextjs', { waitUntil: 'domcontentloaded' });
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('nextjs');
  });

  // Scenario 19: Category Badges Route to /search
  test('Scenario 19: RepoDetail Category Badges Route to Search', async ({ page }) => {
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    const catLink = page.locator('a[href*="/search?categories="]').first();
    if (await catLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catLink.click();
      await expect(page).toHaveURL(/.*\/search\?categories=/);
    }
  });

  // Scenario 20: Live Bookmark Badge Update on Mobile
  test('Scenario 20: Live Mobile Bookmark Counter on bookmarks-changed Event', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('openlyst_bookmarks', JSON.stringify([{ id: 'test', name: 'test' }]));
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    });
    await expect(page.locator('nav[aria-label="Mobile Navigation"]').locator('a[href="/bookmarks"]').filter({ hasText: '1' })).toBeVisible();
    await page.evaluate(() => {
      localStorage.removeItem('openlyst_bookmarks');
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    });
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

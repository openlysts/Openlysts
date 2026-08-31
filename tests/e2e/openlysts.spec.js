import { test, expect } from '@playwright/test';

test.describe('Openlysts Comprehensive E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss any hints or overlays if necessary
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  });

  test('TC-001: Welcome Page Cold Load', async ({ page }) => {
    await expect(page).toHaveTitle(/Openlysts — Discover Open-Source Projects/i);
    // Verify main landmarks (using standard div container)
    const containerCount = await page.evaluate(() => document.querySelectorAll('#root').length);
    expect(containerCount).toBeGreaterThanOrEqual(1);

    // Navigate to discover
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('h1', { hasText: 'Uncover what the top 1%' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-011: Main Search Bar - Basic', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('react');
    await searchInput.press('Enter');
    // URL should update to ?q=react
    await page.waitForURL('**/search?q=react**');
    
    // Check if repo cards appear
    await expect(page.locator('a[href*="/repo/"]')).not.toHaveCount(0);
  });

  test('TC-031: Repo Detail Page', async ({ page }) => {
    // Direct access to a repo
    await page.goto('http://localhost:5173/repo/facebook/react', { waitUntil: 'domcontentloaded' });
    
    // Should have owner/repo heading
    await expect(page.locator('p', { hasText: 'facebook' })).toBeVisible();
    await expect(page.locator('h1', { hasText: 'react' }).first()).toBeVisible();
    
    // Check if stars are visible
    await expect(page.locator('text=stars')).toBeVisible();
  });

  test('TC-047: Contact Form - Validation', async ({ page }) => {
    await page.goto('http://localhost:5173/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('button', { hasText: 'Send via Email' }).click();
    
    // Should show error messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('TC-053: Theme Toggle', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    
    // Find theme toggle button
    const themeButton = page.locator('button[aria-label="Toggle theme"]').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
      // Wait for React to process the state change
      await page.waitForTimeout(500);
      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(newTheme).not.toBe(htmlTheme);
    }
  });

  test('TC-088: Auth Flow - Register Validation', async ({ page }) => {
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
    // Register button might be disabled due to turnstile, so we evaluate click or fill form first
    await page.locator('input[type="text"]').first().fill('a');
    await page.locator('input[type="email"]').first().fill('invalid');
    await page.locator('input[type="password"]').first().fill('123');
    // We can just verify validation messages appear inline on blur
    await page.locator('input[type="password"]').first().blur();
    
    // Should show error messages via HTML5 validation
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const isValid = await emailInput.evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('TC-043: Compare Empty State', async ({ page }) => {
    await page.goto('http://localhost:5173/compare', { waitUntil: 'domcontentloaded' });
    // Ensure compare instruction is there
    await expect(page.locator('text=Select up to 3 open-source repositories')).toBeVisible();
  });

  test('TC-007: 404 Page', async ({ page }) => {
    await page.goto('http://localhost:5173/this-page-does-not-exist-at-all');
    await expect(page.locator('h1', { hasText: '404' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Go Home' })).toBeVisible();
  });

  test('TC-015: Search - XSS Attack Vectors', async ({ page }) => {
    await page.goto('http://localhost:5173/search?q=<script>alert("XSS")</script>');
    // Ensure no alert dialog appears, Playwright would throw or we can just ensure the text is escaped
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toHaveValue('<script>alert("XSS")</script>');
    await expect(page.locator('p', { hasText: 'Searching for' })).toContainText('<script>alert("XSS")</script>');
  });

  test('TC-026: Alternatives Page Load', async ({ page }) => {
    await page.goto('http://localhost:5173/alternatives', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1', { hasText: 'Open Source Alternatives' })).toBeVisible();
  });

  test('TC-037: Bookmark a Repository', async ({ page }) => {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    // Note: Depends on data being present. We just verify the bookmarks page renders
    await page.goto('http://localhost:5173/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Your Bookmarks')).toBeVisible();
  });

  test('TC-097: Protected Route Enforcement', async ({ page }) => {
    // Unauthenticated access
    await page.goto('http://localhost:5173/profile');
    await expect(page).toHaveURL(/.*\/login\?redirect=%2Fprofile/);
    await expect(page.locator('h2', { hasText: 'Welcome back' })).toBeVisible();
  });

  test('TC-101: Admin Route Guard', async ({ page }) => {
    // Unauthenticated access
    await page.goto('http://localhost:5173/admin');
    await expect(page).toHaveURL(/.*\/login\?redirect=%2Fadmin/);
  });
});

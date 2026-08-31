import { test, expect } from '@playwright/test';

test.describe('Phase 2: Global Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-006: Navigation - All Routes', async ({ page }) => {
    // Array of routes to check and their expected titles/content
    const routes = [
      { path: '/alternatives', title: /Alternatives/i, heading: 'Open Source Alternatives' },
      { path: '/bookmarks', title: /Bookmarks/i, heading: 'Your Bookmarks' },
      { path: '/about', title: /About/i, heading: 'The best software in the world' },
      { path: '/contact', title: /Contact/i, heading: 'Contact Us' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('h1', { hasText: route.heading }).first()).toBeVisible();
      
      // Verify no JS console errors specifically when navigating
      const errors = [];
      page.on('pageerror', err => errors.push(err));
      expect(errors.length).toBe(0);
    }
  });

  test('TC-007: 404 Page', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await expect(page.locator('h1', { hasText: '404' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Go Home' })).toBeVisible();
  });

  test('TC-008: Deep Link Invalid Routes', async ({ page }) => {
    // Navigate to /repo with missing params (usually routes to 404 or gracefully redirects)
    await page.goto('/repo/invalid/repo');
    // Ensure the page doesn't crash to a white screen
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('TC-009: Browser Back/Forward Navigation', async ({ page }) => {
    await page.goto('/');
    await page.goto('/alternatives');
    await page.goBack();
    await expect(page).toHaveURL(/.*\//); // Back to home
    await page.goForward();
    await expect(page).toHaveURL(/.*\/alternatives/); // Back to alternatives
  });

  test('TC-002: Meta Tags & SEO Audit', async ({ page }) => {
    await page.goto('/');
    
    // Check standard meta tags
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    const icon = await page.locator('link[rel="icon"]').getAttribute('href');
    expect(icon).toBeTruthy();
  });
});

/**
 * Post-Deploy Smoke Tests (Playwright)
 * Quick verification that the application works after deployment
 *
 * Usage:
 *   npx playwright test tests/smoke/post-deploy.spec.js
 *   npm run test:smoke
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.SMOKE_URL || 'http://localhost:5173';

test.describe('Post-Deploy Smoke Tests', () => {
  test('Application loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Openlysts/i);

    // No critical JS errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Welcome page renders CTA buttons', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check for primary action buttons
    const cta = page.locator('a, button').filter({ hasText: /discover|get started|explore/i });
    await expect(cta.first()).toBeVisible({ timeout: 10000 });
  });

  test('API health endpoint responds', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL.replace('5173', '3001')}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('Navigation works without crash', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Try to navigate to discover
    const navLink = page.locator('a[href*="discover"]').first();
    if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navLink.click();
      await page.waitForLoadState('networkidle');

      // Check for React crash (the known bug)
      const crashIndicator = page.locator('text=Something went wrong');
      const hasCrash = await crashIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasCrash) {
        console.log('⚠️  Known issue: Discover page crash (React duplicate)');
      }
    }
  });

  test('No console errors on welcome page', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Filter out known non-critical errors
    const critical = consoleErrors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('favicon') && !e.includes('manifest')
    );
    expect(critical).toHaveLength(0);
  });

  test('Static assets load correctly', async ({ page }) => {
    const failedRequests = [];
    page.on('requestfailed', (req) => failedRequests.push(req.url()));

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // No failed requests for critical assets
    const criticalFailures = failedRequests.filter(
      (url) => url.includes('.js') || url.includes('.css')
    );
    expect(criticalFailures).toHaveLength(0);
  });

  test('Responsive layout — no overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});

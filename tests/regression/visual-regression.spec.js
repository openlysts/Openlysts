/**
 * Visual Regression Tests for Openlysts
 * Captures screenshots and compares against baselines
 *
 * Usage:
 *   npx playwright test tests/regression/visual-regression.spec.js
 *   npm run test:regression:visual
 */

const { test, expect } = require('@playwright/test');

const PAGES = [
  { name: 'welcome', url: '/', title: 'Welcome Page' },
  { name: 'discover', url: '/discover', title: 'Discover Page' },
  { name: 'settings', url: '/settings', title: 'Settings Page' },
  { name: 'login', url: '/login', title: 'Login Page' },
];

test.describe('Visual Regression', () => {
  for (const page of PAGES) {
    test(`${page.title} — screenshot matches baseline`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url, { waitUntil: 'networkidle' });

      // Wait for animations to settle
      await browserPage.waitForTimeout(1000);

      // Take screenshot
      await expect(browserPage).toHaveScreenshot(`${page.name}-baseline.png`, {
        fullPage: false, // viewport only for consistency
        maxDiffPixelRatio: 0.01, // 1% tolerance
      });
    });
  }

  test('Dark mode — welcome page matches baseline', async ({ page: browserPage }) => {
    // Set dark mode
    await browserPage.emulateMedia({ colorScheme: 'dark' });
    await browserPage.goto('/', { waitUntil: 'networkidle' });
    await browserPage.waitForTimeout(1000);

    await expect(browserPage).toHaveScreenshot('welcome-dark-baseline.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Light mode — welcome page matches baseline', async ({ page: browserPage }) => {
    await browserPage.emulateMedia({ colorScheme: 'light' });
    await browserPage.goto('/', { waitUntil: 'networkidle' });
    await browserPage.waitForTimeout(1000);

    await expect(browserPage).toHaveScreenshot('welcome-light-baseline.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Mobile viewport — welcome page matches baseline', async ({ page: browserPage }) => {
    await browserPage.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await browserPage.goto('/', { waitUntil: 'networkidle' });
    await browserPage.waitForTimeout(1000);

    await expect(browserPage).toHaveScreenshot('welcome-mobile-baseline.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Tablet viewport — discover page matches baseline', async ({ page: browserPage }) => {
    await browserPage.setViewportSize({ width: 768, height: 1024 }); // iPad
    await browserPage.goto('/discover', { waitUntil: 'networkidle' });
    await browserPage.waitForTimeout(1000);

    await expect(browserPage).toHaveScreenshot('discover-tablet-baseline.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });
});

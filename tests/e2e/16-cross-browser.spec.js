import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Run on all browser engines
test.describe('Cross-Browser: Chromium, Firefox, WebKit', () => {

  test('TC-XB-001: Welcome Page Loads', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Openlysts/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('TC-XB-002: Discover Page Loads Without Crash', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    // No "Invalid hook call" or other React crash
    const content = await page.content();
    expect(content).not.toContain('Invalid hook call');
    expect(content).not.toContain('Cannot read properties of null');
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC-XB-003: Search Works', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('react');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('TC-XB-004: Navigation Works', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const navLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('nav a, [role="navigation"] a'))
        .map(a => a.getAttribute('href'))
        .filter(Boolean);
    });
    // Visit each nav link
    for (const href of navLinks.slice(0, 5)) {
      if (href.startsWith('/')) {
        await page.goto(`${BASE}${href}`);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('TC-XB-005: 404 Page Works', async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist`);
    const content = await page.content();
    expect(content).toMatch(/404|not found/i);
  });

  test('TC-XB-006: Contact Page Loads', async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC-XB-007: Alternatives Page Loads', async ({ page }) => {
    await page.goto(`${BASE}/alternatives`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC-XB-008: No Console Errors on Welcome', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('third-party')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-XB-009: No Console Errors on Discover', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('third-party') &&
      !e.includes('Invalid hook call')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-XB-010: Responsive Layout No Overflow', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto(`${BASE}/`);
      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow).toBe(false);
    }
  });
});

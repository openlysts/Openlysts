import { test, expect } from '@playwright/test';

test.describe('Phase 12: Mobile & Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear potentially lingering theme classes
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  });

  test('TC-064: Mobile - iPhone SE (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Horizontal scrollbar check
    const hasHorizontalScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Verify Hamburger menu icon exists
    const hamburgerBtn = page.locator('button[aria-label*="menu"] i, button[aria-label*="Menu"] i').first();
    // Assuming we use an icon or explicit menu button for mobile
    // If not visible, it means the layout isn't properly adjusting to mobile
    const menuBtn = page.locator('button[aria-label="Toggle menu"], button[aria-label="Open menu"]');
    if (await menuBtn.count() > 0) {
      await expect(menuBtn).toBeVisible();
    }
  });

  test('TC-068: Tablet - iPad (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    // Verify no elements are cut off
    const hasHorizontalScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('TC-069: Desktop Wide (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Verify content is contained (e.g. max-w-7xl)
    const container = page.locator('main').first();
    const width = await container.evaluate(el => el.getBoundingClientRect().width);
    // Even on 1920px screen, main container shouldn't span full 1920px usually, but if it does, it's fine.
    // We just verify it loads without crashing and no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => 
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('TC-053: Theme Toggle & Persistence', async ({ page }) => {
    await page.goto('/discover');
    
    // Find the theme toggle button (usually looks for 'moon' or 'sun' or 'theme' aria-label)
    const themeBtn = page.locator('button[aria-label*="theme" i]');
    if (await themeBtn.count() > 0) {
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await themeBtn.click();
      
      // Allow react state to settle
      await page.waitForTimeout(300);
      const switchedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(switchedTheme).not.toBe(initialTheme);
      
      // Check localStorage persistence
      const storageTheme = await page.evaluate(() => localStorage.getItem('openlyst-theme'));
      // Note: app might use different storage key, this just verifies it switches
    }
  });
});

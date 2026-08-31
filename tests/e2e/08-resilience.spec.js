import { test, expect } from '@playwright/test';

test.describe('Phase 14: Resilience & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-080: Offline Mode Recovery', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate
    try {
      await page.goto('/discover', { timeout: 3000 });
    } catch (e) {
      // Expected to fail navigation in offline mode if SW is not fully caching
    }
    
    // Come back online
    await context.setOffline(false);
    await page.goto('/discover');
    
    // Ensure app recovers
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('TC-083: Memory Leak simulation (DOM Nodes)', async ({ page }) => {
    await page.goto('/discover');
    
    // We toggle a modal or route repeatedly via SPA clicks
    for (let i = 0; i < 10; i++) {
      await page.getByRole('link', { name: 'About' }).first().click();
      await page.waitForURL('**/about');
      await page.getByRole('link', { name: 'Discover' }).first().click();
      await page.waitForURL('**/discover');
    }
    
    // Evaluate total DOM nodes to ensure it didn't balloon
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(nodes).toBeLessThan(3000); // Typical react app is <1500, we use 3000 as a safe upper bound
  });

  test('TC-084: 500 Error boundary check', async ({ page }) => {
    // Navigate to a URL that might throw an error if not handled
    await page.goto('/repo/undefined/null');
    
    // App should show a graceful fallback or 404, not a raw stack trace
    const content = await page.content();
    expect(content).not.toContain('TypeError: Cannot read properties');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

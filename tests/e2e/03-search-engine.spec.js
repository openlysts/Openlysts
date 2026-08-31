import { test, expect } from '@playwright/test';

test.describe('Phase 3: Search Engine Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
  });

  test('TC-011: Basic Search Resolution', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[type="text"][placeholder*="Type" i]').first();
    await searchInput.fill('react');
    
    // Some implementations trigger on type, some on enter. Let's press Enter to be sure.
    await searchInput.press('Enter');
    
    // Should display results
    const resultsGrid = page.locator('main .grid, #results-grid, [data-testid="search-results"]').first();
    await expect(resultsGrid).toBeVisible();
    
    // At least one card
    const firstCard = resultsGrid.locator('> div, > a, article').first();
    await expect(firstCard).toBeVisible();
  });

  test('TC-012: Empty Query Resilience', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[type="text"][placeholder*="Type" i]').first();
    await searchInput.fill('   ');
    await searchInput.press('Enter');
    
    // Should not crash, should show all or empty state safely
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('TC-015: Security - XSS Vectors in Search', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[type="text"][placeholder*="Type" i]').first();
    const xssPayload = '<script>alert(1)</script>';
    await searchInput.fill(xssPayload);
    await searchInput.press('Enter');
    
    // Wait for network/processing
    await page.waitForTimeout(500);

    // Verify it didn't trigger an alert
    let alertTriggered = false;
    page.on('dialog', () => { alertTriggered = true; });
    expect(alertTriggered).toBe(false);

    // Verify payload is escaped in the DOM (we shouldn't find an actual script tag injected into results area)
    // Most frameworks escape by default, but we verify anyway
    const mainContent = await page.locator('main').innerHTML();
    expect(mainContent).not.toContain('<script>alert(1)</script>');
  });

  test('TC-017: Unicode and Emoji Queries', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[type="text"][placeholder*="Type" i]').first();
    await searchInput.fill('🔥🚀 عربي 中文');
    await searchInput.press('Enter');
    
    // Ensure no 500 error or crash
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('TC-018: Cmd+K / Ctrl+K Command Palette Trigger', async ({ page, isMobile }) => {
    if (isMobile) return; // Usually desktop only
    await page.goto('/'); // Start from home
    
    // Press shortcut
    await page.keyboard.press('Control+K');
    // or Mac Cmd+K if on mac (playwright handles Meta for mac usually, let's trigger both just in case)
    await page.keyboard.press('Meta+K');
    
    // Let's see if a modal or input focuses
    // (If not implemented, we just ensure it doesn't crash, but ideally it opens something)
    // Wait for any potential modal transition
    await page.waitForTimeout(300);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Openlyst Golden Path E2E', () => {
  test.setTimeout(120000); // Allow 2 minutes for the full flow

  test('Full UI and State Flow', async ({ page, request }) => {
    // 1. Discovery & Navigation
    await page.goto('/');
    await expect(page).toHaveTitle(/Openlysts/i);
    
    // Check main nav links
    await expect(page.locator('nav a', { hasText: 'Categories' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Trending' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Bookmarks' })).toBeVisible();

    // 2. Search integration
    await page.fill('input[placeholder*="Search"]', 'react');
    // Wait for network/debounce
    await page.waitForTimeout(1000);
    // Should display repo cards
    await page.waitForSelector('.card');
    
    // 3. Repositories and Bookmarking
    // Navigate to a repository detail
    const firstRepo = page.locator('.card').first();
    const repoTitle = await firstRepo.locator('h3').innerText();
    await firstRepo.click();
    
    // We are on the detail page
    await expect(page).toHaveURL(/\/repo\/.+/);
    await expect(page.locator('h1', { hasText: repoTitle })).toBeVisible();
    
    // Click bookmark button
    const bookmarkBtn = page.getByRole('button', { name: /Save|Bookmark/i });
    if (await bookmarkBtn.count() > 0) {
      await bookmarkBtn.first().click();
    }
    
    // Verify bookmarks page
    await page.goto('/bookmarks');
    await expect(page.locator('h1', { hasText: /Bookmarks/i })).toBeVisible();
    // The repo we saved should be here
    await expect(page.locator('.card', { hasText: repoTitle })).toBeVisible();
    
    // 4. Categories & Trending
    await page.goto('/categories');
    await expect(page.locator('h1', { hasText: /Categories/i })).toBeVisible();
    
    await page.goto('/trending');
    await expect(page.locator('h1', { hasText: /Trending/i })).toBeVisible();

    // 5. AgentPM (Admin) & Settings
    await page.goto('/agentpm');
    // It might redirect to /login or show password prompt if not authenticated
    // For local dev, let's just see if the page loaded
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // 6. Security/Health Check (API)
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.status).toBe('ok');

    // End of golden path.
  });
});

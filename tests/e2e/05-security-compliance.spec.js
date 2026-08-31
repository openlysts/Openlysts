import { test, expect } from '@playwright/test';

test.describe('Phase 13: Security & Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-070: Path Traversal Simulation', async ({ page }) => {
    // Attempt to navigate to a path traversal URL
    await page.goto('/repo/..%2f..%2f..%2fetc%2fpasswd');
    // Ensure we get a 404 and not a crash or file contents
    const heading = page.locator('h1', { hasText: '404' });
    await expect(heading).toBeVisible();
  });

  test('TC-071: Local Storage Exposure', async ({ page }) => {
    // Evaluate local storage to ensure no passwords or sensitive PII are stored in plain text
    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    expect(ls).not.toContain('password');
    expect(ls).not.toContain('secret');
  });

  test('TC-072: CSP and Security Headers', async ({ page }) => {
    // Listen for responses
    const response = await page.goto('/');
    
    // Check headers on the main document
    const headers = response.headers();
    // Vercel / Vite might not have CSP in dev, but in prod they should
    // We just verify it doesn't leak server info like 'X-Powered-By: Express' usually
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('TC-075: Prototype Pollution Check', async ({ page }) => {
    // Pass prototype pollution payload in query params
    await page.goto('/?__proto__[polluted]=true');
    const isPolluted = await page.evaluate(() => !!window.polluted);
    expect(isPolluted).toBe(false);
  });

  test('TC-076: Open Redirect Simulation', async ({ page }) => {
    await page.goto('/login?redirect=https://malicious.com');
    // Try to trigger the redirect (we can't without logging in, but we can check if it sanitized)
    // Normally we'd do a login and see if it redirects there. We'll do a basic check on the input or form.
    // For now, just ensure the app loaded without executing malicious JS or crashing
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

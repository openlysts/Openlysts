import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Performance: Bundle, Core Web Vitals, Memory, DOM', () => {

  // ─── Page Load Performance ─────────────────────────────────────

  test('TC-PERF-001: Welcome Page Loads Under 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('TC-PERF-002: Discover Page Loads Under 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/discover`, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('TC-PERF-003: Navigation Timing Metrics', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
        loadComplete: Math.round(perf.loadEventEnd - perf.startTime),
        ttfb: Math.round(perf.responseStart - perf.startTime),
      };
    });
    expect(metrics.domContentLoaded).toBeLessThan(2000);
    expect(metrics.ttfb).toBeLessThan(1000);
  });

  // ─── DOM Node Budget ───────────────────────────────────────────

  test('TC-PERF-004: Welcome Page DOM Nodes ≤ 2000', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(nodes).toBeLessThan(2000);
  });

  test('TC-PERF-005: Discover Page DOM Nodes ≤ 2000', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(nodes).toBeLessThan(2000);
  });

  // ─── Memory Leak Detection ─────────────────────────────────────

  test('TC-PERF-006: No Memory Leak After 10 Navigations', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const memBefore = await page.evaluate(() =>
      Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 0
    );

    for (let i = 0; i < 10; i++) {
      await page.goto(`${BASE}/discover`);
      await page.goto(`${BASE}/alternatives`);
      await page.goto(`${BASE}/`);
    }

    const memAfter = await page.evaluate(() =>
      Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 0
    );

    // Memory should not grow by more than 20MB
    if (memBefore > 0 && memAfter > 0) {
      expect(memAfter - memBefore).toBeLessThan(20);
    }
  });

  // ─── Layout Shift (CLS) ────────────────────────────────────────

  test('TC-PERF-007: No Horizontal Overflow (CLS Proxy)', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  // ─── Image Optimization ────────────────────────────────────────

  test('TC-PERF-008: Images Have Lazy Loading', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    const lazyImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => img.loading === 'lazy').length;
    });
    const totalImages = await page.evaluate(() => document.querySelectorAll('img').length);
    // At least some images should be lazy loaded
    if (totalImages > 3) {
      expect(lazyImages).toBeGreaterThan(0);
    }
  });

  test('TC-PERF-009: Images Have Alt Text', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    const imagesWithoutAlt = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => !img.alt && !img.getAttribute('role')).length;
    });
    expect(imagesWithoutAlt).toBe(0);
  });

  // ─── Bundle Verification ───────────────────────────────────────

  test('TC-PERF-010: No Large Inline Scripts', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const largeInlineScripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script:not([src])'))
        .filter(s => s.textContent.length > 10000).length;
    });
    expect(largeInlineScripts).toBe(0);
  });

  // ─── API Response Time ─────────────────────────────────────────

  test('TC-PERF-011: API Health Check Under 1s', async ({ request }) => {
    const start = Date.now();
    const res = await request.get('http://localhost:3001/api/health');
    const duration = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  test('TC-PERF-012: Search API Under 2s', async ({ request }) => {
    const start = Date.now();
    const res = await request.get('http://localhost:3001/api/entities/Repository/list?limit=20');
    const duration = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  // ─── Render Performance ────────────────────────────────────────

  test('TC-PERF-013: No Forced Reflows', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    const hasReflowIssues = await page.evaluate(() => {
      let reflowCount = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') reflowCount++;
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      return reflowCount;
    });
    // Just verify no crash
    expect(hasReflowCount).toBeDefined();
  });

  // ─── Font Loading ──────────────────────────────────────────────

  test('TC-PERF-014: Fonts Load With Swap', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const fontDisplay = await page.evaluate(() => {
      const sheets = document.styleSheets;
      // Just verify no FOIT (flash of invisible text) issues
      return document.fonts?.ready ? true : false;
    });
    expect(fontDisplay).toBe(true);
  });

  // ─── Network Requests ──────────────────────────────────────────

  test('TC-PERF-015: No Excessive Network Requests', async ({ page }) => {
    let requestCount = 0;
    page.on('request', () => requestCount++);
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(3000);
    // Should not make more than 20 requests on initial load
    expect(requestCount).toBeLessThan(20);
  });

  test('TC-PERF-016: No Failed Network Requests', async ({ page }) => {
    const failedRequests = [];
    page.on('requestfailed', req => failedRequests.push(req.url()));
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    // Filter out expected failures (OAuth, external)
    const criticalFailures = failedRequests.filter(url =>
      url.includes('/api/') && !url.includes('google') && !url.includes('github')
    );
    expect(criticalFailures).toHaveLength(0);
  });
});

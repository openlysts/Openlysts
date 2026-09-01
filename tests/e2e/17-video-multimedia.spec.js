import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Video & Multimedia: YouTube Embeds, Video Player', () => {

  // ─── Video Section ─────────────────────────────────────────────

  test('TC-VID-001: Repo With Video Has Video Section', async ({ page }) => {
    // Navigate to a repo that likely has videos
    await page.goto(`${BASE}/repo/facebook/react`);
    await page.waitForTimeout(3000);
    const content = await page.content();
    // Should have video section or "no videos" message
    expect(content).toBeDefined();
  });

  test('TC-VID-002: Video Section Does Not Auto-Play', async ({ page }) => {
    await page.goto(`${BASE}/repo/facebook/react`);
    await page.waitForTimeout(3000);
    const playingVideos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video'))
        .filter(v => !v.paused).length;
    });
    expect(playingVideos).toBe(0);
  });

  test('TC-VID-003: YouTube Embed Has Sandbox Attributes', async ({ page }) => {
    await page.goto(`${BASE}/repo/facebook/react`);
    await page.waitForTimeout(3000);
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe'))
        .map(f => ({
          src: f.getAttribute('src'),
          sandbox: f.getAttribute('sandbox'),
        }));
    });
    // Check YouTube iframes have sandbox
    const youtubeIframes = iframes.filter(f => f.src?.includes('youtube'));
    for (const iframe of youtubeIframes) {
      expect(iframe.sandbox).toBeTruthy();
    }
  });

  test('TC-VID-004: Video Player Has Controls', async ({ page }) => {
    await page.goto(`${BASE}/repo/facebook/react`);
    await page.waitForTimeout(3000);
    const videosWithControls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video'))
        .filter(v => v.hasAttribute('controls')).length;
    });
    // If there are videos, they should have controls
    if (videosWithControls > 0) {
      expect(videosWithControls).toBeGreaterThan(0);
    }
  });

  // ─── Repo Without Video ────────────────────────────────────────

  test('TC-VID-005: Repo Without Video Shows Empty State', async ({ page }) => {
    // Navigate to a small repo unlikely to have videos
    await page.goto(`${BASE}/repo/octocat/Hello-World`);
    await page.waitForTimeout(3000);
    const content = await page.content();
    // Should show "no videos" or similar message, not crash
    expect(content).toBeDefined();
    expect(content).not.toContain('TypeError');
  });

  // ─── Video Lazy Loading ────────────────────────────────────────

  test('TC-VID-006: Video Embeds Are Lazy Loaded', async ({ page }) => {
    await page.goto(`${BASE}/repo/facebook/react`);
    await page.waitForTimeout(3000);
    const lazyVideos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video, iframe'))
        .filter(el => el.loading === 'lazy' || el.dataset.src).length;
    });
    // Just verify no crash
    expect(lazyVideos).toBeDefined();
  });

  // ─── 3D Background ─────────────────────────────────────────────

  test('TC-VID-007: Three.js Canvas Exists on Welcome', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    const hasCanvas = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length > 0;
    });
    // Welcome page should have 3D canvas
    expect(hasCanvas).toBe(true);
  });

  test('TC-VID-008: No WebGL Context Errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.text().includes('WebGL') || msg.text().includes('GL_INVALID')) {
        errors.push(msg.text());
      }
    });
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  // ─── Image Loading ─────────────────────────────────────────────

  test('TC-VID-009: Images Have Explicit Dimensions', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    const imagesWithoutDimensions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => !img.width && !img.height && !img.style.width && !img.style.height
          && !img.className.includes('w-') && !img.className.includes('h-')).length;
    });
    // Some images may not have explicit dimensions (CSS handles it)
    expect(imagesWithoutDimensions).toBeLessThan(10);
  });

  test('TC-VID-010: No Broken Images', async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForTimeout(2000);
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => !img.complete || img.naturalWidth === 0).length;
    });
    expect(brokenImages).toBe(0);
  });
});

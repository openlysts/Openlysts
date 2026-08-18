import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('http://localhost:5173/about');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
})();

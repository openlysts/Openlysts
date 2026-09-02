import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "C:/Users/ARD's/.gemini/antigravity-ide/brain/c10b1d46-2b95-49ff-b144-a4b28d93111b/discover-screenshot-fixed.png" });
  await browser.close();
  console.log('Screenshot saved');
})();

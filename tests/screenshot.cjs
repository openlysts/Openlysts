const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (err) {}
  await page.screenshot({ path: 'tests/screenshot.png' });
  console.log('Screenshot taken at tests/screenshot.png');
  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  try {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (err) {
    console.log('GOTO TIMEOUT/ERROR:', err.message);
  }
  await browser.close();
})();

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  try {
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
    await page.screenshot({path: 'admin_error.png'});
  } catch(e) { console.error('GOTO ERROR:', e); }
  await browser.close();
})();

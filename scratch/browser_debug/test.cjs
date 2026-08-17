const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('Page loaded successfully.');
  } catch (e) {
    console.log('Error navigating to page:', e.message);
  }

  await browser.close();
})();

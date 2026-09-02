import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'discover-screenshot.png' });
    const title = await page.title();
    console.log('Title:', title);
    
    // Check if there are any error boundaries in the DOM
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('React will try to recreate this component tree')) {
        console.error('ERROR BOUNDARY DETECTED!');
        process.exit(1);
    } else if (bodyText.includes('Invalid hook call')) {
        console.error('INVALID HOOK CALL DETECTED!');
        process.exit(1);
    }
    
    console.log('SUCCESS: No crash detected.');
  } catch (err) {
    console.error('Failed to load page:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

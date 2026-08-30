import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Browser PageError] ${error.message}`));
  
  try {
    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    console.log("Navigation complete.");
    
    // Dump body HTML
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log("[BODY HTML]", bodyHTML);
    
  } catch (err) {
    console.error("Navigation error:", err);
  } finally {
    await browser.close();
  }
}

main();

import { chromium } from 'playwright';

async function runTest() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n=== Physical UI Login Test ${i} ===`);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log('Navigating to login page...');
      await page.goto('http://localhost:5173/login');
      
      console.log('Filling form...');
      await page.fill('input[type="email"]', 'sheenhatt@gmail.com');
      await page.fill('input[type="password"]', 'Admin123456!');
      
      console.log('Clicking login...');
      await page.click('button:has-text("Sign in")');
      
      // Wait for navigation or error
      await Promise.race([
        page.waitForURL('**/discover', { timeout: 5000 }).then(() => console.log('SUCCESS: Redirected to discover!')),
        page.waitForSelector('.text-red-500', { timeout: 5000 }).then(async (el) => {
          const text = await el.innerText();
          console.log(`FAILED: UI Error shown: ${text}`);
        })
      ]);
      
      await page.screenshot({ path: `test_login_${i}.png` });
      console.log(`Saved screenshot test_login_${i}.png`);
    } catch (e) {
      console.log(`Test ${i} Exception:`, e.message);
      await page.screenshot({ path: `test_login_${i}_error.png` });
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
}

runTest();

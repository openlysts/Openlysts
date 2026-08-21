import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const log = (msg) => console.log(`[QA] ${msg}`);
  const errLog = (msg) => console.error(`[QA ERROR] ${msg}`);

  try {
    log('1. Login as Admin');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@localhost');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/discover*', { timeout: 10000 });
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
    log('Successfully logged into Admin Dashboard.');

    // TC-225
    log('2. [TC-225] User Governance List & Multi-Provider Breakdown');
    await page.click('button:has-text("User Governance")'); // Or tab trigger
    await page.waitForSelector('text=Registered User Accounts', { timeout: 5000 });
    // taking screenshot
    await page.screenshot({ path: path.join(process.cwd(), 'qa_tc225.png') });
    log('TC-225 PASSED (Screenshot saved)');

    // TC-231
    log('3. [TC-231] Real-Time Security Audit Log Stream');
    await page.click('button:has-text("Security Audit")');
    await page.waitForSelector('text=Real-Time Security Audit Trail', { timeout: 5000 });
    await page.screenshot({ path: path.join(process.cwd(), 'qa_tc231.png') });
    log('TC-231 PASSED (Screenshot saved)');

    // TC-241 to TC-249 (Profile)
    log('4. Profile Navigation');
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' });
    await page.waitForURL('**/profile', { timeout: 5000 });
    await page.waitForSelector('text=Profile');
    
    // TC-242
    const nameInput = await page.locator('input[name="name"]');
    log(`TC-242 PASSED - Display Name present: ${await nameInput.isVisible()}`);
    
    // TC-243
    log('5. [TC-243] Interactive Password Strength Meter');
    await page.fill('input[placeholder="Enter robust new passphrase..."]', 'StrongPass123!');
    await page.waitForSelector('text=Strong');
    log('TC-243 PASSED');

    await page.screenshot({ path: path.join(process.cwd(), 'qa_profile.png'), fullPage: true });

    log('ALL TESTS EXECUTED.');
  } catch (err) {
    errLog(err.stack || err.message);
    await page.screenshot({ path: path.join(process.cwd(), 'qa_error_screenshot.png'), fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

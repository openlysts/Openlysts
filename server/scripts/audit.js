import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = process.cwd();

const ROUTES = [
  '/',
  '/discover',
  '/compare',
  '/repo/facebook/react',
  '/repo/sentry/sentry'
];

const VIEWPORTS = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Mobile', width: 375, height: 812 }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      
      console.log(`Auditing ${route} on ${vp.name}...`);
      try {
        await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle', timeout: 20000 });
        
        // Wait for potential animations or data loads
        await page.waitForTimeout(2000);

        // Take screenshot
        const screenshotPath = path.join(ARTIFACT_DIR, `audit_${route.replace(/[/]/g, '_')}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Evaluate DOM for UI/UX defects
        const defects = await page.evaluate(() => {
          const issues = [];
          
          // Check for horizontal overflow
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          if (docWidth > winWidth) {
            issues.push({ type: 'Layout', severity: 'High', msg: `Horizontal scrolling detected. Document width: ${docWidth}px, Viewport width: ${winWidth}px.` });
          }

          // Check interactive touch targets on mobile
          if (window.innerWidth < 768) {
            const interactives = document.querySelectorAll('button, a, input, select, [role="button"]');
            interactives.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                if (rect.width < 44 || rect.height < 44) {
                  const text = el.innerText?.substring(0, 20) || el.className;
                  if (text && !text.includes('lucide')) {
                     issues.push({ type: 'A11y', severity: 'Medium', msg: `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px): "${text.replace(/\n/g, ' ')}"` });
                  }
                }
              }
            });
          }

          // Look for "undefined", "null", "[object Object]" text which indicates rendering errors
          const bodyText = document.body.innerText;
          if (/undefined|null|\[object Object\]/.test(bodyText)) {
             issues.push({ type: 'Data', severity: 'High', msg: `Raw JS object/null/undefined rendered in DOM.` });
          }

          // Check for empty grids/states
          const grids = document.querySelectorAll('.grid');
          grids.forEach(g => {
            if (g.children.length === 0 && g.getBoundingClientRect().height > 0) {
              issues.push({ type: 'State', severity: 'Medium', msg: `Empty grid container found with no empty-state message.` });
            }
          });

          return issues;
        });

        report.push({ route, viewport: vp.name, defects, screenshot: screenshotPath });
      } catch (e) {
        console.error(`Error auditing ${route}: ${e.message}`);
        report.push({ route, viewport: vp.name, error: e.message });
      }
      
      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'audit_report.json'), JSON.stringify(report, null, 2));
  console.log('Audit complete.');
}

runAudit().catch(console.error);

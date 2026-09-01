import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Starting 10-iteration UI test on Discover page...');
  let totalTime = 0;
  let allGood = true;

  for (let i = 1; i <= 10; i++) {
    const start = Date.now();
    await page.goto('http://localhost:5173/discover', { waitUntil: 'domcontentloaded' });
    
    // Wait for RepositoryCards to appear in the DOM
    await page.waitForSelector('.group.relative.flex.flex-col', { timeout: 10000 });
    
    const count = await page.locator('.group.relative.flex.flex-col').count();
    
    // Verify overlapping
    // If cards overlap, their bounding boxes will intersect
    const cards = await page.$$('.group.relative.flex.flex-col');
    let overlaps = false;
    for (let j = 0; j < Math.min(cards.length - 1, 10); j++) {
       const box1 = await cards[j].boundingBox();
       const box2 = await cards[j+1].boundingBox();
       if (box1 && box2) {
           // For a grid, they might be side by side or above/below
           // It's overlapping if they intersect
           const intersect = !(
               box2.x >= box1.x + box1.width || 
               box2.x + box2.width <= box1.x || 
               box2.y >= box1.y + box1.height ||
               box2.y + box2.height <= box1.y
           );
           if (intersect) {
               overlaps = true;
               console.error(`Overlap detected between card ${j} and ${j+1}!`);
           }
       }
    }

    const elapsed = Date.now() - start;
    totalTime += elapsed;
    
    console.log(`Iteration ${i}: Rendered ${count} items in ${elapsed}ms. Overlaps: ${overlaps ? 'YES (FAIL)' : 'NO (PASS)'}`);
    
    if (count === 0 || overlaps) {
       allGood = false;
    }
    
    // Add small delay between navigations
    await page.waitForTimeout(500);
  }

  await browser.close();
  
  if (allGood) {
      console.log(`\nAll 10 UI tests PASSED! Average load/render time: ${totalTime / 10}ms`);
      process.exit(0);
  } else {
      console.log(`\nUI Tests FAILED!`);
      process.exit(1);
  }
}

run().catch(console.error);

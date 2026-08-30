import { test, expect } from "@playwright/test";
test("click surprise me", async ({ page }) => {
  await page.goto("http://localhost:5173/discover", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.click('button[title="Surprise Me"]', { force: true });
  await page.waitForTimeout(3500);
});

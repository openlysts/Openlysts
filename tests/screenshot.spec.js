import { test, expect } from "@playwright/test";
test("screenshot surprise me", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "surprise_me.png", fullPage: false });
});

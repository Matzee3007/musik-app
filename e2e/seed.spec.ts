import { test } from "@playwright/test";

// Ausgangspunkt für die Playwright-Agents (Planner, Generator): eine frische Startseite.
test("seed", async ({ page }) => {
  await page.goto("/");
});

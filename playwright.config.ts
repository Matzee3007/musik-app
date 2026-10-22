import { defineConfig, devices } from "@playwright/test";

// Browser-Tests gegen die laufende App mit dem echten Supabase-Projekt aus .env.local.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://127.0.0.1:3000" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Der Spieleabend zusätzlich mit der Engine von Safari auf iPhone-Größe.
    {
      name: "iphone",
      use: { ...devices["iPhone 15"] },
      testMatch: "spieleabend.spec.ts",
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});

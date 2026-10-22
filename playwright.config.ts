import { defineConfig, devices } from "@playwright/test";

// Browser-Tests gegen die laufende App mit dem echten Supabase-Projekt aus .env.local.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://127.0.0.1:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});

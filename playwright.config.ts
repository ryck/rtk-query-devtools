import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // The devtools plugin intentionally no-ops outside development (see
  // create-rtk-query-devtools-plugin.tsx), and a production build+preview would
  // never render the panel these tests exercise, so this runs the dev server.
  webServer: {
    command: "pnpm --filter demo run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

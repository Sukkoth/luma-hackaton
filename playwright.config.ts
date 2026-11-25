import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 4040;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  /* Global timeout per test */
  timeout: 60 * 1000,
  /* Expect assertion timeout: increases default 5000ms to 15s on CI, 10s locally */
  expect: {
    timeout: process.env.CI ? 15 * 1000 : 10 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "on-first-retry",
    actionTimeout: process.env.CI ? 15 * 1000 : 10 * 1000,
    navigationTimeout: process.env.CI ? 30 * 1000 : 20 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "bun run start" : "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      DISABLE_RATE_LIMIT: "true",
      E2E_MOCK_BIBLE_API:
        process.env.CI || !process.env.APP_KEY ? "true" : "false",
    },
  },
});

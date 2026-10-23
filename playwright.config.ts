import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  workers: process.env.ENABLE_PAYMENT_TEST_DATA === "true" ? 1 : undefined,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --webpack --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { ENABLE_PAYMENT_TEST_DATA: process.env.ENABLE_PAYMENT_TEST_DATA ?? "false" },
    timeout: 120_000,
  },
});

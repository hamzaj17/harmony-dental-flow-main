import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5180",
    headless: true,
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  outputDir: "artifacts/test-results",
  reporter: "list",
  webServer: {
    command: "node scripts/browser-server.mjs",
    url: "http://127.0.0.1:5180/api/health",
    reuseExistingServer: false,
    timeout: 60000,
  },
});

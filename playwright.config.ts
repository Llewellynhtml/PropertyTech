import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT || '3100';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:PORT='${port}'; $env:DISABLE_HMR='true'; $env:E2E_DISABLE_GEMINI='true'; npm.cmd run dev"`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});

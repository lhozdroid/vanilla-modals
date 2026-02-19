import { defineConfig, devices } from '@playwright/test';

const matrixEnabled = Boolean(process.env.PW_MATRIX);
const projects = matrixEnabled
    ? [
          { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } }
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 45_000,
    expect: {
        timeout: 5_000
    },
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        launchOptions: {
            slowMo: Number(process.env.PW_SLOWMO || 0)
        }
    },
    webServer: {
        command: 'npm run build && node tests/e2e/server.mjs',
        url: 'http://127.0.0.1:4173',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI
    },
    projects
});

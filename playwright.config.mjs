import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  reporter: 'line',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-test-gallery.mjs',
    url: 'http://127.0.0.1:4173/tests/accessibility/gallery.html',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

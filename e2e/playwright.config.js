// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir:    './tests',
  timeout:    30_000,
  retries:    1,
  workers:    1,          // run sequentially so login state doesn't collide
  reporter:   [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:       process.env.FRONTEND_URL || 'http://localhost:5173',
    headless:      true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

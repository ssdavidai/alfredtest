// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Alfred E2E Test Configuration
 * Tests the full onboarding flow as specified in spec.md
 *
 * Test user: test@alfred.rocks (has full access, ready VM)
 */
module.exports = defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.TEST_BASE_URL || 'https://alfred.rocks',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects for different scenarios
  projects: [
    // ========================================
    // SETUP PROJECTS
    // ========================================

    // Auth setup - runs once before authenticated tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    // ========================================
    // UNAUTHENTICATED TEST PROJECTS
    // These tests don't require auth
    // ========================================

    // Public pages and auth flow tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      testIgnore: /authenticated\.spec\.js/,
    },

    // Mobile viewport tests (unauthenticated)
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
      },
      testIgnore: [/authenticated\.spec\.js/, /dashboard.*\.spec\.js/],
    },

    // ========================================
    // AUTHENTICATED TEST PROJECTS
    // These tests run after auth setup
    // ========================================

    // Authenticated tests (dashboard, user flows)
    {
      name: 'authenticated',
      testMatch: /authenticated\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Use stored auth state
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Global timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Output directory
  outputDir: 'test-results',
});

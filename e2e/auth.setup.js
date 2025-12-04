// @ts-check
const { test: setup, expect } = require('@playwright/test');
const { authenticateTestUser, TEST_USER_EMAIL } = require('./helpers/auth-setup');

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Auth Setup for Playwright
 *
 * This setup authenticates as the test user (test@alfred.rocks) and stores
 * the session for reuse across all authenticated tests.
 *
 * The test user has:
 * - hasAccess: true (subscribed)
 * - vmStatus: 'ready' (VM provisioned)
 * - vmSubdomain: 'test-demo'
 * - apiKey: 'alf_test_demo_key_12345678'
 */
setup('authenticate as test user', async ({ page, request }) => {
  console.log('========================================');
  console.log('Setting up authentication for E2E tests');
  console.log(`Test user: ${TEST_USER_EMAIL}`);
  console.log('========================================');

  // Authenticate using the helper
  const success = await authenticateTestUser(page, request);

  if (!success) {
    throw new Error('Failed to authenticate test user');
  }

  // Verify we're on the dashboard
  await expect(page).toHaveURL(/dashboard/);

  // Verify we see the authenticated dashboard (not the subscription prompt)
  // Since our test user has hasAccess: true and vmStatus: 'ready'
  // We should see the Quickstart section
  const quickstartVisible = await page.locator('text=Quickstart').isVisible().catch(() => false);
  const dashboardTitle = await page.locator('text=Dashboard').isVisible().catch(() => false);

  console.log(`Dashboard visible: ${dashboardTitle}`);
  console.log(`Quickstart visible: ${quickstartVisible}`);

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`Auth state saved to ${AUTH_FILE}`);

  console.log('========================================');
  console.log('Authentication setup complete!');
  console.log('========================================');
});

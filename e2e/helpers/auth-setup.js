// @ts-check
/**
 * Auth Setup Helper for Playwright E2E Tests
 *
 * This module authenticates the test user using the test-login endpoint.
 * The test-login endpoint is secured by E2E_TEST_SECRET and only works
 * for the designated test user.
 */

const TEST_USER_EMAIL = 'test@alfred.rocks';
const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET || 'e2e-test-secret-alfred-2024';

/**
 * Authenticate as the test user using the test-login endpoint
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context
 * @returns {Promise<boolean>} - True if authentication succeeded
 */
async function authenticateTestUser(page, request) {
  const baseURL = process.env.TEST_BASE_URL || 'https://alfred.rocks';

  console.log(`[Auth] Starting authentication for ${TEST_USER_EMAIL}`);
  console.log(`[Auth] Base URL: ${baseURL}`);

  try {
    // Call the test-login endpoint
    const response = await request.post(`${baseURL}/api/auth/test-login`, {
      data: {
        secret: E2E_TEST_SECRET,
        email: TEST_USER_EMAIL,
      },
    });

    if (response.status() !== 200) {
      const errorBody = await response.text();
      console.error(`[Auth] Test login failed with status ${response.status()}`);
      console.error(`[Auth] Response: ${errorBody}`);
      return false;
    }

    const data = await response.json();
    console.log(`[Auth] Login successful for user: ${data.user?.email}`);
    console.log(`[Auth] Server returned cookie name: ${data.cookieName}`);

    // Set the session cookie directly on browser context
    const url = new URL(baseURL);
    const domain = url.hostname;
    const isSecure = url.protocol === 'https:';

    // Use the cookie name from the server (ensures salt matches)
    const cookieName = data.cookieName;

    await page.context().addCookies([{
      name: cookieName,
      value: data.token,
      domain: `.${domain}`,
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    }]);
    console.log(`[Auth] Set session cookie: ${cookieName} for domain: .${domain}`);

    // Navigate to dashboard to verify authentication
    await page.goto(`${baseURL}/dashboard`);

    // Log current URL for debugging
    const currentURL = page.url();
    console.log(`[Auth] Current URL after navigation: ${currentURL}`);

    // Log cookies for debugging
    const allCookies = await page.context().cookies();
    console.log(`[Auth] Cookies set: ${allCookies.map(c => c.name).join(', ')}`);

    // Check if we're on the dashboard
    if (currentURL.includes('/dashboard')) {
      console.log('[Auth] Authentication successful - on dashboard!');
      return true;
    }

    // If redirected to sign-in, auth failed
    if (currentURL.includes('/signin') || currentURL.includes('/api/auth')) {
      console.log('[Auth] Redirected to sign-in - authentication failed');
      return false;
    }

    // Wait for dashboard URL with a shorter timeout
    try {
      await page.waitForURL(/dashboard/, { timeout: 5000 });
      console.log('[Auth] Authentication successful - redirected to dashboard!');
      return true;
    } catch {
      console.log(`[Auth] Failed to reach dashboard. Current URL: ${page.url()}`);
      return false;
    }

  } catch (error) {
    console.error('[Auth] Authentication error:', error.message);
    return false;
  }
}

/**
 * Check if the current page is authenticated
 */
async function isAuthenticated(page) {
  try {
    const cookies = await page.context().cookies();
    return cookies.some(c =>
      c.name.includes('session-token') ||
      c.name.includes('authjs')
    );
  } catch {
    return false;
  }
}

module.exports = {
  TEST_USER_EMAIL,
  authenticateTestUser,
  isAuthenticated,
};

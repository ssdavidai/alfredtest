/**
 * Dashboard Test Mocks and Helpers
 *
 * Reusable mock functions for testing the dashboard flow
 */

/**
 * Mock authentication session
 * @param {import('@playwright/test').Page} page
 * @param {Object} user - User object
 */
async function mockAuthSession(page, user = {}) {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...user,
  };

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: defaultUser,
        expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      }),
    });
  });
}

/**
 * Mock user status with non-subscribed state
 * @param {import('@playwright/test').Page} page
 */
async function mockNonSubscribedUser(page) {
  await page.route('**/api/user/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hasAccess: false,
        vmStatus: null,
        vmSubdomain: null,
        vmIp: null,
        hasApiKey: false,
        maskedApiKey: null,
        apiKeyCreatedAt: null,
      }),
    });
  });
}

/**
 * Mock user status with provisioning state
 * @param {import('@playwright/test').Page} page
 * @param {string} status - VM status (pending, provisioning, error)
 */
async function mockProvisioningUser(page, status = 'provisioning') {
  await page.route('**/api/user/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hasAccess: true,
        vmStatus: status,
        vmSubdomain: null,
        vmIp: null,
        hasApiKey: false,
        maskedApiKey: null,
        apiKeyCreatedAt: null,
      }),
    });
  });
}

/**
 * Mock user status with ready VM state
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Additional options
 */
async function mockReadyUser(page, options = {}) {
  const {
    subdomain = 'test-user',
    hasApiKey = true,
    maskedApiKey = 'alf_************************abc123',
  } = options;

  await page.route('**/api/user/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hasAccess: true,
        vmStatus: 'ready',
        vmSubdomain: subdomain,
        vmIp: '192.168.1.100',
        hasApiKey,
        maskedApiKey: hasApiKey ? maskedApiKey : null,
        apiKeyCreatedAt: hasApiKey ? new Date().toISOString() : null,
      }),
    });
  });
}

/**
 * Mock VM config status
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Config options
 */
async function mockVmConfig(page, options = {}) {
  const {
    hasAnthropicKey = false,
    anthropicKeyMasked = null,
  } = options;

  await page.route('**/api/proxy/vm/config', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          has_anthropic_key: hasAnthropicKey,
          anthropic_key_masked: hasAnthropicKey ? (anthropicKeyMasked || 'sk-ant-***************xyz789') : null,
        }),
      });
    } else if (route.request().method() === 'POST') {
      // Handle POST request to save config
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'API key saved successfully',
        }),
      });
    }
  });
}

/**
 * Mock API key generation endpoint
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Generation options
 */
async function mockApiKeyGeneration(page, options = {}) {
  const {
    apiKey = 'alf_new_generated_key_abc123xyz789',
    delay = 0,
    shouldFail = false,
  } = options;

  await page.route('**/api/user/api-key', async (route) => {
    if (route.request().method() === 'POST') {
      if (delay > 0) {
        await page.waitForTimeout(delay);
      }

      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to generate API key',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            apiKey,
          }),
        });
      }
    }
  });
}

/**
 * Setup complete ready dashboard state
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Setup options
 */
async function setupReadyDashboard(page, options = {}) {
  const {
    user = {},
    subdomain = 'test-user',
    hasApiKey = true,
    hasAnthropicKey = true,
  } = options;

  await mockAuthSession(page, user);
  await mockReadyUser(page, { subdomain, hasApiKey });
  await mockVmConfig(page, { hasAnthropicKey });
}

/**
 * Setup provisioning dashboard state
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Setup options
 */
async function setupProvisioningDashboard(page, options = {}) {
  const {
    user = {},
    status = 'provisioning',
  } = options;

  await mockAuthSession(page, user);
  await mockProvisioningUser(page, status);
}

/**
 * Setup non-subscribed dashboard state
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Setup options
 */
async function setupNonSubscribedDashboard(page, options = {}) {
  const { user = {} } = options;

  await mockAuthSession(page, user);
  await mockNonSubscribedUser(page);
}

/**
 * Create a polling status mock that changes state
 * @param {import('@playwright/test').Page} page
 * @param {Array<string>} statusSequence - Array of statuses to return in order
 */
async function mockStatusPolling(page, statusSequence = ['provisioning', 'provisioning', 'ready']) {
  let callCount = 0;

  await page.route('**/api/user/status', async (route) => {
    const currentStatus = statusSequence[Math.min(callCount, statusSequence.length - 1)];
    callCount++;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hasAccess: true,
        vmStatus: currentStatus,
        vmSubdomain: currentStatus === 'ready' ? 'test-user' : null,
        vmIp: currentStatus === 'ready' ? '192.168.1.100' : null,
        hasApiKey: false,
        maskedApiKey: null,
        apiKeyCreatedAt: null,
      }),
    });
  });

  return { getCallCount: () => callCount };
}

/**
 * Mock API error response
 * @param {import('@playwright/test').Page} page
 * @param {string} endpoint - API endpoint to mock
 * @param {number} status - HTTP status code
 * @param {string} errorMessage - Error message
 */
async function mockApiError(page, endpoint, status = 500, errorMessage = 'Internal server error') {
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: errorMessage,
      }),
    });
  });
}

/**
 * Wait for dashboard to finish loading
 * @param {import('@playwright/test').Page} page
 */
async function waitForDashboardLoad(page) {
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  await page.waitForSelector('.loading-spinner', { state: 'detached', timeout: 10000 }).catch(() => {
    // Loading spinner might not appear if data loads quickly
  });
}

module.exports = {
  // Auth mocks
  mockAuthSession,

  // User state mocks
  mockNonSubscribedUser,
  mockProvisioningUser,
  mockReadyUser,

  // VM config mocks
  mockVmConfig,

  // API key mocks
  mockApiKeyGeneration,

  // Combined setup functions
  setupReadyDashboard,
  setupProvisioningDashboard,
  setupNonSubscribedDashboard,

  // Advanced mocks
  mockStatusPolling,
  mockApiError,

  // Utilities
  waitForDashboardLoad,
};

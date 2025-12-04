// @ts-check
const fs = require('fs');
const path = require('path');

/**
 * Authentication Utilities for E2E Tests
 *
 * This file provides helper functions for authentication state management
 * and API mocking in Playwright tests.
 */

const STORAGE_STATE_PATH = path.join(__dirname, '../../.auth/user.json');

/**
 * Mock API endpoint with specific response
 * @param {import('@playwright/test').Page} page
 * @param {string} endpoint - API endpoint to mock
 * @param {any} responseData - Data to return
 * @param {number} statusCode - HTTP status code
 */
async function mockApiEndpoint(page, endpoint, responseData, statusCode = 200) {
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

/**
 * Load specific test scenario state
 * @param {import('@playwright/test').Page} page
 * @param {string} scenarioName - Name of scenario (e.g., 'vm-ready')
 */
async function loadScenarioState(page, scenarioName) {
  const scenarioPath = path.join(__dirname, '../../.auth', `${scenarioName}.json`);

  if (!fs.existsSync(scenarioPath)) {
    throw new Error(`Scenario state not found: ${scenarioName}`);
  }

  const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));
  await mockApiEndpoint(page, '**/api/user/status', scenarioData);

  return scenarioData;
}

/**
 * Setup authenticated context with specific user data
 * @param {import('@playwright/test').BrowserContext} context
 * @param {Object} userData - User data to inject
 */
async function setupAuthContext(context, userData = {}) {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    ...userData
  };

  await context.addInitScript((user) => {
    window.__mockUser = user;
    window.__mockSession = {
      user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }, defaultUser);
}

/**
 * Create mock scenario data files
 */
function createMockScenarios() {
  const statesDir = path.join(__dirname, '../../.auth');

  if (!fs.existsSync(statesDir)) {
    fs.mkdirSync(statesDir, { recursive: true });
  }

  const scenarios = [
    {
      name: 'no-subscription',
      data: {
        hasAccess: false,
        vmStatus: null
      }
    },
    {
      name: 'vm-provisioning',
      data: {
        hasAccess: true,
        vmStatus: 'provisioning',
        vmSubdomain: 'test-vm'
      }
    },
    {
      name: 'vm-ready',
      data: {
        hasAccess: true,
        vmStatus: 'ready',
        vmSubdomain: 'test-vm',
        maskedApiKey: 'alf_xxxxxxxxxxxx'
      }
    },
    {
      name: 'vm-error',
      data: {
        hasAccess: true,
        vmStatus: 'error',
        vmSubdomain: null
      }
    }
  ];

  for (const scenario of scenarios) {
    const scenarioPath = path.join(statesDir, `${scenario.name}.json`);
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify(scenario.data, null, 2)
    );
  }
}

module.exports = {
  mockApiEndpoint,
  loadScenarioState,
  setupAuthContext,
  createMockScenarios,
  STORAGE_STATE_PATH
};

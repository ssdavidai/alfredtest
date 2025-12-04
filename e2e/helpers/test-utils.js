// @ts-check

/**
 * Test Utilities for Alfred E2E Tests
 *
 * Common helper functions for use across all test files
 */

/**
 * Wait for an element to be in viewport
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function waitForInViewport(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // Allow for scroll animation
}

/**
 * Check if element is visible and enabled
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<boolean>}
 */
async function isInteractive(locator) {
  const visible = await locator.isVisible().catch(() => false);
  const enabled = await locator.isEnabled().catch(() => false);
  return visible && enabled;
}

/**
 * Wait for network to be idle
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a screenshot with timestamp
 * @param {import('@playwright/test').Page} page
 * @param {string} name - Screenshot name
 */
async function takeTimestampedScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true
  });
}

/**
 * Check if element has specific CSS class
 * @param {import('@playwright/test').Locator} locator
 * @param {string} className
 * @returns {Promise<boolean>}
 */
async function hasClass(locator, className) {
  const classes = await locator.getAttribute('class');
  return classes ? classes.split(' ').includes(className) : false;
}

/**
 * Get computed style property
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} property
 * @returns {Promise<string>}
 */
async function getComputedStyle(page, selector, property) {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return '';
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property }
  );
}

/**
 * Wait for toast notification to appear
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedText - Expected toast message
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForToast(page, expectedText, timeout = 5000) {
  const toastLocator = page.locator('[role="alert"], .toast, .alert').filter({
    hasText: expectedText
  });
  await toastLocator.waitFor({ state: 'visible', timeout });
  return toastLocator;
}

/**
 * Fill form and submit
 * @param {import('@playwright/test').Page} page
 * @param {Object} formData - Key-value pairs of form fields
 * @param {string} submitSelector - Selector for submit button
 */
async function fillAndSubmitForm(page, formData, submitSelector) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`[name="${name}"], #${name}`, value);
  }
  await page.click(submitSelector);
}

/**
 * Mock clipboard API for testing copy functionality
 * @param {import('@playwright/test').Page} page
 */
async function mockClipboard(page) {
  await page.addInitScript(() => {
    let clipboardData = '';
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text) => {
          clipboardData = text;
          return Promise.resolve();
        },
        readText: async () => {
          return Promise.resolve(clipboardData);
        }
      },
      writable: false
    });
  });
}

/**
 * Wait for API call and capture response
 * @param {import('@playwright/test').Page} page
 * @param {string} urlPattern - URL pattern to match
 * @returns {Promise<any>} Response JSON
 */
async function captureApiResponse(page, urlPattern) {
  return new Promise((resolve) => {
    page.on('response', async (response) => {
      if (response.url().includes(urlPattern)) {
        const json = await response.json().catch(() => null);
        resolve(json);
      }
    });
  });
}

/**
 * Scroll to bottom of page
 * @param {import('@playwright/test').Page} page
 */
async function scrollToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);
}

/**
 * Scroll to top of page
 * @param {import('@playwright/test').Page} page
 */
async function scrollToTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

/**
 * Check if dark mode is enabled
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
async function isDarkMode(page) {
  return await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.classList.contains('dark');
  });
}

/**
 * Mock local storage
 * @param {import('@playwright/test').Page} page
 * @param {Object} data - Key-value pairs to set in localStorage
 */
async function mockLocalStorage(page, data) {
  await page.addInitScript((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

/**
 * Mock session storage
 * @param {import('@playwright/test').Page} page
 * @param {Object} data - Key-value pairs to set in sessionStorage
 */
async function mockSessionStorage(page, data) {
  await page.addInitScript((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

/**
 * Wait for element to have specific text
 * @param {import('@playwright/test').Locator} locator
 * @param {string} text
 * @param {number} timeout
 */
async function waitForText(locator, text, timeout = 5000) {
  await locator.filter({ hasText: text }).waitFor({ state: 'visible', timeout });
}

/**
 * Get all text content from elements
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string[]>}
 */
async function getAllTextContent(page, selector) {
  return await page.$$eval(selector, (elements) =>
    elements.map((el) => el.textContent?.trim() || '')
  );
}

/**
 * Check if URL has specific hash
 * @param {import('@playwright/test').Page} page
 * @param {string} hash - Expected hash (e.g., '#pricing')
 */
async function expectHash(page, hash) {
  const currentUrl = new URL(page.url());
  return currentUrl.hash === hash;
}

/**
 * Perform accessibility checks (basic)
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Object>} Accessibility issues found
 */
async function checkAccessibility(page) {
  return await page.evaluate(() => {
    const issues = [];

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'missing-alt',
          element: 'img',
          index
        });
      }
    });

    // Check for buttons without accessible text
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasTitle = button.hasAttribute('title');

      if (!hasText && !hasAriaLabel && !hasTitle) {
        issues.push({
          type: 'missing-accessible-name',
          element: 'button',
          index
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const levels = headings.map((h) => parseInt(h.tagName[1]));

    let prevLevel = 0;
    levels.forEach((level, index) => {
      if (index > 0 && level - prevLevel > 1) {
        issues.push({
          type: 'heading-hierarchy-skip',
          from: prevLevel,
          to: level,
          index
        });
      }
      prevLevel = level;
    });

    return {
      issuesFound: issues.length,
      issues
    };
  });
}

/**
 * Measure page load performance
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Object>} Performance metrics
 */
async function measurePerformance(page) {
  return await page.evaluate(() => {
    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;

    return {
      loadTime,
      domReady,
      resources: window.performance.getEntriesByType('resource').length
    };
  });
}

/**
 * Test responsive design at different viewports
 * @param {import('@playwright/test').Page} page
 * @param {Function} testFn - Test function to run at each viewport
 */
async function testViewports(page, testFn) {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await testFn(viewport);
  }
}

/**
 * Generate random test data
 */
const testData = {
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomName: () => `Test User ${Date.now()}`,
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min
};

/**
 * Retry an action with exponential backoff
 * @param {Function} action - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms
 */
async function retryWithBackoff(action, maxAttempts = 3, initialDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Export all utilities
module.exports = {
  waitForInViewport,
  isInteractive,
  waitForNetworkIdle,
  takeTimestampedScreenshot,
  hasClass,
  getComputedStyle,
  waitForToast,
  fillAndSubmitForm,
  mockClipboard,
  captureApiResponse,
  scrollToBottom,
  scrollToTop,
  isDarkMode,
  mockLocalStorage,
  mockSessionStorage,
  waitForText,
  getAllTextContent,
  expectHash,
  checkAccessibility,
  measurePerformance,
  testViewports,
  testData,
  retryWithBackoff
};

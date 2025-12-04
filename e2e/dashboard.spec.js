// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Dashboard E2E Tests
 *
 * Tests the various states of the dashboard:
 * 1. Non-subscribed users see "Get Started with Alfred" card
 * 2. Subscribed users with VM provisioning see progress UI
 * 3. Subscribed users with ready VM see Quickstart section
 * 4. Anthropic API key configuration section
 */

test.describe('Dashboard', () => {
  test.describe('Authentication', () => {
    test('should redirect to signin when not authenticated', async ({ page, context }) => {
      // Clear all cookies to ensure we're logged out
      await context.clearCookies();

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should redirect to signin page
      await expect(page).toHaveURL(/\/api\/auth\/signin/);
    });
  });

  test.describe('Non-Subscribed User State', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-no-subscription',
              email: 'nosubscription@test.com',
              name: 'Test User',
            },
          }),
        });
      });

      // Mock user status API - no subscription
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
    });

    test('should display "Get Started with Alfred" card', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('Dashboard');

      // Check for the Get Started card
      await expect(page.locator('.card')).toContainText('Get Started with Alfred');
      await expect(page.locator('.card')).toContainText(
        'Subscribe to get your dedicated AI automation VM'
      );

      // Check for pricing link
      const pricingLink = page.locator('a[href="/#pricing"]');
      await expect(pricingLink).toBeVisible();
      await expect(pricingLink).toContainText('View Pricing');
    });

    test('should not display Quickstart section', async ({ page }) => {
      await page.goto('/dashboard');

      // Quickstart should not be visible
      await expect(page.locator('text=Quick Start')).not.toBeVisible();
      await expect(page.locator('text=MCP Connection URL')).not.toBeVisible();
    });

    test('should not display Anthropic API configuration section', async ({ page }) => {
      await page.goto('/dashboard');

      // API config section should not be visible
      await expect(page.locator('text=Anthropic API Configuration')).not.toBeVisible();
    });
  });

  test.describe('VM Provisioning State', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-provisioning',
              email: 'provisioning@test.com',
              name: 'Test User',
            },
          }),
        });
      });
    });

    test('should display provisioning status with progress UI', async ({ page }) => {
      let statusCallCount = 0;

      // Mock user status API - provisioning state
      await page.route('**/api/user/status', async (route) => {
        statusCallCount++;

        // Return provisioning status for the first few calls
        if (statusCallCount < 3) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              hasAccess: true,
              vmStatus: 'provisioning',
              vmSubdomain: null,
              vmIp: null,
              hasApiKey: false,
              maskedApiKey: null,
              apiKeyCreatedAt: null,
            }),
          });
        } else {
          // After a few calls, return ready status to simulate completion
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              hasAccess: true,
              vmStatus: 'ready',
              vmSubdomain: 'test-user',
              vmIp: '192.168.1.100',
              hasApiKey: false,
              maskedApiKey: null,
              apiKeyCreatedAt: null,
            }),
          });
        }
      });

      await page.goto('/dashboard');

      // Check for provisioning status UI
      await expect(page.locator('text=Setting Up Your Environment')).toBeVisible();
      await expect(page.locator('text=Setting up your dedicated VM')).toBeVisible();

      // Check for progress bar
      await expect(page.locator('progress.progress')).toBeVisible();

      // Check for setup steps
      await expect(page.locator('text=Creating VM')).toBeVisible();
      await expect(page.locator('text=Installing Docker')).toBeVisible();
      await expect(page.locator('text=Configuring services')).toBeVisible();
    });

    test('should poll for status updates every 3 seconds', async ({ page }) => {
      const statusCalls = [];

      await page.route('**/api/user/status', async (route) => {
        statusCalls.push(Date.now());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'provisioning',
            vmSubdomain: null,
            vmIp: null,
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Wait for provisioning UI to appear
      await expect(page.locator('text=Setting Up Your Environment')).toBeVisible();

      // Wait for at least 3 status calls (initial + 2 polls)
      await page.waitForTimeout(7000);

      // Verify we got multiple calls
      expect(statusCalls.length).toBeGreaterThanOrEqual(3);

      // Verify polling interval is approximately 3 seconds
      if (statusCalls.length >= 2) {
        const timeDiff = statusCalls[1] - statusCalls[0];
        expect(timeDiff).toBeGreaterThan(2500); // Allow some variance
        expect(timeDiff).toBeLessThan(3500);
      }
    });

    test('should display error state when provisioning fails', async ({ page }) => {
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'error',
            vmSubdomain: null,
            vmIp: null,
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Check for error message
      await expect(page.locator('text=Setup Issue')).toBeVisible();
      await expect(page.locator('text=There was an issue provisioning your VM')).toBeVisible();

      // Check for retry button
      const retryButton = page.locator('button:has-text("Retry Setup")');
      await expect(retryButton).toBeVisible();
    });

    test('should display pending state', async ({ page }) => {
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'pending',
            vmSubdomain: null,
            vmIp: null,
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Check for pending message
      await expect(page.locator('text=Preparing your AI automation environment')).toBeVisible();
    });
  });

  test.describe('Ready VM State - Quickstart Section', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-ready',
              email: 'ready@test.com',
              name: 'Test User',
            },
          }),
        });
      });

      // Mock user status API - ready state
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'ready',
            vmSubdomain: 'test-user',
            vmIp: '192.168.1.100',
            hasApiKey: true,
            maskedApiKey: 'alf_************************abc123',
            apiKeyCreatedAt: new Date().toISOString(),
          }),
        });
      });

      // Mock VM config API
      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: true,
            anthropic_key_masked: 'sk-ant-***************xyz789',
          }),
        });
      });
    });

    test('should display Quickstart section with all credentials', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for Quickstart heading
      await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();

      // Check for MCP Connection URL
      const mcpUrlInput = page.locator('input[value^="mcp://"]');
      await expect(mcpUrlInput).toBeVisible();
      await expect(mcpUrlInput).toHaveValue('mcp://test-user.alfredos.site');

      // Check for Webhook URL
      const webhookUrlInput = page.locator('input[value^="https://"][value*="webhook"]');
      await expect(webhookUrlInput).toBeVisible();
      await expect(webhookUrlInput).toHaveValue('https://test-user.alfredos.site/webhook');

      // Check for API Key display
      const apiKeyInput = page.locator('input[value*="alf_"]');
      await expect(apiKeyInput).toBeVisible();
      await expect(apiKeyInput).toHaveValue('alf_************************abc123');

      // Check for security warning
      await expect(page.locator('text=Keep your API key secure')).toBeVisible();
    });

    test('should have copy buttons for all credentials', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for Quickstart to load
      await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();

      // Check that there are 3 copy buttons (MCP URL, Webhook URL, API Key)
      const copyButtons = page.locator('.join button:has(svg)');
      await expect(copyButtons).toHaveCount(3);
    });

    test('should copy MCP URL to clipboard when button is clicked', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.goto('/dashboard');

      // Wait for Quickstart to load
      await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();

      // Click the first copy button (MCP URL)
      const mcpCopyButton = page.locator('input[value^="mcp://"]').locator('..').locator('button');
      await mcpCopyButton.click();

      // Wait for toast notification
      await expect(page.locator('text=MCP URL copied to clipboard')).toBeVisible({ timeout: 2000 });
    });

    test('should display "Generate New Key" button', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('button:has-text("Generate New Key")')).toBeVisible();
    });

    test('should show confirmation dialog when generating new API key', async ({ page }) => {
      await page.goto('/dashboard');

      // Mock the confirm dialog
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('generate a new API key');
        expect(dialog.message()).toContain('invalidate the old one');
        await dialog.dismiss();
      });

      // Click Generate New Key button
      await page.locator('button:has-text("Generate New Key")').click();
    });

    test('should generate new API key on confirmation', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      // Mock API key generation endpoint
      await page.route('**/api/user/api-key', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              apiKey: 'alf_new_key_xyz789abc123def456',
            }),
          });
        }
      });

      await page.goto('/dashboard');

      // Accept the confirm dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Click Generate New Key button
      await page.locator('button:has-text("Generate New Key")').click();

      // Wait for success toast
      await expect(page.locator('text=New API key generated successfully')).toBeVisible({ timeout: 3000 });

      // Verify the new key is displayed
      const apiKeyInput = page.locator('input[value^="alf_"]');
      await expect(apiKeyInput).toHaveValue('alf_new_key_xyz789abc123def456');
    });

    test('should display loading state during API key generation', async ({ page }) => {
      // Delay the API response
      await page.route('**/api/user/api-key', async (route) => {
        if (route.request().method() === 'POST') {
          await page.waitForTimeout(1000);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              apiKey: 'alf_new_key_xyz789abc123def456',
            }),
          });
        }
      });

      await page.goto('/dashboard');

      // Accept the confirm dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Click Generate New Key button
      await page.locator('button:has-text("Generate New Key")').click();

      // Check for loading state
      await expect(page.locator('button:has-text("Generating")')).toBeVisible();
      await expect(page.locator('.loading-spinner')).toBeVisible();
    });
  });

  test.describe('Ready VM State - Anthropic API Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-ready',
              email: 'ready@test.com',
              name: 'Test User',
            },
          }),
        });
      });

      // Mock user status API - ready state
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'ready',
            vmSubdomain: 'test-user',
            vmIp: '192.168.1.100',
            hasApiKey: true,
            maskedApiKey: 'alf_************************abc123',
            apiKeyCreatedAt: new Date().toISOString(),
          }),
        });
      });
    });

    test('should display configured state when API key is set', async ({ page }) => {
      // Mock VM config with API key configured
      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: true,
            anthropic_key_masked: 'sk-ant-***************xyz789',
          }),
        });
      });

      await page.goto('/dashboard');

      // Check for Anthropic API Configuration section
      await expect(page.locator('h2:has-text("Anthropic API Configuration")')).toBeVisible();

      // Check for success indicator
      await expect(page.locator('text=API key configured')).toBeVisible();
      await expect(page.locator('.text-success')).toBeVisible();

      // Check for masked key display
      await expect(page.locator('text=Current key:')).toBeVisible();
      await expect(page.locator('text=sk-ant-***************xyz789')).toBeVisible();

      // Check for Update button
      await expect(page.locator('button:has-text("Update API Key")')).toBeVisible();
    });

    test('should display warning state when API key is not set', async ({ page }) => {
      // Mock VM config without API key
      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: false,
            anthropic_key_masked: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Check for Anthropic API Configuration section
      await expect(page.locator('h2:has-text("Anthropic API Configuration")')).toBeVisible();

      // Check for warning indicator
      await expect(page.locator('text=No API key configured')).toBeVisible();
      await expect(page.locator('.text-warning')).toBeVisible();

      // Check for description text
      await expect(page.locator('text=You need to configure your Anthropic API key')).toBeVisible();

      // Check for Set API Key button
      await expect(page.locator('button:has-text("Set API Key")')).toBeVisible();
    });

    test('should auto-open modal when API key is not configured', async ({ page }) => {
      // Mock VM config without API key
      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: false,
            anthropic_key_masked: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Wait for modal to appear automatically
      // Note: This assumes the modal has specific identifiable content
      // Adjust selectors based on actual AnthropicKeyModal implementation
      await expect(page.locator('dialog[open]').or(page.locator('.modal-open'))).toBeVisible({ timeout: 2000 });
    });

    test('should open modal when clicking Set/Update API Key button', async ({ page }) => {
      // Mock VM config with API key configured
      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: true,
            anthropic_key_masked: 'sk-ant-***************xyz789',
          }),
        });
      });

      await page.goto('/dashboard');

      // Click Update API Key button
      await page.locator('button:has-text("Update API Key")').click();

      // Modal should open
      await expect(page.locator('dialog[open]').or(page.locator('.modal-open'))).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('Loading State', () => {
    test('should display loading spinner while fetching data', async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user',
              email: 'test@test.com',
              name: 'Test User',
            },
          }),
        });
      });

      // Delay the user status response
      await page.route('**/api/user/status', async (route) => {
        await page.waitForTimeout(1000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'ready',
            vmSubdomain: 'test-user',
            vmIp: '192.168.1.100',
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Should show loading spinner
      await expect(page.locator('.loading-spinner')).toBeVisible();

      // Wait for loading to complete
      await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user',
              email: 'test@test.com',
              name: 'Test User',
            },
          }),
        });
      });
    });

    test('should handle API error gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/dashboard');

      // Page should still render (though data may be missing)
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });

    test('should handle VM not ready with no API key', async ({ page }) => {
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'ready',
            vmSubdomain: 'test-user',
            vmIp: '192.168.1.100',
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: false,
            anthropic_key_masked: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // Should show Quickstart with "No API key generated"
      const apiKeyInput = page.locator('input[value="No API key generated"]');
      await expect(apiKeyInput).toBeVisible();

      // Copy button should be disabled
      const apiKeyCopyButton = apiKeyInput.locator('..').locator('button');
      await expect(apiKeyCopyButton).toBeDisabled();
    });

    test('should handle empty subdomain gracefully', async ({ page }) => {
      await page.route('**/api/user/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasAccess: true,
            vmStatus: 'ready',
            vmSubdomain: null, // No subdomain
            vmIp: '192.168.1.100',
            hasApiKey: false,
            maskedApiKey: null,
            apiKeyCreatedAt: null,
          }),
        });
      });

      await page.route('**/api/proxy/vm/config', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            has_anthropic_key: false,
            anthropic_key_masked: null,
          }),
        });
      });

      await page.goto('/dashboard');

      // URLs should be empty strings
      const mcpUrlInput = page.locator('input[value=""]').first();
      await expect(mcpUrlInput).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Mock authentication and data
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user',
              email: 'test@test.com',
              name: 'Test User',
            },
          }),
        });
      });

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

      await page.goto('/dashboard');

      // Dashboard should render properly
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text=Get Started with Alfred')).toBeVisible();

      // Elements should be vertically stacked and readable
      const card = page.locator('.card').first();
      const boundingBox = await card.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    });
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const {
  setupReadyDashboard,
  setupProvisioningDashboard,
  setupNonSubscribedDashboard,
  mockApiKeyGeneration,
  waitForDashboardLoad,
} = require('./helpers/dashboard-mocks');

/**
 * Dashboard E2E Tests - Simplified Version
 *
 * This file demonstrates how to use the dashboard-mocks helpers
 * to write cleaner, more maintainable tests.
 *
 * Compare this to dashboard.spec.js to see the difference!
 */

test.describe('Dashboard - Simplified Tests', () => {
  test.describe('User States', () => {
    test('non-subscribed user sees get started card', async ({ page }) => {
      await setupNonSubscribedDashboard(page);
      await page.goto('/dashboard');

      await expect(page.locator('text=Get Started with Alfred')).toBeVisible();
      await expect(page.locator('a[href="/#pricing"]')).toBeVisible();
    });

    test('provisioning user sees progress UI', async ({ page }) => {
      await setupProvisioningDashboard(page, { status: 'provisioning' });
      await page.goto('/dashboard');

      await expect(page.locator('text=Setting Up Your Environment')).toBeVisible();
      await expect(page.locator('progress.progress')).toBeVisible();
    });

    test('ready user sees full dashboard', async ({ page }) => {
      await setupReadyDashboard(page);
      await page.goto('/dashboard');

      await waitForDashboardLoad(page);

      // Verify Quickstart section
      await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();
      await expect(page.locator('input[value^="mcp://"]')).toBeVisible();
      await expect(page.locator('input[value*="webhook"]')).toBeVisible();

      // Verify Anthropic API section
      await expect(page.locator('h2:has-text("Anthropic API Configuration")')).toBeVisible();
    });
  });

  test.describe('API Key Management', () => {
    test('can generate new API key', async ({ page }) => {
      await setupReadyDashboard(page);
      await mockApiKeyGeneration(page, {
        apiKey: 'alf_brand_new_key_123',
      });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      // Accept confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());

      // Click generate button
      await page.locator('button:has-text("Generate New Key")').click();

      // Verify success
      await expect(page.locator('text=New API key generated successfully')).toBeVisible();
      await expect(page.locator('input[value="alf_brand_new_key_123"]')).toBeVisible();
    });

    test('shows loading state during generation', async ({ page }) => {
      await setupReadyDashboard(page);
      await mockApiKeyGeneration(page, {
        delay: 1000,
      });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      page.on('dialog', (dialog) => dialog.accept());

      await page.locator('button:has-text("Generate New Key")').click();

      // Check loading state
      await expect(page.locator('button:has-text("Generating")')).toBeVisible();
      await expect(page.locator('.loading-spinner')).toBeVisible();
    });

    test('handles generation error', async ({ page }) => {
      await setupReadyDashboard(page);
      await mockApiKeyGeneration(page, {
        shouldFail: true,
      });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      page.on('dialog', (dialog) => dialog.accept());

      await page.locator('button:has-text("Generate New Key")').click();

      // Verify error message
      await expect(page.locator('text=Failed to generate API key')).toBeVisible();
    });
  });

  test.describe('Anthropic API Configuration', () => {
    test('shows warning when key not configured', async ({ page }) => {
      await setupReadyDashboard(page, { hasAnthropicKey: false });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      await expect(page.locator('text=No API key configured')).toBeVisible();
      await expect(page.locator('.text-warning')).toBeVisible();
      await expect(page.locator('button:has-text("Set API Key")')).toBeVisible();
    });

    test('shows success when key is configured', async ({ page }) => {
      await setupReadyDashboard(page, { hasAnthropicKey: true });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      await expect(page.locator('text=API key configured')).toBeVisible();
      await expect(page.locator('.text-success')).toBeVisible();
      await expect(page.locator('button:has-text("Update API Key")')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('handles missing subdomain gracefully', async ({ page }) => {
      await setupReadyDashboard(page, { subdomain: null });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      // URLs should be empty
      const inputs = await page.locator('.form-control input[readonly]').all();
      for (const input of inputs) {
        const value = await input.inputValue();
        // Either empty or "No API key generated"
        expect(value === '' || value === 'No API key generated').toBeTruthy();
      }
    });

    test('shows quickstart without API key', async ({ page }) => {
      await setupReadyDashboard(page, { hasApiKey: false });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      // Quickstart should still be visible
      await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();

      // API key input should show "No API key generated"
      await expect(page.locator('input[value="No API key generated"]')).toBeVisible();

      // Copy button should be disabled
      const apiKeySection = page.locator('label:has-text("API Key")').locator('..');
      const copyButton = apiKeySection.locator('button').last();
      await expect(copyButton).toBeDisabled();
    });
  });

  test.describe('Custom User Scenarios', () => {
    test('custom user with specific subdomain', async ({ page }) => {
      await setupReadyDashboard(page, {
        user: {
          id: 'custom-user-123',
          email: 'custom@example.com',
          name: 'Custom User',
        },
        subdomain: 'my-custom-vm',
        hasApiKey: true,
        hasAnthropicKey: true,
      });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      // Verify custom subdomain in URLs
      await expect(page.locator('input[value="mcp://my-custom-vm.alfredos.site"]')).toBeVisible();
      await expect(page.locator('input[value="https://my-custom-vm.alfredos.site/webhook"]')).toBeVisible();
    });

    test('error state during provisioning', async ({ page }) => {
      await setupProvisioningDashboard(page, { status: 'error' });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      await expect(page.locator('text=Setup Issue')).toBeVisible();
      await expect(page.locator('text=There was an issue provisioning your VM')).toBeVisible();
      await expect(page.locator('button:has-text("Retry Setup")')).toBeVisible();
    });

    test('pending state during provisioning', async ({ page }) => {
      await setupProvisioningDashboard(page, { status: 'pending' });

      await page.goto('/dashboard');
      await waitForDashboardLoad(page);

      await expect(page.locator('text=Preparing your AI automation environment')).toBeVisible();
    });
  });
});

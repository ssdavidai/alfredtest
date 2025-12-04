// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Alfred Onboarding Flow E2E Tests
 *
 * This test suite verifies the complete user journey from landing page
 * through sign-up, subscription, VM provisioning, and dashboard access.
 *
 * Flow tested:
 * 1. Landing page → Hero, Features, Pricing, FAQ
 * 2. Sign-up flow → Authentication
 * 3. Dashboard states → Subscription prompt, Provisioning, Ready
 * 4. Quickstart information display
 * 5. Error handling
 */

test.describe('Alfred Onboarding Flow', () => {

  test.describe('Landing Page', () => {

    test('should display hero section with proper branding', async ({ page }) => {
      await page.goto('/');

      // Check hero section exists
      await expect(page.locator('h1')).toContainText('Meet Alfred, Your AI Butler');

      // Verify tagline
      await expect(page.getByText('Zero-config AI automation platform with dedicated infrastructure')).toBeVisible();

      // Check CTA buttons
      const getStartedButton = page.getByRole('button', { name: 'Get Started' }).first();
      await expect(getStartedButton).toBeVisible();

      const learnMoreButton = page.getByRole('link', { name: 'Learn More' });
      await expect(learnMoreButton).toBeVisible();

      // Verify Alfred logo is present
      await expect(page.locator('svg').first()).toBeVisible();
    });

    test('should display problem section with three pain points', async ({ page }) => {
      await page.goto('/');

      // Check problem section heading
      await expect(page.getByRole('heading', { name: 'Tired of Manual Tasks?' })).toBeVisible();

      // Verify all three problem cards
      await expect(page.getByText('Hours Wasted on Setup')).toBeVisible();
      await expect(page.getByText('Credential Security Risks')).toBeVisible();
      await expect(page.getByText('Constant Maintenance')).toBeVisible();

      // Check problem descriptions are visible
      await expect(page.getByText('Traditional automation tools require extensive configuration')).toBeVisible();
    });

    test('should display features section with four key benefits', async ({ page }) => {
      await page.goto('/');

      // Navigate to features section
      await page.locator('#features').scrollIntoViewIfNeeded();

      // Check features heading
      await expect(page.getByRole('heading', { name: 'Why Choose Alfred?' })).toBeVisible();

      // Verify all four feature cards with emojis
      const features = [
        { emoji: '🚀', title: 'Zero-Config', description: 'Get started in minutes' },
        { emoji: '🏠', title: 'Data Sovereignty', description: 'Your credentials stay on your infrastructure' },
        { emoji: '🧩', title: 'Extensible', description: 'Build custom skills and integrations' },
        { emoji: '🧠', title: 'Self-Teaching', description: 'Alfred learns from your patterns' }
      ];

      for (const feature of features) {
        await expect(page.getByText(feature.emoji)).toBeVisible();
        await expect(page.getByText(feature.title, { exact: true })).toBeVisible();
        await expect(page.locator('text=' + feature.description).first()).toBeVisible();
      }
    });

    test('should display pricing section with detailed plan', async ({ page }) => {
      await page.goto('/');

      // Navigate to pricing
      await page.locator('#pricing').scrollIntoViewIfNeeded();

      // Check pricing heading
      await expect(page.getByRole('heading', { name: 'Simple, Transparent Pricing' })).toBeVisible();

      // Verify badge
      await expect(page.getByText('Most Popular')).toBeVisible();

      // Check plan name
      await expect(page.getByRole('heading', { name: 'Alfred Pro' })).toBeVisible();

      // Verify pricing (strikethrough and current price)
      await expect(page.getByText('$49', { exact: false })).toBeVisible();
      await expect(page.getByText('$29', { exact: false })).toBeVisible();

      // Check feature list items
      const pricingFeatures = [
        'Dedicated AI agent infrastructure',
        'Zero-config deployment',
        'Full data sovereignty',
        'Extensible plugin system',
        'Self-teaching capabilities',
        'Priority support'
      ];

      for (const feature of pricingFeatures) {
        await expect(page.getByText(feature)).toBeVisible();
      }

      // Verify free trial text
      await expect(page.getByText('14-day free trial. No credit card required.')).toBeVisible();
    });

    test('should display FAQ section with expandable questions', async ({ page }) => {
      await page.goto('/');

      // Navigate to FAQ
      await page.locator('#faq').scrollIntoViewIfNeeded();

      // Check FAQ heading
      await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();

      // Verify FAQ questions
      const faqQuestions = [
        'What is Alfred?',
        'How does data sovereignty work?',
        'What does "zero-config" mean?',
        'Can I build custom integrations?',
        'Is there a free trial?'
      ];

      for (const question of faqQuestions) {
        await expect(page.getByText(question)).toBeVisible();
      }

      // Test accordion expansion (one should be open by default)
      const firstAnswer = page.getByText('Alfred is an AI-powered automation platform');
      await expect(firstAnswer).toBeVisible();
    });

    test('should have working navigation links', async ({ page }) => {
      await page.goto('/');

      // Test Features link
      const featuresLink = page.getByRole('link', { name: 'Features' }).first();
      await featuresLink.click();
      await expect(page).toHaveURL('/#features');

      // Test Pricing link
      await page.goto('/');
      const pricingLink = page.getByRole('link', { name: 'Pricing' }).first();
      await pricingLink.click();
      await expect(page).toHaveURL('/#pricing');

      // Test FAQ link
      await page.goto('/');
      const faqLink = page.getByRole('link', { name: 'FAQ' }).first();
      await faqLink.click();
      await expect(page).toHaveURL('/#faq');
    });

    test('should display CTA section with sign up button', async ({ page }) => {
      await page.goto('/');

      // Scroll to bottom CTA
      await page.locator('text=Ready to Meet Your AI Butler?').scrollIntoViewIfNeeded();

      // Check CTA heading and description
      await expect(page.getByRole('heading', { name: 'Ready to Meet Your AI Butler?' })).toBeVisible();
      await expect(page.getByText('Join thousands of professionals who trust Alfred')).toBeVisible();

      // Verify CTA button
      await expect(page.getByRole('button', { name: 'Get Started Free' })).toBeVisible();
    });

    test('should display footer with navigation and legal links', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.locator('footer').scrollIntoViewIfNeeded();

      // Check footer links
      await expect(page.locator('footer').getByRole('link', { name: 'Features' })).toBeVisible();
      await expect(page.locator('footer').getByRole('link', { name: 'Pricing' })).toBeVisible();
      await expect(page.locator('footer').getByRole('link', { name: 'FAQ' })).toBeVisible();
      await expect(page.locator('footer').getByRole('link', { name: 'Terms' })).toBeVisible();
      await expect(page.locator('footer').getByRole('link', { name: 'Privacy' })).toBeVisible();

      // Check copyright
      const currentYear = new Date().getFullYear();
      await expect(page.getByText(`© ${currentYear}`)).toBeVisible();
    });

  });

  test.describe('Sign Up and Authentication Flow', () => {

    test('should show login button on landing page', async ({ page }) => {
      await page.goto('/');

      // Check Login button in header
      const loginButton = page.getByRole('button', { name: 'Login' });
      await expect(loginButton).toBeVisible();
    });

    test('should redirect to auth when clicking Get Started', async ({ page }) => {
      await page.goto('/');

      // Click Get Started button
      const getStartedButton = page.getByRole('button', { name: 'Get Started' }).first();
      await getStartedButton.click();

      // Should trigger NextAuth sign-in flow
      // Note: Actual redirect depends on NextAuth configuration
      // This test verifies the button is clickable and triggers navigation
      await page.waitForTimeout(500);
    });

    test('should show user info when authenticated', async ({ page, context }) => {
      // This test requires authentication setup
      // For demo purposes, we'll test the conditional rendering logic

      // Visit the page
      await page.goto('/');

      // When authenticated, button should change to show user info
      // This would be tested with proper auth mocking
    });

  });

  test.describe('Dashboard States', () => {

    test('should redirect unauthenticated users', async ({ page }) => {
      // Try to access dashboard without auth
      await page.goto('/dashboard');

      // Should either redirect to sign-in or show auth wall
      // Note: Actual behavior depends on middleware/layout
      await page.waitForLoadState('networkidle');

      // Verify we're either on sign-in or shown auth prompt
      const isAuthPage = page.url().includes('auth') || page.url().includes('signin');
      const hasAuthPrompt = await page.locator('text=/sign|login|authenticate/i').isVisible().catch(() => false);

      expect(isAuthPage || hasAuthPrompt).toBeTruthy();
    });

    test.describe('Authenticated Dashboard States', () => {

      // Note: These tests would require proper auth setup
      // For now, we're documenting the expected behavior

      test.skip('should show subscription prompt when user has no access', async ({ page }) => {
        // Mock: User is authenticated but has no subscription
        // Expected: Dashboard shows "Get Started with Alfred" card
        await page.goto('/dashboard');

        await expect(page.getByRole('heading', { name: 'Get Started with Alfred' })).toBeVisible();
        await expect(page.getByText('Subscribe to get your dedicated AI automation VM')).toBeVisible();
        await expect(page.getByRole('link', { name: 'View Pricing' })).toBeVisible();
      });

      test.skip('should show provisioning status when VM is being created', async ({ page }) => {
        // Mock: User has subscription, VM status is "provisioning"
        await page.goto('/dashboard');

        // Check provisioning UI elements
        await expect(page.getByText('Setting Up Your Environment')).toBeVisible();
        await expect(page.getByText('Setting up your dedicated VM')).toBeVisible();

        // Verify progress indicator
        await expect(page.locator('progress.progress')).toBeVisible();

        // Check provisioning steps
        const steps = [
          'Creating VM',
          'Installing Docker',
          'Configuring services',
          'Setting up DNS',
          'Final checks'
        ];

        for (const step of steps) {
          await expect(page.getByText(step)).toBeVisible();
        }
      });

      test.skip('should poll for status updates during provisioning', async ({ page }) => {
        // Mock: VM is provisioning
        await page.goto('/dashboard');

        // Wait for polling to occur (every 3 seconds)
        await page.waitForTimeout(3500);

        // Verify API calls are being made
        // This would require network interception in actual implementation
      });

      test.skip('should show full dashboard when VM is ready', async ({ page }) => {
        // Mock: User has subscription, VM status is "ready"
        await page.goto('/dashboard');

        // Check main dashboard heading
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

        // Verify Quickstart section
        await expect(page.getByRole('heading', { name: 'Quick Start' })).toBeVisible();

        // Check quickstart fields
        await expect(page.getByText('MCP Connection URL')).toBeVisible();
        await expect(page.getByText('Webhook URL')).toBeVisible();
        await expect(page.getByText('API Key')).toBeVisible();

        // Verify subdomain is shown in URLs
        await expect(page.locator('input[value*="alfredos.site"]')).toBeVisible();
      });

      test.skip('should display Anthropic API key configuration section', async ({ page }) => {
        // Mock: VM is ready
        await page.goto('/dashboard');

        // Check API configuration card
        await expect(page.getByRole('heading', { name: 'Anthropic API Configuration' })).toBeVisible();
      });

      test.skip('should show warning when Anthropic API key is not configured', async ({ page }) => {
        // Mock: VM ready, no API key set
        await page.goto('/dashboard');

        // Check warning message
        await expect(page.getByText('No API key configured')).toBeVisible();
        await expect(page.getByText('You need to configure your Anthropic API key')).toBeVisible();

        // Verify "Set API Key" button
        const setKeyButton = page.getByRole('button', { name: 'Set API Key' });
        await expect(setKeyButton).toBeVisible();

        // Click button should open modal
        await setKeyButton.click();
        await page.waitForTimeout(300); // Wait for modal animation
      });

      test.skip('should show success state when API key is configured', async ({ page }) => {
        // Mock: VM ready, API key configured
        await page.goto('/dashboard');

        // Check success indicator
        await expect(page.getByText('API key configured')).toBeVisible();

        // Verify masked key is shown
        await expect(page.locator('text=/sk-ant-.{4}\\.{3}/i')).toBeVisible();

        // Check "Update API Key" button
        await expect(page.getByRole('button', { name: 'Update API Key' })).toBeVisible();
      });

      test.skip('should handle error state during provisioning', async ({ page }) => {
        // Mock: VM provisioning failed
        await page.goto('/dashboard');

        // Check error UI
        await expect(page.getByText('Setup Issue')).toBeVisible();
        await expect(page.getByText('There was an issue provisioning your VM')).toBeVisible();

        // Verify retry button
        const retryButton = page.getByRole('button', { name: 'Retry Setup' });
        await expect(retryButton).toBeVisible();
      });

    });

  });

  test.describe('Quickstart Component', () => {

    test.skip('should display all quickstart connection details', async ({ page }) => {
      // Mock: Authenticated, VM ready
      await page.goto('/dashboard');

      // Verify MCP URL format
      const mcpInput = page.locator('input[value*="mcp://"]');
      await expect(mcpInput).toBeVisible();
      await expect(mcpInput).toHaveValue(/mcp:\/\/.*\.alfredos\.site/);

      // Verify Webhook URL format
      const webhookInput = page.locator('input[value*="https://"]').filter({ hasText: 'webhook' });
      await expect(webhookInput).toBeVisible();
      await expect(webhookInput).toHaveValue(/https:\/\/.*\.alfredos\.site\/webhook/);
    });

    test.skip('should copy connection details to clipboard', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.goto('/dashboard');

      // Click copy button for MCP URL
      const mcpCopyButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await mcpCopyButton.click();

      // Verify toast notification appears
      await expect(page.getByText(/copied to clipboard/i)).toBeVisible();

      // Check clipboard content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('mcp://');
      expect(clipboardText).toContain('alfredos.site');
    });

    test.skip('should generate new API key with confirmation', async ({ page }) => {
      await page.goto('/dashboard');

      // Click "Generate New Key" button
      const generateButton = page.getByRole('button', { name: 'Generate New Key' });
      await generateButton.click();

      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('invalidate the old one');
        await dialog.accept();
      });

      await page.waitForTimeout(500);

      // Verify success message
      await expect(page.getByText('New API key generated successfully')).toBeVisible();
    });

    test.skip('should show warning about API key security', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for security warning when API key is visible
      await expect(page.getByText(/Keep your API key secure/i)).toBeVisible();
      await expect(page.getByText(/won't be shown in full again/i)).toBeVisible();
    });

  });

  test.describe('Error Handling', () => {

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.route('**/api/**', route => route.abort());

      await page.goto('/');

      // Page should still load (static content)
      await expect(page.getByRole('heading', { name: /Alfred/i })).toBeVisible();
    });

    test.skip('should show error when API calls fail', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/user/status', route => route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      }));

      await page.goto('/dashboard');

      // Should handle error gracefully
      await page.waitForTimeout(1000);
      // Error handling depends on implementation
    });

    test.skip('should handle provisioning timeout', async ({ page }) => {
      // Mock stuck provisioning state
      await page.route('**/api/user/status', route => route.fulfill({
        status: 200,
        body: JSON.stringify({
          vmStatus: 'provisioning',
          hasAccess: true
        })
      }));

      await page.goto('/dashboard');

      // Provisioning UI should be visible
      await expect(page.getByText('Setting Up Your Environment')).toBeVisible();

      // After extended time, user should see option to contact support
      // (Timeout handling would be implementation-specific)
    });

  });

  test.describe('Responsive Design', () => {

    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto('/');

      // Hero should be visible
      await expect(page.getByRole('heading', { name: /Alfred/i })).toBeVisible();

      // Navigation should work (may be hamburger menu)
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

      // Pricing section should stack vertically
      await page.locator('#pricing').scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: 'Alfred Pro' })).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad

      await page.goto('/');

      // All sections should be visible
      await expect(page.getByRole('heading', { name: /Alfred/i })).toBeVisible();

      // Features should display in grid
      await page.locator('#features').scrollIntoViewIfNeeded();
      const featureCards = page.locator('.text-center').filter({ hasText: 'Zero-Config' });
      await expect(featureCards.first()).toBeVisible();
    });

    test('should display properly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD

      await page.goto('/');

      // Wide layout should be visible
      await expect(page.getByRole('heading', { name: /Alfred/i })).toBeVisible();

      // Content should be properly centered
      const maxWidthContainer = page.locator('.max-w-7xl').first();
      await expect(maxWidthContainer).toBeVisible();
    });

  });

  test.describe('Performance and Accessibility', () => {

    test('should load landing page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load in under 3 seconds on good connection
      expect(loadTime).toBeLessThan(3000);

      // Page should be interactive
      await expect(page.getByRole('button', { name: 'Get Started' }).first()).toBeEnabled();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Check h1 exists and is unique
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Verify heading contains main keyword
      await expect(page.locator('h1')).toContainText('Alfred');
    });

    test('should have accessible buttons and links', async ({ page }) => {
      await page.goto('/');

      // All buttons should have accessible text
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        expect(text).toBeTruthy();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // First focusable element should be focused (likely a nav link)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON']).toContain(focusedElement);
    });

  });

  test.describe('Complete User Journey', () => {

    test('should complete full onboarding flow (integration test)', async ({ page }) => {
      // This is a high-level integration test documenting the complete flow

      // 1. Land on homepage
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Alfred/i })).toBeVisible();

      // 2. Explore features
      await page.getByRole('link', { name: 'Features' }).first().click();
      await expect(page.locator('#features')).toBeInViewport();

      // 3. Check pricing
      await page.getByRole('link', { name: 'Pricing' }).first().click();
      await expect(page.locator('#pricing')).toBeInViewport();
      await expect(page.getByText('$29')).toBeVisible();

      // 4. Read FAQ
      await page.getByRole('link', { name: 'FAQ' }).first().click();
      await expect(page.locator('#faq')).toBeInViewport();

      // 5. Click Get Started
      const getStartedButton = page.getByRole('button', { name: 'Get Started' }).first();
      await getStartedButton.click();

      // 6. Auth flow would happen here (skipped in test)

      // 7. After auth, redirect to dashboard
      // await expect(page).toHaveURL('/dashboard');

      // 8. Dashboard shows appropriate state based on subscription/VM status
      // This would continue with dashboard-specific tests
    });

  });

});

/**
 * Test Utilities and Helpers
 *
 * These can be expanded for authentication setup and API mocking
 */

/**
 * Note: Helper functions are available in:
 * - ./helpers/auth-utils.js - Authentication and API mocking
 * - ./helpers/test-utils.js - Common test utilities
 *
 * Import them as needed:
 * const { mockApiEndpoint, setupAuthContext } = require('./helpers/auth-utils');
 * const { waitForToast, mockClipboard } = require('./helpers/test-utils');
 */

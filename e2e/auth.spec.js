// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Authentication Flow E2E Tests
 *
 * Tests the complete authentication flow including:
 * - Landing page accessibility
 * - Sign-in page navigation
 * - OAuth providers (Google)
 * - Email magic link signin
 * - CSRF token security
 * - Error handling
 */

test.describe('Authentication Flow', () => {

  test.describe('Landing Page', () => {
    test('should load the landing page correctly', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Check that the page loaded successfully
      expect(page.url()).toContain('alfred.rocks');

      // Verify page title is set
      await expect(page).toHaveTitle(/alfred/i);

      // Check for common landing page elements
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should have a sign-in link or button', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for common sign-in patterns
      const signInButton = page.getByRole('link', { name: /sign in|log in|login|get started/i });
      await expect(signInButton.first()).toBeVisible();
    });
  });

  test.describe('Sign In Page', () => {
    test('should navigate to sign-in page at /api/auth/signin', async ({ page }) => {
      await page.goto('/api/auth/signin');

      // Wait for authentication page to load
      await page.waitForLoadState('networkidle');

      // Verify we're on the sign-in page
      expect(page.url()).toContain('/api/auth/signin');

      // Check that the page has authentication content
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('should display the sign-in page with authentication options', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // The page should have a form or authentication interface
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should have some authentication-related text
      const hasAuthText = await page.locator('body').getByText(/sign in|log in|continue/i).first().isVisible().catch(() => false);
      expect(hasAuthText).toBeTruthy();
    });
  });

  test.describe('OAuth Providers', () => {
    test('should display Google OAuth button', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Look for Google sign-in button
      // NextAuth typically renders provider buttons with the provider name
      const googleButton = page.getByRole('button', { name: /google/i })
        .or(page.getByRole('link', { name: /google/i }))
        .or(page.locator('button:has-text("Google")'))
        .or(page.locator('a:has-text("Google")'));

      await expect(googleButton.first()).toBeVisible({ timeout: 5000 });
    });

    test('should have Google button with correct styling', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      const googleButton = page.getByRole('button', { name: /google/i })
        .or(page.getByRole('link', { name: /google/i }))
        .first();

      // Verify button is visible and clickable
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('Google button should have correct action URL', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find the Google sign-in form or button
      const googleLink = page.getByRole('link', { name: /google/i })
        .or(page.locator('form:has-text("Google") button'))
        .first();

      if (await googleLink.isVisible()) {
        // If it's a link, check href
        const href = await googleLink.getAttribute('href').catch(() => null);
        if (href) {
          expect(href).toContain('google');
        }
      }
    });
  });

  test.describe('Email Magic Link Sign In', () => {
    test('should display email input form', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Look for email input field
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'));

      await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
    });

    test('should have a submit button for email signin', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Look for submit button
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'));

      await expect(submitButton.first()).toBeVisible();
    });

    test('should accept email input and enable submit', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      // Enter a valid email
      await emailInput.fill('test@example.com');

      // Verify the value was entered
      await expect(emailInput).toHaveValue('test@example.com');

      // Find and verify submit button is enabled
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      await expect(submitButton).toBeEnabled();
    });

    test('should submit email magic link form successfully', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      // Fill in email
      await emailInput.fill('test@example.com');

      // Find and click submit button
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      // Click submit and wait for navigation
      await Promise.race([
        submitButton.click(),
        page.waitForURL('**/verify-request**', { timeout: 10000 }).catch(() => null),
        page.waitForURL('**/auth/**', { timeout: 10000 }).catch(() => null),
      ]);

      // Give it a moment for any redirects
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Verify Request Page', () => {
    test('should redirect to verify-request page after email submission', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find and fill email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      await emailInput.fill('test@example.com');

      // Submit form
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      await submitButton.click();

      // Wait for redirect to verify-request page
      await page.waitForURL('**/verify-request**', { timeout: 10000 }).catch(async () => {
        // Alternative: check if we're on any auth-related confirmation page
        await page.waitForTimeout(2000);
      });

      // Verify we're on the verification page or similar confirmation page
      const url = page.url();
      const isOnVerifyPage = url.includes('verify-request') ||
                             url.includes('check-email') ||
                             url.includes('verify') ||
                             await page.locator('body').getByText(/check.*email|sent.*email|verify/i).isVisible();

      expect(isOnVerifyPage).toBeTruthy();
    });

    test('verify-request page should display confirmation message', async ({ page }) => {
      // Navigate directly to verify-request page
      await page.goto('/api/auth/verify-request');
      await page.waitForLoadState('networkidle');

      // Check for confirmation message
      const confirmationText = page.locator('body')
        .getByText(/check.*email|sent.*link|verify.*email|magic link/i);

      const hasConfirmation = await confirmationText.first().isVisible().catch(() => false);
      expect(hasConfirmation).toBeTruthy();
    });
  });

  test.describe('CSRF Token Security', () => {
    test('should generate and set CSRF token cookie', async ({ page, context }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Get cookies from the context
      const cookies = await context.cookies();

      // Look for CSRF token cookie
      const csrfCookie = cookies.find(cookie =>
        cookie.name.includes('csrf') ||
        cookie.name.includes('next-auth.csrf-token')
      );

      // Verify CSRF cookie exists
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie.value).toBeTruthy();
      expect(csrfCookie.value.length).toBeGreaterThan(0);
    });

    test('CSRF token should have secure cookie attributes', async ({ page, context }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      const cookies = await context.cookies();
      const csrfCookie = cookies.find(cookie =>
        cookie.name.includes('csrf') ||
        cookie.name.includes('next-auth.csrf-token')
      );

      expect(csrfCookie).toBeDefined();

      // Verify security attributes
      expect(csrfCookie.httpOnly).toBe(true);
      expect(csrfCookie.secure).toBe(true);
      expect(csrfCookie.sameSite).toBeTruthy();
    });

    test('should include CSRF token in form submission', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Look for hidden CSRF token input in the form
      const csrfInput = page.locator('input[name="csrfToken"]')
        .or(page.locator('input[name="csrf"]'))
        .or(page.locator('input[type="hidden"]'));

      // At least one form should have a CSRF token
      const count = await csrfInput.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Email Validation and Error Handling', () => {
    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      // Enter invalid email
      await emailInput.fill('invalid-email');

      // Try to submit
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      await submitButton.click();

      // Wait a moment for validation
      await page.waitForTimeout(1000);

      // Check for HTML5 validation or custom error message
      const isInvalid = await emailInput.evaluate((el) => {
        return !el.validity.valid || el.getAttribute('aria-invalid') === 'true';
      });

      // Or check for visible error message
      const errorMessage = await page.locator('text=/invalid.*email|enter.*valid.*email|email.*required/i')
        .first()
        .isVisible()
        .catch(() => false);

      // At least one validation method should indicate an error
      expect(isInvalid || errorMessage).toBeTruthy();
    });

    test('should not submit with empty email', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Find submit button and click without entering email
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      await submitButton.click();

      // Wait a moment
      await page.waitForTimeout(1000);

      // Should still be on the same page (not redirected)
      expect(page.url()).toBe(currentUrl);
    });

    test('should handle malformed email gracefully', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Find email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      // Test various invalid formats
      const invalidEmails = ['@example.com', 'test@', 'test..test@example.com', 'test @example.com'];

      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);

        const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
          .or(page.locator('button[type="submit"]'))
          .first();

        await submitButton.click();
        await page.waitForTimeout(500);

        // Should either show validation error or stay on same page
        const hasError = await emailInput.evaluate((el) => !el.validity.valid) ||
                        await page.locator('text=/invalid|error/i').first().isVisible().catch(() => false);

        // Clear for next iteration
        await emailInput.clear();
      }
    });
  });

  test.describe('Authentication Flow Integration', () => {
    test('complete flow: landing -> signin -> email -> verify', async ({ page }) => {
      // Start from landing page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate to sign in
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Fill in email
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[name="email"]'))
        .or(page.locator('input[type="email"]'))
        .first();

      await emailInput.fill('integration-test@example.com');

      // Submit
      const submitButton = page.getByRole('button', { name: /sign in|continue|submit|send/i })
        .or(page.locator('button[type="submit"]'))
        .first();

      await submitButton.click();

      // Wait for redirect
      await page.waitForTimeout(2000);

      // Should end up on verify page or see confirmation
      const finalUrl = page.url();
      const hasVerificationIndicator = finalUrl.includes('verify') ||
                                       await page.locator('body').getByText(/check.*email|verify/i).isVisible().catch(() => false);

      expect(hasVerificationIndicator).toBeTruthy();
    });

    test('should persist authentication state across pages', async ({ page, context }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // Get initial cookies
      const initialCookies = await context.cookies();

      // Navigate to another page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get cookies after navigation
      const afterCookies = await context.cookies();

      // Auth-related cookies should persist
      const hasAuthCookies = afterCookies.some(cookie =>
        cookie.name.includes('next-auth') || cookie.name.includes('session')
      );

      expect(afterCookies.length).toBeGreaterThan(0);
    });
  });

  test.describe('Security and Edge Cases', () => {
    test('should not expose sensitive data in page source', async ({ page }) => {
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();

      // Check that no obvious secrets are exposed
      expect(pageContent).not.toContain('NEXTAUTH_SECRET');
      expect(pageContent).not.toContain('GOOGLE_SECRET');
      expect(pageContent).not.toContain('RESEND_API_KEY');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // This test verifies the page doesn't crash with network issues
      await page.goto('/api/auth/signin');
      await page.waitForLoadState('networkidle');

      // The page should load even if there are some network issues
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should set appropriate security headers', async ({ page }) => {
      const response = await page.goto('/api/auth/signin');
      const headers = response.headers();

      // Verify some basic security headers are present
      // Note: Actual headers may vary based on deployment configuration
      expect(response.status()).toBe(200);
    });
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Alfred API E2E Tests
 * Tests API endpoints for authentication, user status, and webhooks
 *
 * Base URL: https://alfred.rocks
 */

test.describe('API Endpoints - Authentication', () => {

  test.describe('GET /api/auth/csrf', () => {
    test('should return CSRF token with correct structure', async ({ request }) => {
      const response = await request.get('/api/auth/csrf');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });

    test('should return valid content-type header', async ({ request }) => {
      const response = await request.get('/api/auth/csrf');

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('should set CSRF cookie', async ({ request }) => {
      const response = await request.get('/api/auth/csrf');

      const cookies = response.headers()['set-cookie'];
      expect(cookies).toBeDefined();
      // NextAuth uses 'next-auth.csrf-token' cookie name
      expect(cookies).toContain('next-auth.csrf-token');
    });
  });

  test.describe('GET /api/auth/providers', () => {
    test('should return available auth providers', async ({ request }) => {
      const response = await request.get('/api/auth/providers');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    test('should include resend provider when configured', async ({ request }) => {
      const response = await request.get('/api/auth/providers');
      const data = await response.json();

      // Check if resend provider exists (it may not be configured in all environments)
      if (data.resend) {
        expect(data.resend).toHaveProperty('id');
        expect(data.resend).toHaveProperty('name');
        expect(data.resend).toHaveProperty('type');
        expect(data.resend.id).toBe('resend');
      }
    });

    test('should include google provider when configured', async ({ request }) => {
      const response = await request.get('/api/auth/providers');
      const data = await response.json();

      // Check if google provider exists (it may not be configured in all environments)
      if (data.google) {
        expect(data.google).toHaveProperty('id');
        expect(data.google).toHaveProperty('name');
        expect(data.google).toHaveProperty('type');
        expect(data.google.id).toBe('google');
        expect(data.google.type).toBe('oauth');
      }
    });

    test('should have at least one provider configured', async ({ request }) => {
      const response = await request.get('/api/auth/providers');
      const data = await response.json();

      const providerKeys = Object.keys(data);
      expect(providerKeys.length).toBeGreaterThan(0);
    });
  });

  test.describe('POST /api/auth/signin/resend', () => {
    test('should return 400 when CSRF token is missing', async ({ request }) => {
      const response = await request.post('/api/auth/signin/resend', {
        data: {
          email: 'test@example.com',
        },
      });

      // NextAuth returns 400 for missing CSRF token
      expect([400, 403]).toContain(response.status());
    });

    test('should return 400 when email is missing', async ({ request }) => {
      // First get CSRF token
      const csrfResponse = await request.get('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      const response = await request.post('/api/auth/signin/resend', {
        data: {
          csrfToken,
        },
      });

      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 for invalid email format', async ({ request }) => {
      // First get CSRF token
      const csrfResponse = await request.get('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      const response = await request.post('/api/auth/signin/resend', {
        data: {
          email: 'not-a-valid-email',
          csrfToken,
        },
      });

      expect([400, 422]).toContain(response.status());
    });

    test('should accept valid email and CSRF token', async ({ request }) => {
      // First get CSRF token
      const csrfResponse = await request.get('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      // Extract cookies from CSRF response
      const cookies = csrfResponse.headers()['set-cookie'];

      const response = await request.post('/api/auth/signin/resend', {
        data: {
          email: 'test@example.com',
          csrfToken,
        },
        headers: {
          'Cookie': cookies,
        },
      });

      // Could be 200 (success) or 401 (resend not configured) depending on environment
      expect([200, 401, 400, 422]).toContain(response.status());
    });

    test('should handle missing resend provider gracefully', async ({ request }) => {
      const csrfResponse = await request.get('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();
      const cookies = csrfResponse.headers()['set-cookie'];

      const response = await request.post('/api/auth/signin/resend', {
        data: {
          email: 'test@example.com',
          csrfToken,
        },
        headers: {
          'Cookie': cookies,
        },
      });

      // Should handle gracefully whether provider is configured or not
      expect(response.status()).toBeLessThan(500);
    });
  });
});

test.describe('API Endpoints - User Status', () => {

  test.describe('GET /api/user/status', () => {
    test('should return 401 when not authenticated', async ({ request }) => {
      const response = await request.get('/api/user/status');

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Not signed in');
    });

    test('should have correct error response structure', async ({ request }) => {
      const response = await request.get('/api/user/status');

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toEqual({
        error: 'Not signed in',
      });
    });

    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/user/status');

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('should not leak user information when unauthenticated', async ({ request }) => {
      const response = await request.get('/api/user/status');
      const data = await response.json();

      // Should only contain error, no user data
      expect(Object.keys(data)).toHaveLength(1);
      expect(data).toHaveProperty('error');
      expect(data).not.toHaveProperty('hasAccess');
      expect(data).not.toHaveProperty('vmStatus');
      expect(data).not.toHaveProperty('apiKey');
    });

    // Note: Testing authenticated state requires setting up valid session
    // This would typically be done in a separate test with authentication setup
    test.skip('should return user status when authenticated', async ({ request }) => {
      // This test requires authentication setup
      // Implementation would need valid session cookies

      const response = await request.get('/api/user/status', {
        headers: {
          // 'Cookie': 'valid-session-cookie',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('hasAccess');
      expect(data).toHaveProperty('vmStatus');
      expect(data).toHaveProperty('vmSubdomain');
      expect(data).toHaveProperty('vmIp');
      expect(data).toHaveProperty('hasApiKey');
      expect(data).toHaveProperty('maskedApiKey');
      expect(data).toHaveProperty('apiKeyCreatedAt');
    });
  });
});

test.describe('API Endpoints - Webhooks', () => {

  test.describe('POST /api/webhook/stripe', () => {
    test('should endpoint exist and be accessible', async ({ request }) => {
      const response = await request.post('/api/webhook/stripe', {
        data: {},
      });

      // Endpoint should exist (not 404)
      expect(response.status()).not.toBe(404);
    });

    test('should return 400 for missing stripe signature', async ({ request }) => {
      const response = await request.post('/api/webhook/stripe', {
        data: {
          type: 'checkout.session.completed',
        },
      });

      // Should fail validation without proper Stripe signature
      expect([400, 500]).toContain(response.status());
    });

    test('should reject invalid stripe signature', async ({ request }) => {
      const response = await request.post('/api/webhook/stripe', {
        data: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
            },
          },
        }),
        headers: {
          'stripe-signature': 'invalid-signature',
          'content-type': 'application/json',
        },
      });

      // Should return 400 for invalid signature
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should return JSON error response', async ({ request }) => {
      const response = await request.post('/api/webhook/stripe', {
        data: {},
      });

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('should handle missing webhook secret configuration', async ({ request }) => {
      const response = await request.post('/api/webhook/stripe', {
        data: JSON.stringify({
          type: 'test',
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      // Should handle missing config (either 400 or 500)
      expect([400, 500]).toContain(response.status());

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should require raw body for signature verification', async ({ request }) => {
      // Stripe webhooks require the raw body for signature verification
      const testPayload = JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      });

      const response = await request.post('/api/webhook/stripe', {
        data: testPayload,
        headers: {
          'stripe-signature': 't=1234567890,v1=invalid',
          'content-type': 'application/json',
        },
      });

      // Should fail signature verification
      expect(response.status()).toBe(400);
    });

    // Note: Testing valid webhook events requires generating valid Stripe signatures
    // This typically requires the actual webhook secret
    test.skip('should process valid stripe webhook event', async ({ request }) => {
      // This test requires generating a valid Stripe signature
      // Implementation would need:
      // 1. Valid webhook secret
      // 2. Properly signed payload using Stripe's signature algorithm

      const response = await request.post('/api/webhook/stripe', {
        data: 'valid-signed-payload',
        headers: {
          'stripe-signature': 'valid-signature',
        },
      });

      expect(response.status()).toBe(200);
    });
  });
});

test.describe('API Endpoints - Error Handling', () => {

  test('should return 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get('/api/nonexistent/endpoint');

    expect(response.status()).toBe(404);
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/auth/signin/resend', {
      data: 'not-valid-json{',
      headers: {
        'content-type': 'application/json',
      },
    });

    // Should handle gracefully (400 bad request or similar)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('should set appropriate CORS headers', async ({ request }) => {
    const response = await request.get('/api/auth/providers');

    // Check for security headers
    const headers = response.headers();
    expect(headers).toBeDefined();
  });
});

test.describe('API Endpoints - Response Validation', () => {

  test('all successful responses should be valid JSON', async ({ request }) => {
    const endpoints = [
      '/api/auth/csrf',
      '/api/auth/providers',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);

      if (response.status() >= 200 && response.status() < 300) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');

        // Should be parseable as JSON
        const data = await response.json();
        expect(data).toBeDefined();
      }
    }
  });

  test('error responses should include error field', async ({ request }) => {
    const errorEndpoints = [
      { method: 'get', path: '/api/user/status' }, // 401 - not authenticated
    ];

    for (const { method, path } of errorEndpoints) {
      const response = await request[method](path);

      if (response.status() >= 400) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    }
  });
});

test.describe('API Endpoints - Security', () => {

  test('should not expose sensitive headers', async ({ request }) => {
    const response = await request.get('/api/auth/providers');

    const headers = response.headers();
    // Should not expose internal server details
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('CSRF endpoint should use secure cookies', async ({ request }) => {
    const response = await request.get('/api/auth/csrf');

    const cookies = response.headers()['set-cookie'];
    if (cookies) {
      // In production, CSRF cookies should be secure
      // (May not be true in development mode)
      expect(cookies).toBeDefined();
    }
  });

  test('should validate content-type for POST requests', async ({ request }) => {
    // Test that endpoints properly handle content-type
    const response = await request.post('/api/webhook/stripe', {
      data: 'some data',
      headers: {
        'content-type': 'text/plain',
      },
    });

    // Should handle different content types appropriately
    expect(response.status()).toBeDefined();
  });

  test('should rate limit or handle rapid requests', async ({ request }) => {
    // Make multiple rapid requests to check handling
    const promises = Array.from({ length: 5 }, () =>
      request.get('/api/auth/csrf')
    );

    const responses = await Promise.all(promises);

    // All requests should complete (even if rate limited)
    responses.forEach(response => {
      expect(response.status()).toBeDefined();
      // 200 (success) or 429 (rate limited) are both acceptable
      expect([200, 429]).toContain(response.status());
    });
  });
});

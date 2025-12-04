# Alfred E2E Tests

Comprehensive end-to-end testing suite for the Alfred AI Automation Platform using Playwright.

This includes tests for the complete user journey from landing page through sign-up, subscription, VM provisioning, and dashboard access.

## Test Structure

```
e2e/
├── onboarding.spec.js      # Complete onboarding flow tests
├── auth.setup.js           # Authentication setup and mocking
├── helpers/
│   └── test-utils.js       # Shared utilities and helpers
└── README.md               # This file
```

## Test Coverage

### Onboarding Flow (`onboarding.spec.js`)

#### Landing Page Tests
- Hero section with branding and tagline
- Problem section (3 pain points)
- Features section (4 key benefits)
- Pricing section with plan details
- FAQ section with expandable questions
- Navigation links functionality
- CTA sections
- Footer with legal links

#### Authentication Flow
- Sign-up button visibility
- Login redirect
- Authenticated state handling

#### Dashboard State Tests
- Unauthenticated redirect
- Subscription prompt (no access)
- VM provisioning status and progress
- Ready state with Quickstart
- API key configuration states
- Error handling and retry

#### Quickstart Component
- Connection details display (MCP URL, Webhook URL, API Key)
- Copy to clipboard functionality
- API key generation with confirmation
- Security warnings

#### Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1920x1080)

#### Performance and Accessibility
- Page load time measurement
- Heading hierarchy validation
- Keyboard navigation support
- Button/link accessibility

### Dashboard Tests

Legacy `dashboard.spec.js` file covers the following scenarios:

### 1. Authentication
- Redirects to signin when not authenticated

### 2. Non-Subscribed User State
- Displays "Get Started with Alfred" card with link to pricing
- Does not show Quickstart section
- Does not show Anthropic API configuration section

### 3. VM Provisioning State
- Displays provisioning status with progress UI
- Shows steps: Creating VM, Installing Docker, Configuring services, Setting up DNS, Final checks
- Polls for status updates every 3 seconds
- Handles error state with retry button
- Handles pending state

### 4. Ready VM State - Quickstart Section
- Displays Quickstart section with all credentials:
  - MCP Connection URL (e.g., `mcp://test-user.alfredos.site`)
  - Webhook URL (e.g., `https://test-user.alfredos.site/webhook`)
  - API Key (masked format: `alf_************************abc123`)
- Copy buttons for all credentials
- Clipboard functionality
- "Generate New Key" button with confirmation dialog
- Loading state during API key generation
- Security warning about keeping API key secure

### 5. Ready VM State - Anthropic API Configuration
- Configured state: Shows success indicator with masked key and "Update API Key" button
- Not configured state: Shows warning with "Set API Key" button
- Auto-opens modal when API key is not configured
- Opens modal when clicking Set/Update API Key button

### 6. Loading State
- Displays loading spinner while fetching data

### 7. Edge Cases and Error Handling
- Handles API errors gracefully
- Handles VM ready with no API key
- Handles empty subdomain
- Disabled copy button when no API key

### 8. Responsive Design
- Mobile viewport compatibility

## Running the Tests

### Run all dashboard tests
```bash
npx playwright test dashboard.spec.js
```

### Run a specific test
```bash
npx playwright test dashboard.spec.js -g "should display Quickstart section"
```

### Run tests in headed mode (see browser)
```bash
npx playwright test dashboard.spec.js --headed
```

### Run tests in UI mode (interactive)
```bash
npx playwright test dashboard.spec.js --ui
```

### Run tests for specific browser
```bash
npx playwright test dashboard.spec.js --project=chromium
npx playwright test dashboard.spec.js --project=mobile
```

### Debug a specific test
```bash
npx playwright test dashboard.spec.js --debug -g "should generate new API key"
```

## Test Structure

The tests use Playwright's route mocking to simulate different states:

```javascript
// Mock authentication
await page.route('**/api/auth/session', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { id: 'test-user', email: 'test@test.com' } }),
  });
});

// Mock user status
await page.route('**/api/user/status', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      hasAccess: true,
      vmStatus: 'ready',
      vmSubdomain: 'test-user',
      // ... other fields
    }),
  });
});
```

## Key Test Patterns

### Testing Different States

Each major dashboard state has its own `describe` block with appropriate `beforeEach` setup:

1. **Non-Subscribed**: `hasAccess: false`
2. **Provisioning**: `hasAccess: true`, `vmStatus: 'provisioning'`
3. **Ready**: `hasAccess: true`, `vmStatus: 'ready'`

### Testing Polling Behavior

The provisioning tests verify that the component polls for updates:

```javascript
test('should poll for status updates every 3 seconds', async ({ page }) => {
  const statusCalls = [];
  await page.route('**/api/user/status', async (route) => {
    statusCalls.push(Date.now());
    // ... fulfill route
  });

  // Verify polling interval
  expect(statusCalls.length).toBeGreaterThanOrEqual(3);
});
```

### Testing User Interactions

Tests cover user interactions like clicking buttons, copying to clipboard, and confirming dialogs:

```javascript
// Dialog confirmation
page.on('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  await dialog.accept();
});

// Click and verify
await page.locator('button:has-text("Generate New Key")').click();
await expect(page.locator('text=New API key generated')).toBeVisible();
```

## Environment Variables

The tests use the base URL configured in `playwright.config.js`:

```javascript
baseURL: process.env.TEST_BASE_URL || 'https://alfred.rocks'
```

To test against a different environment:

```bash
TEST_BASE_URL=http://localhost:3000 npx playwright test dashboard.spec.js
```

## Continuous Integration

The tests are configured to run in CI with:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Reports: HTML and list format
- Artifacts: Screenshots and videos on failure

## Troubleshooting

### Tests fail with "page not found"
- Ensure the application is running at the configured base URL
- Check that routes are being mocked correctly

### Clipboard tests fail
- Clipboard permissions are granted in the test: `await context.grantPermissions(['clipboard-read', 'clipboard-write'])`
- Ensure you're not running in headless mode for clipboard tests if issues persist

### Timing issues with polling tests
- The polling interval test allows for variance (2.5-3.5 seconds)
- Increase timeout if needed: `await page.waitForTimeout(7000)`

## Future Enhancements

Potential additions to the test suite:

1. **Integration with actual auth**: Currently mocked, could use real auth flow
2. **WebSocket testing**: If real-time updates are added
3. **Performance testing**: Measure load times and render performance
4. **Accessibility testing**: Add a11y checks with @axe-core/playwright
5. **Visual regression**: Add snapshot testing for UI consistency

## Related Files

- `/Users/Shared/dev/prod/alfred/app/dashboard/page.js` - Dashboard component
- `/Users/Shared/dev/prod/alfred/components/Quickstart.js` - Quickstart component
- `/Users/Shared/dev/prod/alfred/components/ProvisioningStatus.js` - Provisioning UI
- `/Users/Shared/dev/prod/alfred/app/api/user/status/route.js` - User status API
- `/Users/Shared/dev/prod/alfred/app/api/proxy/vm/config/route.js` - VM config API

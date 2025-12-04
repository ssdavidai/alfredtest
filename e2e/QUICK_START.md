# Dashboard Tests - Quick Start Guide

## TL;DR - Run Tests Now

```bash
# Run all dashboard tests
npx playwright test dashboard.spec.js

# Run with UI (recommended for first time)
npx playwright test dashboard.spec.js --ui

# Run specific test
npx playwright test dashboard.spec.js -g "should display Quickstart"
```

## What Was Created

1. **dashboard.spec.js** - Main test file (24 tests, 48 executions)
2. **dashboard-simplified.spec.js** - Example using helpers (13 tests)
3. **helpers/dashboard-mocks.js** - Reusable mock functions
4. **README.md** - Complete documentation
5. **DASHBOARD_TESTS_SUMMARY.md** - Detailed implementation summary

## Test Coverage Map

```
Dashboard (/dashboard)
├── Authentication
│   └── Redirects to signin if not authenticated ✓
│
├── Non-Subscribed User (hasAccess: false)
│   ├── Shows "Get Started" card ✓
│   ├── Hides Quickstart section ✓
│   └── Hides Anthropic config section ✓
│
├── VM Provisioning (vmStatus: 'provisioning')
│   ├── Shows progress UI with steps ✓
│   ├── Polls every 3 seconds ✓
│   ├── Handles error state ✓
│   └── Handles pending state ✓
│
├── VM Ready (vmStatus: 'ready')
│   ├── Quickstart Section
│   │   ├── Displays MCP URL ✓
│   │   ├── Displays Webhook URL ✓
│   │   ├── Displays API Key ✓
│   │   ├── Copy to clipboard ✓
│   │   ├── Generate new key ✓
│   │   └── Loading states ✓
│   │
│   └── Anthropic API Config
│       ├── Shows configured state ✓
│       ├── Shows warning when not set ✓
│       ├── Auto-opens modal ✓
│       └── Manual modal open ✓
│
└── Edge Cases
    ├── API errors ✓
    ├── Missing API key ✓
    ├── Empty subdomain ✓
    └── Mobile responsive ✓
```

## Quick Examples

### Using Main Tests (dashboard.spec.js)

Tests are organized by state. Each test is self-contained with its own mocks:

```javascript
test('should display Quickstart section', async ({ page }) => {
  // Mock auth
  await page.route('**/api/auth/session', ...);

  // Mock ready state
  await page.route('**/api/user/status', ...);

  // Test
  await page.goto('/dashboard');
  await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();
});
```

### Using Helpers (dashboard-simplified.spec.js)

Much cleaner with helper functions:

```javascript
test('ready user sees full dashboard', async ({ page }) => {
  await setupReadyDashboard(page);
  await page.goto('/dashboard');

  await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();
});
```

## Common Commands

```bash
# Development
npx playwright test dashboard.spec.js --ui          # Interactive mode
npx playwright test dashboard.spec.js --headed      # See browser
npx playwright test dashboard.spec.js --debug       # Debug mode

# Running tests
npx playwright test dashboard.spec.js               # All tests
npx playwright test dashboard.spec.js --project=chromium  # Desktop only
npx playwright test dashboard.spec.js --project=mobile    # Mobile only

# Filtering
npx playwright test dashboard.spec.js -g "Quickstart"     # Match pattern
npx playwright test dashboard.spec.js -g "API key"        # Match pattern

# Reports
npx playwright show-report                          # View last report
```

## Test States Cheat Sheet

### Setup Functions (from helpers)

```javascript
// Non-subscribed user
await setupNonSubscribedDashboard(page);

// VM provisioning
await setupProvisioningDashboard(page, { status: 'provisioning' });

// VM ready
await setupReadyDashboard(page, {
  subdomain: 'test-user',
  hasApiKey: true,
  hasAnthropicKey: true,
});

// API key generation
await mockApiKeyGeneration(page, {
  apiKey: 'alf_new_key',
  delay: 1000,
  shouldFail: false,
});
```

## API Endpoints Reference

All endpoints that are mocked in tests:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/session` | GET | User authentication status |
| `/api/user/status` | GET | Subscription & VM status |
| `/api/proxy/vm/config` | GET | VM configuration |
| `/api/proxy/vm/config` | POST | Save Anthropic key |
| `/api/user/api-key` | POST | Generate new API key |

## User Status States

```javascript
// Non-subscribed
{
  hasAccess: false,
  vmStatus: null,
  vmSubdomain: null,
  // ...
}

// Provisioning
{
  hasAccess: true,
  vmStatus: 'provisioning', // or 'pending', 'error'
  vmSubdomain: null,
  // ...
}

// Ready
{
  hasAccess: true,
  vmStatus: 'ready',
  vmSubdomain: 'test-user',
  maskedApiKey: 'alf_************************abc123',
  // ...
}
```

## Debugging Tips

### Test fails with "element not found"
```bash
# Run in headed mode to see what's happening
npx playwright test dashboard.spec.js --headed -g "failing test"

# Or use debug mode for step-by-step
npx playwright test dashboard.spec.js --debug -g "failing test"
```

### Test times out
```bash
# Increase timeout in test
test('my test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Want to see what API calls are being made
```bash
# Enable verbose logging
DEBUG=pw:api npx playwright test dashboard.spec.js
```

### Check screenshots/videos
```bash
# After test failure, check:
# - test-results/ folder for screenshots
# - playwright-report/ for full report

npx playwright show-report
```

## File Locations

```
/Users/Shared/dev/prod/alfred/
├── e2e/
│   ├── dashboard.spec.js                    # Main tests
│   ├── dashboard-simplified.spec.js         # Simplified examples
│   ├── helpers/
│   │   └── dashboard-mocks.js               # Reusable mocks
│   ├── README.md                            # Full documentation
│   ├── DASHBOARD_TESTS_SUMMARY.md           # Detailed summary
│   └── QUICK_START.md                       # This file
│
├── app/dashboard/page.js                    # Dashboard component
├── components/
│   ├── Quickstart.js                        # Quickstart component
│   └── ProvisioningStatus.js                # Provisioning UI
│
└── playwright.config.js                     # Test configuration
```

## Next Steps

1. **Run the tests**: `npx playwright test dashboard.spec.js --ui`
2. **Read the README**: See `/Users/Shared/dev/prod/alfred/e2e/README.md`
3. **Check examples**: Look at `dashboard-simplified.spec.js`
4. **Use helpers**: Import from `helpers/dashboard-mocks.js`
5. **Add new tests**: Follow existing patterns

## Getting Help

- **Playwright Docs**: https://playwright.dev
- **Full README**: `e2e/README.md`
- **Implementation Details**: `e2e/DASHBOARD_TESTS_SUMMARY.md`
- **Helper Functions**: `e2e/helpers/dashboard-mocks.js`

## Pro Tips

1. **Use --ui mode** for developing new tests
2. **Keep mocks in helpers** for reusability
3. **Test user intent**, not implementation
4. **Run tests before commits**
5. **Check test output** for helpful error messages

## One-Liner for Quick Test

```bash
npx playwright test dashboard.spec.js --ui
```

That's it! You're ready to run and maintain dashboard E2E tests.

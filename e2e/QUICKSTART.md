# E2E Tests Quick Start Guide

Quick reference for running Alfred's E2E tests.

## Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test e2e/onboarding.spec.js
```

### Run tests matching a pattern
```bash
npx playwright test -g "Landing Page"
npx playwright test -g "Dashboard"
```

### Run in UI mode (recommended for development)
```bash
npx playwright test --ui
```

### Run in headed mode (see the browser)
```bash
npx playwright test --headed
```

### Run on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=mobile
```

### Debug a test
```bash
npx playwright test --debug
npx playwright test --debug -g "specific test name"
```

## View Results

### Show HTML report
```bash
npx playwright show-report
```

### Show trace (after failure)
```bash
npx playwright show-trace trace.zip
```

## Environment Configuration

Create `.env.local` for custom configuration:

```bash
# Test against local development
TEST_BASE_URL=http://localhost:3000

# Test against staging
TEST_BASE_URL=https://staging.alfred.rocks

# Test against production (default)
TEST_BASE_URL=https://alfred.rocks
```

## Common Test Scenarios

### Test landing page only
```bash
npx playwright test -g "Landing Page"
```

### Test dashboard states
```bash
npx playwright test -g "Dashboard States"
```

### Test authentication flow
```bash
npx playwright test -g "Authentication"
```

### Test responsive design
```bash
npx playwright test -g "Responsive"
```

### Test accessibility
```bash
npx playwright test -g "Accessibility"
```

## Test Structure

```
e2e/
├── onboarding.spec.js      # Complete user journey tests
│   ├── Landing Page tests
│   ├── Authentication tests
│   ├── Dashboard state tests
│   ├── Quickstart tests
│   ├── Responsive tests
│   └── Accessibility tests
│
├── auth.setup.js           # Authentication mocking utilities
│
└── helpers/
    └── test-utils.js       # Reusable test utilities
```

## Debugging Tips

### Use Playwright Inspector
```bash
npx playwright test --debug
```
- Step through tests
- Inspect page state
- View network requests
- Take screenshots

### Use console.log in tests
```javascript
test('my test', async ({ page }) => {
  const text = await page.textContent('h1');
  console.log('Heading text:', text);
});
```

### Take screenshots during test
```javascript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### Slow down test execution
```bash
npx playwright test --headed --slow-mo=1000
```

## Common Issues

### Test timeout
- Increase timeout in test: `test.setTimeout(60000)`
- Or in config: `timeout: 60000`

### Element not found
- Use Playwright Inspector: `npx playwright test --debug`
- Check selector: `await page.locator('selector').highlight()`
- Add explicit wait: `await expect(locator).toBeVisible()`

### Flaky tests
- Add proper waits instead of `waitForTimeout`
- Use `waitForLoadState('networkidle')`
- Ensure test isolation with `beforeEach`

## CI/CD

Tests run automatically in CI with:
- 2 retries on failure
- Single worker (sequential)
- Screenshots on failure
- Video on retry
- HTML report artifact

## Need Help?

1. Check the full [README.md](./README.md)
2. View [Playwright Documentation](https://playwright.dev/)
3. Open an issue in the repository

#!/bin/bash
# Quick script to run onboarding tests

echo "=========================================="
echo "  Alfred E2E Onboarding Tests"
echo "=========================================="
echo ""

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js"
    exit 1
fi

# Default to all onboarding tests
TEST_PATTERN="${1:-onboarding}"

echo "Running tests matching: $TEST_PATTERN"
echo ""

# Run tests
npx playwright test --grep "$TEST_PATTERN" "$@"

echo ""
echo "=========================================="
echo "  Test run complete!"
echo "=========================================="
echo ""
echo "To view report: npx playwright show-report"
echo ""

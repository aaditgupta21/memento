# End-to-End Tests

This directory contains end-to-end (E2E) tests for the application using Playwright.

## Test Files

1. **auth-flow.spec.js** - Tests the complete user authentication flow:

   - User signup
   - User login
   - Error handling for invalid credentials
   - Error handling for duplicate email signup

2. **post-creation-flow.spec.js** - Tests the post creation and viewing flow:
   - Creating a post via API
   - Viewing posts in the feed
   - Viewing posts in user gallery
   - Verifying post metadata

## Running Tests

### Prerequisites

Make sure both the server and client are running, or use the webServer configuration in `playwright.config.js` which will start them automatically.

### Run all tests

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### View test report

```bash
npm run test:e2e:report
```

## Test Configuration

Tests are configured in `playwright.config.js` at the root of the project. The configuration:

- Runs tests in Chromium by default
- Automatically starts the server (port 4000) and client (port 3000) before tests
- Takes screenshots on failure
- Generates HTML reports

## Writing New Tests

When writing new E2E tests:

1. Create a new `.spec.js` file in the `e2e/` directory
2. Use descriptive test names
3. Clean up test data (users, posts, etc.) if needed
4. Use unique identifiers (timestamps) to avoid conflicts between test runs

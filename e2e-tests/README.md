# NutriStats E2E Tests

This directory contains end-to-end tests for the NutriStats application using Playwright.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### Smoke Tests (Infrastructure Validation)
```bash
# Run smoke tests to validate our authentication infrastructure
npm run test:smoke

# View the generated HTML report
npm run test:report
```

### Basic Test Execution
```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with UI mode for debugging
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

### Test Reports
```bash
# View HTML test report
npm run test:report
```

## Project Structure

- `tests/` - Test files organized by feature
- `pages/` - Page Object Model classes
- `fixtures/` - Test fixtures and data
- `utils/` - Utility functions and helpers
- `data/` - Test data files
- `reports/` - Test reports output

## Configuration

- `playwright.config.js` - Playwright configuration
- `.env.test` - Test environment variables
- `package.json` - Project dependencies and scripts

## Current Test Coverage

### ✅ Implemented and Tested
- **Authentication Infrastructure**: Fixtures, LoginPage, RegistrationPage classes
- **Base Classes**: BasePage, BaseComponent with common functionality  
- **Utilities**: API helpers, data generators, storage management
- **Form Validation**: Login/registration form validation and error handling
- **Browser Context Management**: Clean contexts, authenticated contexts
- **Test Data Generation**: User data generation and cleanup

### 🧪 Smoke Test Suite (`auth.smoke.test.js`)
- Login page loading and form switching
- Registration form validation (password mismatch, weak passwords, invalid emails)
- Authentication fixtures (test user creation, authenticated contexts)
- API helpers functionality
- Storage management (localStorage/sessionStorage)
- Data generators validation
- Full authentication flow integration test

### 📊 Reports Generated
- **HTML Report**: Detailed test results with screenshots
- **JSON Report**: Machine-readable test results
- **Screenshots**: Captured at key test points and failures
- **Videos**: Recorded for failed tests (if enabled)

## Environment Variables

Copy `.env.test` to `.env.local` and modify as needed for your local environment.
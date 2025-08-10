#!/usr/bin/env node

/**
 * Smoke test runner script
 * Runs our authentication infrastructure tests and generates reports
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting NutriStats E2E Smoke Tests...\n');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

try {
  console.log('📋 Running smoke tests...');
  
  // Run only our smoke test file
  const testCommand = 'npx playwright test auth.smoke.test.js --reporter=html,json,list';
  
  console.log(`Executing: ${testCommand}\n`);
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('\n✅ Tests completed successfully!');
  console.log('\n📊 Reports generated:');
  console.log(`   - HTML Report: ${path.join(reportsDir, 'html-report', 'index.html')}`);
  console.log(`   - JSON Report: ${path.join(reportsDir, 'test-results.json')}`);
  console.log(`   - Screenshots: ${screenshotsDir}`);
  
  console.log('\n🌐 To view the HTML report, run:');
  console.log('   npm run test:report');
  
} catch (error) {
  console.error('\n❌ Tests failed or encountered errors:');
  console.error(error.message);
  
  console.log('\n📊 Reports may still be available:');
  console.log(`   - HTML Report: ${path.join(reportsDir, 'html-report', 'index.html')}`);
  console.log(`   - Screenshots: ${screenshotsDir}`);
  
  console.log('\n🌐 To view the HTML report (even with failures), run:');
  console.log('   npm run test:report');
  
  process.exit(1);
}
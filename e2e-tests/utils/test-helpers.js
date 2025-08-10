/**
 * Common test utilities and helper functions
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 */
async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await wait(delay);
      }
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Generate unique test identifier
 * @param {string} prefix - Prefix for the identifier
 */
function generateTestId(prefix = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Format date for API requests
 * @param {Date} date - Date to format
 */
function formatDateForApi(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for testing
 * @param {number} daysBack - Number of days back from today
 */
function getDateRange(daysBack = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate)
  };
}

/**
 * Parse nutrition values from text
 * @param {string} text - Text containing nutrition values
 */
function parseNutritionFromText(text) {
  const patterns = {
    calories: /(\d+(?:\.\d+)?)\s*(?:cal|kcal|calories?)/i,
    protein: /(\d+(?:\.\d+)?)\s*g?\s*protein/i,
    carbs: /(\d+(?:\.\d+)?)\s*g?\s*(?:carb|carbohydrate)s?/i,
    fat: /(\d+(?:\.\d+)?)\s*g?\s*fat/i,
    fiber: /(\d+(?:\.\d+)?)\s*g?\s*fiber/i,
    sugar: /(\d+(?:\.\d+)?)\s*g?\s*sugar/i,
    sodium: /(\d+(?:\.\d+)?)\s*(?:mg|g)?\s*sodium/i
  };
  
  const nutrition = {};
  
  for (const [nutrient, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      nutrition[nutrient] = parseFloat(match[1]);
    }
  }
  
  return nutrition;
}

/**
 * Calculate nutrition totals from food items
 * @param {Array} foods - Array of food items with nutrition data
 */
function calculateNutritionTotals(foods) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };
  
  foods.forEach(food => {
    const amount = food.amount || 1;
    const servingSize = food.servingSize || 100;
    const multiplier = amount / servingSize;
    
    Object.keys(totals).forEach(nutrient => {
      if (food[nutrient]) {
        totals[nutrient] += food[nutrient] * multiplier;
      }
    });
  });
  
  // Round to 1 decimal place
  Object.keys(totals).forEach(key => {
    totals[key] = Math.round(totals[key] * 10) / 10;
  });
  
  return totals;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 */
function validatePasswordStrength(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req);
  
  return {
    isValid,
    requirements
  };
}

/**
 * Clean up test files and directories
 * @param {Array} paths - Paths to clean up
 */
async function cleanupTestFiles(paths) {
  for (const filePath of paths) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
      
      console.log(`Cleaned up: ${fullPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Failed to cleanup ${filePath}:`, error.message);
      }
    }
  }
}

/**
 * Save test data to file
 * @param {Object} data - Data to save
 * @param {string} filename - Filename to save to
 */
async function saveTestData(data, filename) {
  const filePath = path.join('e2e-tests', 'data', filename);
  const dirPath = path.dirname(filePath);
  
  try {
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Test data saved to: ${filePath}`);
  } catch (error) {
    console.error(`Failed to save test data to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load test data from file
 * @param {string} filename - Filename to load from
 */
async function loadTestData(filename) {
  const filePath = path.join('e2e-tests', 'data', filename);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load test data from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Take screenshot with timestamp and context
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 * @param {string} context - Test context
 */
async function takeContextualScreenshot(page, name, context = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const contextSuffix = context ? `-${context}` : '';
  const filename = `${name}${contextSuffix}-${timestamp}.png`;
  const filePath = path.join('e2e-tests', 'screenshots', filename);
  
  try {
    // Check if page is still open
    if (page.isClosed()) {
      console.warn(`Page is closed, skipping screenshot: ${filename}`);
      return filename;
    }
    
    await page.screenshot({ 
      path: filePath, 
      fullPage: true 
    });
    console.log(`Screenshot saved: ${filePath}`);
    return filename;
  } catch (error) {
    console.error(`Failed to take screenshot:`, error);
    // Don't throw error for screenshot failures, just log it
    return filename;
  }
}

/**
 * Get browser and device info
 * @param {Page} page - Playwright page object
 */
async function getBrowserInfo(page) {
  return await page.evaluate(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      }
    };
  });
}

/**
 * Monitor network requests
 * @param {Page} page - Playwright page object
 * @param {Object} options - Monitoring options
 */
async function monitorNetworkRequests(page, options = {}) {
  const {
    logRequests = false,
    logResponses = false,
    filterUrls = null,
    onRequest = null,
    onResponse = null
  } = options;
  
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (!filterUrls || filterUrls.some(url => request.url().includes(url))) {
      const requestData = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now()
      };
      
      requests.push(requestData);
      
      if (logRequests) {
        console.log(`Request: ${request.method()} ${request.url()}`);
      }
      
      if (onRequest) {
        onRequest(requestData);
      }
    }
  });
  
  page.on('response', response => {
    if (!filterUrls || filterUrls.some(url => response.url().includes(url))) {
      const responseData = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: Date.now()
      };
      
      responses.push(responseData);
      
      if (logResponses) {
        console.log(`Response: ${response.status()} ${response.url()}`);
      }
      
      if (onResponse) {
        onResponse(responseData);
      }
    }
  });
  
  return {
    getRequests: () => requests,
    getResponses: () => responses,
    clearHistory: () => {
      requests.length = 0;
      responses.length = 0;
    }
  };
}

/**
 * Wait for network idle (no requests for specified time)
 * @param {Page} page - Playwright page object
 * @param {number} idleTime - Idle time in milliseconds
 * @param {number} timeout - Maximum wait time
 */
async function waitForNetworkIdle(page, idleTime = 500, timeout = 30000) {
  let requestCount = 0;
  let lastRequestTime = Date.now();
  
  const requestHandler = () => {
    requestCount++;
    lastRequestTime = Date.now();
  };
  
  const responseHandler = () => {
    requestCount--;
  };
  
  page.on('request', requestHandler);
  page.on('response', responseHandler);
  
  try {
    await page.waitForFunction(
      ({ idleTime, startTime }) => {
        const now = Date.now();
        return (now - window.lastRequestTime) >= idleTime && window.requestCount === 0;
      },
      { idleTime, startTime: Date.now() },
      { timeout }
    );
  } finally {
    page.off('request', requestHandler);
    page.off('response', responseHandler);
  }
}

/**
 * Simulate slow network conditions
 * @param {Page} page - Playwright page object
 * @param {Object} conditions - Network conditions
 */
async function simulateNetworkConditions(page, conditions = {}) {
  const {
    offline = false,
    downloadThroughput = 1000000, // 1 Mbps
    uploadThroughput = 1000000,   // 1 Mbps
    latency = 100                 // 100ms
  } = conditions;
  
  const client = await page.context().newCDPSession(page);
  
  await client.send('Network.emulateNetworkConditions', {
    offline,
    downloadThroughput,
    uploadThroughput,
    latency
  });
}

/**
 * Get console logs from page
 * @param {Page} page - Playwright page object
 * @param {Array} logTypes - Types of logs to capture
 */
function captureConsoleLogs(page, logTypes = ['log', 'warn', 'error']) {
  const logs = [];
  
  page.on('console', msg => {
    if (logTypes.includes(msg.type())) {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      });
    }
  });
  
  return {
    getLogs: () => logs,
    clearLogs: () => logs.length = 0,
    getLogsByType: (type) => logs.filter(log => log.type === type)
  };
}

/**
 * Mock API responses
 * @param {Page} page - Playwright page object
 * @param {Object} mocks - API mocks configuration
 */
async function mockApiResponses(page, mocks) {
  await page.route('**/*', route => {
    const url = route.request().url();
    const method = route.request().method();
    
    for (const mock of mocks) {
      if (mock.url.test(url) && (!mock.method || mock.method === method)) {
        return route.fulfill({
          status: mock.status || 200,
          contentType: mock.contentType || 'application/json',
          body: JSON.stringify(mock.response)
        });
      }
    }
    
    route.continue();
  });
}

module.exports = {
  wait,
  retryWithBackoff,
  generateTestId,
  formatDateForApi,
  getDateRange,
  parseNutritionFromText,
  calculateNutritionTotals,
  isValidEmail,
  validatePasswordStrength,
  cleanupTestFiles,
  saveTestData,
  loadTestData,
  takeContextualScreenshot,
  getBrowserInfo,
  monitorNetworkRequests,
  waitForNetworkIdle,
  simulateNetworkConditions,
  captureConsoleLogs,
  mockApiResponses
};
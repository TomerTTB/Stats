// Example configuration for your main Stats application
// Add this to your server.js or database configuration file

const path = require('path');
const fs = require('fs');

// Database path logic
function getDatabasePath() {
  const testDbPath = path.join(__dirname, 'e2e-tests', 'data', 'test-nutrition_app.db');
  const prodDbPath = path.join(__dirname, 'src', 'data', 'nutrition_app.db');
  
  // If test database exists, use it (tests are running)
  if (fs.existsSync(testDbPath)) {
    console.log('🧪 Using test database:', testDbPath);
    return testDbPath;
  }
  
  // Otherwise use production database
  console.log('🚀 Using production database:', prodDbPath);
  return prodDbPath;
}

// Use this in your database connection
const dbPath = getDatabasePath();

module.exports = { dbPath };
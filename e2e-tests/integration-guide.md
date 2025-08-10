# Integration Guide for Stats Application

## Step 1: Update Your Database Configuration

Add this code to your main Stats application (in `server.js` or your database configuration file):

```javascript
const path = require('path');
const fs = require('fs');

// Database path detection for testing
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
```

## Step 2: Replace Your Current Database Path

Find where you currently define your database path (probably something like):
```javascript
const dbPath = './src/data/nutrition_app.db';
```

Replace it with:
```javascript
const dbPath = getDatabasePath();
```

## Step 3: Test the Integration

1. Start your Stats application normally:
   ```bash
   npm start
   ```
   You should see: "🚀 Using production database: ..."

2. Create a test database and start again:
   ```bash
   cd e2e-tests
   npm run verify
   # Leave the test database in place, then restart your app
   cd ..
   npm start
   ```
   You should see: "🧪 Using test database: ..."

## Example Integration

If your current server.js looks like this:
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/data/nutrition_app.db');
```

Change it to:
```javascript
const sqlite3 = require('sqlite3').verbose();

// Add the database path detection function here
function getDatabasePath() {
  const path = require('path');
  const fs = require('fs');
  
  const testDbPath = path.join(__dirname, 'e2e-tests', 'data', 'test-nutrition_app.db');
  const prodDbPath = path.join(__dirname, 'src', 'data', 'nutrition_app.db');
  
  if (fs.existsSync(testDbPath)) {
    console.log('🧪 Using test database:', testDbPath);
    return testDbPath;
  }
  
  console.log('🚀 Using production database:', prodDbPath);
  return prodDbPath;
}

const dbPath = getDatabasePath();
const db = new sqlite3.Database(dbPath);
```
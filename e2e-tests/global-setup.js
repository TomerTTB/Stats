/**
 * Global test setup - runs once before all tests
 */

const DatabaseManager = require('./utils/database-manager');

async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  const dbManager = new DatabaseManager();
  
  try {
    // Create database backup before tests
    const backupPath = await dbManager.setupTestDatabase();
    
    // Store backup path for global teardown
    process.env.TEST_BACKUP_PATH = backupPath;
    
    console.log('✅ Global test setup complete');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

module.exports = globalSetup;
#!/usr/bin/env node

const DatabaseMigrator = require('../src/database/migrate');

async function runMigration() {
  const migrator = new DatabaseMigrator();
  
  try {
    await migrator.runMigration();
    console.log('\n✅ Database migration completed successfully!');
    console.log('Your JSON data has been migrated to PostgreSQL.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    console.log('🚀 Initializing database schema only...');
    new DatabaseMigrator().initializeDatabase()
      .then(() => {
        console.log('✅ Database schema initialized!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Schema initialization failed:', error.message);
        process.exit(1);
      });
    break;
    
  case 'foods':
    console.log('🍎 Migrating foods only...');
    new DatabaseMigrator().migrateFoods()
      .then(() => {
        console.log('✅ Foods migrated!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Foods migration failed:', error.message);
        process.exit(1);
      });
    break;
    
  case 'users':
    console.log('👥 Migrating users only...');
    new DatabaseMigrator().migrateUsers()
      .then(() => {
        console.log('✅ Users migrated!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Users migration failed:', error.message);
        process.exit(1);
      });
    break;
    
  default:
    console.log('🔄 Running full migration...');
    runMigration();
}
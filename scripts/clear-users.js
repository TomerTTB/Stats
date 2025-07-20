// Script to clear all users from the database
const { query, isDatabaseAvailable } = require('../src/database/connection');

async function waitForDatabase() {
    // Wait for database to be available
    let attempts = 0;
    while (!isDatabaseAvailable() && attempts < 10) {
        console.log('Waiting for database connection...');
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    return isDatabaseAvailable();
}

async function clearUsers() {
    console.log('🗑️  Clearing all users from database...\n');

    try {
        // Wait for database to be ready
        const dbReady = await waitForDatabase();
        if (!dbReady) {
            console.log('❌ Database not available after waiting');
            return;
        }

        console.log('✅ Database connected, proceeding with cleanup...\n');

        // Delete all users and related data
        console.log('Deleting user weight entries...');
        await query('DELETE FROM user_weight');
        
        console.log('Deleting user meals...');
        await query('DELETE FROM user_meals');
        
        console.log('Deleting user settings...');
        await query('DELETE FROM user_settings');
        
        console.log('Deleting users...');
        await query('DELETE FROM users');
        
        console.log('✅ All users and related data cleared successfully!');
        console.log('📊 Database is now clean and ready for new registrations.\n');

        // Verify the cleanup
        const userCount = await query('SELECT COUNT(*) as count FROM users');
        console.log(`Remaining users: ${userCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error clearing users:', error.message);
    }

    process.exit(0);
}

// Run the cleanup
clearUsers();
const { testConnection, initializeDatabase } = require('./src/database/init');

async function testDatabase() {
    console.log('Testing database connection...');
    
    try {
        const connected = await testConnection();
        console.log('Connection test result:', connected);
        
        if (connected) {
            console.log('Initializing database...');
            await initializeDatabase();
            console.log('Database initialization completed');
        } else {
            console.log('Database connection failed');
        }
    } catch (error) {
        console.error('Database test error:', error);
    }
    
    console.log('Test completed');
    process.exit(0);
}

testDatabase(); 
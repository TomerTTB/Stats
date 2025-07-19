const { query, isDatabaseAvailable, dbPath } = require('./connection');
require('dotenv').config();

// Test database connection
async function testConnection() {
    try {
        if (!isDatabaseAvailable()) {
            console.log('⚠️  Database not available, using JSON fallback');
            return false;
        }

        await query('SELECT 1');
        console.log('✅ SQLite database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ SQLite connection test failed:', error.message);
        console.log('⚠️  Falling back to JSON files');
        return false;
    }
}

// Initialize database schema
async function initializeDatabase() {
    try {
        if (!isDatabaseAvailable()) {
            console.log('⚠️  Database not available, skipping schema initialization');
            return false;
        }

        // Create foods table (shared across all users)
        await query(`
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item TEXT NOT NULL,
                amount TEXT,
                calories REAL,
                carbs REAL,
                protein REAL,
                protein_general REAL,
                fat REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create user_meals table (user-specific meals)
        await query(`
            CREATE TABLE IF NOT EXISTS user_meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                day TEXT NOT NULL,
                meal_time TEXT NOT NULL,
                food_item TEXT NOT NULL,
                amount REAL,
                calories REAL,
                carbs REAL,
                protein REAL,
                protein_general REAL,
                fat REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Create user_settings table (user-specific settings)
        await query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT PRIMARY KEY,
                goal_calories INTEGER,
                protein_level REAL DEFAULT 1.9,
                fat_level REAL DEFAULT 0.8,
                height INTEGER,
                weight REAL,
                age INTEGER,
                sex TEXT DEFAULT 'male',
                activity_level TEXT DEFAULT '1.55',
                calorie_adjustment INTEGER DEFAULT 0,
                meal_interval REAL DEFAULT 3.0,
                bmr REAL DEFAULT 0,
                unit_system TEXT DEFAULT 'metric',
                weight_unit TEXT DEFAULT 'kg',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Create user_weight table (user-specific weight tracking)
        await query(`
            CREATE TABLE IF NOT EXISTS user_weight (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                weight REAL NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Create indexes for better performance
        await query(`
            CREATE INDEX IF NOT EXISTS idx_foods_item 
            ON foods(item)
        `);

        await query(`
            CREATE INDEX IF NOT EXISTS idx_user_meals_user_day 
            ON user_meals(user_id, day)
        `);

        await query(`
            CREATE INDEX IF NOT EXISTS idx_user_weight_user_date 
            ON user_weight(user_id, date)
        `);

        console.log('✅ SQLite database schema initialized successfully');
        console.log(`📁 Database location: ${dbPath}`);
        return true;
    } catch (error) {
        console.error('❌ SQLite schema initialization failed:', error.message);
        console.log('⚠️  Will use JSON files as fallback');
        return false;
    }
}

module.exports = {
    testConnection,
    initializeDatabase
};
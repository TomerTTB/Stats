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
                meal_id INTEGER,
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

        // Add meal_id column to existing user_meals table if it doesn't exist
        try {
            await query(`
                ALTER TABLE user_meals 
                ADD COLUMN meal_id INTEGER
            `);
            console.log('✅ Added meal_id column to user_meals table');
            
            // Migrate existing data to populate meal_id
            await migrateExistingMealData();
        } catch (error) {
            // Column might already exist, which is fine
            console.log('ℹ️  meal_id column already exists or not needed');
        }

        console.log('✅ SQLite database schema initialized successfully');
        console.log(`📁 Database location: ${dbPath}`);
        return true;
    } catch (error) {
        console.error('❌ SQLite schema initialization failed:', error.message);
        console.log('⚠️  Will use JSON files as fallback');
        return false;
    }
}

// Migrate existing meal data to populate meal_id column
async function migrateExistingMealData() {
    try {
        const { query } = require('./connection');
        
        // Get all meals without meal_id
        const result = await query(`
            SELECT * FROM user_meals 
            WHERE meal_id IS NULL
            ORDER BY user_id, day, meal_time
        `);
        
        if (result.rows.length === 0) {
            console.log('ℹ️  No existing meal data to migrate');
            return;
        }
        
        console.log(`🔄 Migrating ${result.rows.length} meal entries...`);
        
        const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
        
        for (const row of result.rows) {
            // Determine meal_id based on time proximity to default times
            let closestMealId = 1;
            let minDifference = Infinity;
            
            for (let i = 0; i < defaultTimes.length; i++) {
                const defaultTime = defaultTimes[i];
                const timeDiff = Math.abs(
                    (parseInt(row.meal_time.split(':')[0]) * 60 + parseInt(row.meal_time.split(':')[1])) -
                    (parseInt(defaultTime.split(':')[0]) * 60 + parseInt(defaultTime.split(':')[1]))
                );
                
                if (timeDiff < minDifference) {
                    minDifference = timeDiff;
                    closestMealId = i + 1;
                }
            }
            
            // Update the row with the determined meal_id
            await query(`
                UPDATE user_meals 
                SET meal_id = ?
                WHERE id = ?
            `, [closestMealId, row.id]);
        }
        
        console.log('✅ Meal data migration completed');
    } catch (error) {
        console.error('❌ Meal data migration failed:', error.message);
    }
}

module.exports = {
    testConnection,
    initializeDatabase
};
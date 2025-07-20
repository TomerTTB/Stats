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
                height INTEGER,
                weight REAL,
                age INTEGER,
                sex TEXT,
                activity_level TEXT,
                meal_interval REAL,
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

        // Create user_daily_macros table (user-specific daily macro settings)
        await query(`
            CREATE TABLE IF NOT EXISTS user_daily_macros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                day TEXT NOT NULL,
                protein_level REAL,
                fat_level REAL,
                calorie_adjustment INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, day)
            )
        `);

        // Migration: Clear default macro values for new users (set to NULL if they were default values)
        const clearMacroDefaultsMigrationName = 'clear_macro_defaults';
        if (!(await isMigrationCompleted(clearMacroDefaultsMigrationName))) {
            try {
                const result = await query(`
                    UPDATE user_daily_macros 
                    SET protein_level = NULL, fat_level = NULL 
                    WHERE protein_level = 1.9 AND fat_level = 0.8
                `);
                console.log('✅ Migration: Cleared default macro values for new users');
                await markMigrationCompleted(clearMacroDefaultsMigrationName);
            } catch (error) {
                console.log('Migration note: Default macro values already cleared or table empty');
                await markMigrationCompleted(clearMacroDefaultsMigrationName);
            }
        }

        // Migration: Clear default settings values for new users
        const clearSettingsDefaultsMigrationName = 'clear_settings_defaults';
        if (!(await isMigrationCompleted(clearSettingsDefaultsMigrationName))) {
            try {
                const result = await query(`
                    UPDATE user_settings 
                    SET sex = NULL, age = NULL, weight = NULL, height = NULL, 
                        activity_level = NULL, meal_interval = NULL 
                    WHERE sex = 'male' AND age = 30 AND weight = 70 AND height = 170 
                        AND activity_level = '1.55' AND meal_interval = 3.0
                `);
                console.log('✅ Migration: Cleared default settings values for new users');
                await markMigrationCompleted(clearSettingsDefaultsMigrationName);
            } catch (error) {
                console.log('Migration note: Default settings values already cleared or table empty');
                await markMigrationCompleted(clearSettingsDefaultsMigrationName);
            }
        }

        // Create migrations table to track completed migrations
        await query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_name TEXT UNIQUE NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

        await query(`
            CREATE INDEX IF NOT EXISTS idx_user_daily_macros_user_day 
            ON user_daily_macros(user_id, day)
        `);

        // Track if any migrations were performed
        let migrationsPerformed = [];

        // Check if meal_id column migration is needed
        const mealIdMigrationName = 'add_meal_id_column';
        if (!(await isMigrationCompleted(mealIdMigrationName))) {
            try {
                const columnCheck = await query(`
                    PRAGMA table_info(user_meals)
                `);
                const hasMealId = columnCheck.rows.some(col => col.name === 'meal_id');
                
                if (!hasMealId) {
                    await query(`
                        ALTER TABLE user_meals 
                        ADD COLUMN meal_id INTEGER
                    `);
                    console.log('✅ Added meal_id column to user_meals table');
                    migrationsPerformed.push('meal_id column added');
                    
                    // Migrate existing data to populate meal_id
                    await migrateExistingMealData();
                }
                
                await markMigrationCompleted(mealIdMigrationName);
            } catch (error) {
                console.log('ℹ️  meal_id column check completed');
            }
        }

        // Check and remove old macro columns from user_settings table if needed
        const removeColumnsMigrationName = 'remove_old_macro_columns';
        if (!(await isMigrationCompleted(removeColumnsMigrationName))) {
            try {
                const columnCheck = await query(`
                    PRAGMA table_info(user_settings)
                `);
                const hasProteinLevel = columnCheck.rows.some(col => col.name === 'protein_level');
                const hasFatLevel = columnCheck.rows.some(col => col.name === 'fat_level');
                const hasCalorieAdjustment = columnCheck.rows.some(col => col.name === 'calorie_adjustment');
                
                if (hasProteinLevel) {
                    console.log('🔄 Removing protein_level column from user_settings table...');
                    await removeColumnFromTable('user_settings', 'protein_level');
                    migrationsPerformed.push('protein_level column removed');
                }
                
                if (hasFatLevel) {
                    console.log('🔄 Removing fat_level column from user_settings table...');
                    await removeColumnFromTable('user_settings', 'fat_level');
                    migrationsPerformed.push('fat_level column removed');
                }
                
                if (hasCalorieAdjustment) {
                    console.log('🔄 Removing calorie_adjustment column from user_settings table...');
                    await removeColumnFromTable('user_settings', 'calorie_adjustment');
                    migrationsPerformed.push('calorie_adjustment column removed');
                }
                
                await markMigrationCompleted(removeColumnsMigrationName);
            } catch (error) {
                console.log('ℹ️  user_settings columns check completed');
            }
        }

        console.log('✅ SQLite database schema initialized successfully');
        
        // Only show migration summary if migrations were actually performed
        if (migrationsPerformed.length > 0) {
            console.log('📋 Migration summary:');
            migrationsPerformed.forEach(migration => {
                console.log(`   - ${migration}`);
            });
        }
        
        console.log(`📁 Database location: ${dbPath}`);
        return true;
    } catch (error) {
        console.error('❌ SQLite schema initialization failed:', error.message);
        console.log('⚠️  Will use JSON files as fallback');
        return false;
    }
}

// Check if a migration has been completed
async function isMigrationCompleted(migrationName) {
    try {
        const { query } = require('./connection');
        const result = await query(`
            SELECT COUNT(*) as count FROM migrations 
            WHERE migration_name = ?
        `, [migrationName]);
        return result.rows[0].count > 0;
    } catch (error) {
        return false; // If migrations table doesn't exist, assume not completed
    }
}

// Mark a migration as completed
async function markMigrationCompleted(migrationName) {
    try {
        const { query } = require('./connection');
        await query(`
            INSERT INTO migrations (migration_name) 
            VALUES (?)
        `, [migrationName]);
    } catch (error) {
        console.log(`⚠️  Could not mark migration ${migrationName} as completed:`, error.message);
    }
}

// Remove a column from a table (SQLite workaround since it doesn't support DROP COLUMN)
async function removeColumnFromTable(tableName, columnName) {
    try {
        const { query } = require('./connection');
        
        // Get table schema
        const schemaResult = await query(`PRAGMA table_info(${tableName})`);
        const columns = schemaResult.rows.filter(col => col.name !== columnName);
        
        if (columns.length === schemaResult.rows.length) {
            console.log(`ℹ️  Column ${columnName} not found in ${tableName}`);
            return;
        }
        
        // Create new table without the column
        const columnDefs = columns.map(col => {
            let def = `${col.name} ${col.type}`;
            if (col.notnull) def += ' NOT NULL';
            if (col.pk) def += ' PRIMARY KEY';
            if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
            return def;
        }).join(', ');
        
        // Create new table
        await query(`CREATE TABLE ${tableName}_new (${columnDefs})`);
        
        // Copy data to new table
        const columnNames = columns.map(col => col.name).join(', ');
        await query(`INSERT INTO ${tableName}_new (${columnNames}) SELECT ${columnNames} FROM ${tableName}`);
        
        // Drop old table and rename new table
        await query(`DROP TABLE ${tableName}`);
        await query(`ALTER TABLE ${tableName}_new RENAME TO ${tableName}`);
        
        console.log(`✅ Successfully removed column ${columnName} from ${tableName}`);
    } catch (error) {
        console.error(`❌ Error removing column ${columnName} from ${tableName}:`, error.message);
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
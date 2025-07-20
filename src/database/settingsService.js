const { query, isDatabaseAvailable } = require('./connection');

class SettingsService {
    constructor() {
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        if (isDatabaseAvailable()) {
            console.log('⚙️  Settings service using SQLite database');
        } else {
            console.log('🚫 Settings database not available');
        }
    }

    // Get user settings
    async getUserSettings(userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return this.getDefaultSettings();
        }

        try {
            const result = await query('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
            if (result.rows.length > 0) {
                const settings = result.rows[0];
                return {
                    userName: '', // Will be populated from user session
                    unitSystem: settings.unit_system || 'metric',
                    sex: settings.sex || '',
                    age: settings.age || '',
                    weight: settings.weight || '',
                    height: settings.height || '',
                    activityLevel: settings.activity_level || '1.2',

                    mealInterval: settings.meal_interval || '',
                    totalCalories: settings.goal_calories || 0,
                    weeklyCalories: (settings.goal_calories || 0) * 7
                };
            } else {
                // No settings found, return default (will be created on first save)
                return this.getDefaultSettings();
            }
        } catch (error) {
            console.error('❌ Database error getting settings:', error.message);
            return this.getDefaultSettings();
        }
    }

    // Save user settings
    async saveUserSettings(userId, settings) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Check if settings exist
            const existing = await query('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);

            if (existing.rows.length > 0) {
                // Update existing settings
                await query(`
                    UPDATE user_settings 
                    SET goal_calories = ?, height = ?, weight = ?, age = ?, sex = ?,
                        activity_level = ?, meal_interval = ?, 
                        unit_system = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                `, [
                    settings.totalCalories || 0,
                    settings.height,
                    settings.weight,
                    settings.age,
                    settings.sex,
                    settings.activityLevel,
                    settings.mealInterval,
                    settings.unitSystem || 'metric',
                    userId
                ]);
            } else {
                // Insert new settings
                await query(`
                    INSERT INTO user_settings 
                    (user_id, goal_calories, height, weight, age, sex, 
                     activity_level, meal_interval, unit_system)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    settings.totalCalories || 0,
                    settings.height,
                    settings.weight,
                    settings.age,
                    settings.sex,
                    settings.activityLevel,
                    settings.mealInterval,
                    settings.unitSystem || 'metric'
                ]);
            }

            console.log('✅ Settings saved to database for user:', userId);
            return true;
        } catch (error) {
            console.error('❌ Database error saving settings:', error.message);
            return false;
        }
    }

    // Get default settings structure (empty for new users)
    getDefaultSettings() {
        return {
            userName: '',
            unitSystem: 'metric',
            sex: '', // Empty for new users
            age: '', // Empty for new users
            weight: '', // Empty for new users
            height: '', // Empty for new users
            activityLevel: '1.2', // First option (Sedentary) for new users

            mealInterval: '', // Empty for new users
            totalCalories: 0,
            weeklyCalories: 0
        };
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new SettingsService();
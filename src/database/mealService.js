const { query, isDatabaseAvailable } = require('./connection');
const settingsService = require('./settingsService');

class MealService {
    constructor() {
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        if (isDatabaseAvailable()) {
            console.log('🍽️  Meal service using SQLite database');
        } else {
            console.log('🚫 Meal database not available');
        }
    }

    // Get meals for a specific day and user
    async getUserDayMeals(userId, dayName) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return this.getDefaultDayMeals();
        }

        try {
            const result = await query(`
                SELECT * FROM user_meals 
                WHERE user_id = ? AND day = ?
                ORDER BY meal_time, id
            `, [userId, dayName.toLowerCase()]);
            
            // Group meals by meal_time
            const mealsByTime = {};
            result.rows.forEach(row => {
                const mealTime = row.meal_time;
                if (!mealsByTime[mealTime]) {
                    mealsByTime[mealTime] = {
                        id: Object.keys(mealsByTime).length + 1,
                        time: mealTime,
                        items: []
                    };
                }
                
                mealsByTime[mealTime].items.push({
                    id: row.id,
                    name: row.food_item,
                    amount: row.amount,
                    calories: row.calories,
                    carbs: row.carbs,
                    protein: row.protein,
                    proteinG: row.protein_general || row.protein, // Use protein_general or fallback to protein
                    fat: row.fat
                });
            });
            
            // Convert to array format expected by frontend
            const meals = Object.values(mealsByTime);
            
            // If no meals found, return default meal structure
            if (meals.length === 0) {
                console.log(`📋 No meals found for user ${userId} on ${dayName}, returning default meals`);
                return await this.getDefaultDayMeals(userId);
            }
            
            // Get macro settings from user settings
            let macroSettings = { proteinLevel: 1.9, fatLevel: 0.8, calorieAdjustment: 0 };
            try {
                const userSettings = await settingsService.getUserSettings(userId);
                macroSettings = {
                    proteinLevel: userSettings.proteinLevel || 1.9,
                    fatLevel: userSettings.fatLevel || 0.8,
                    calorieAdjustment: userSettings.calorieAdjustment || 0
                };
            } catch (settingsError) {
                console.log('Using default macro settings:', settingsError.message);
            }
            
            return {
                ...macroSettings,
                meals: meals
            };
        } catch (error) {
            console.error('❌ Database error getting day meals:', error.message);
            return this.getDefaultDayMeals();
        }
    }

    // Add item to a meal
    async addMealItem(userId, dayName, mealTime, itemData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            await query(`
                INSERT INTO user_meals (user_id, day, meal_time, food_item, amount, calories, carbs, protein, protein_general, fat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                dayName.toLowerCase(),
                mealTime,
                itemData.name,
                itemData.amount || 0,
                itemData.calories || 0,
                itemData.carbs || 0,
                itemData.protein || 0,
                itemData.proteinG || 0,
                itemData.fat || 0
            ]);
            
            console.log('✅ Meal item added to database:', itemData.name);
            return { id: Date.now(), ...itemData };
        } catch (error) {
            console.error('❌ Database error adding meal item:', error.message);
            return null;
        }
    }

    // Update meal item
    async updateMealItem(userId, dayName, mealTime, itemId, itemData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            await query(`
                UPDATE user_meals 
                SET food_item = ?, amount = ?, calories = ?, carbs = ?, protein = ?, protein_general = ?, fat = ?
                WHERE id = ? AND user_id = ? AND day = ? AND meal_time = ?
            `, [
                itemData.name,
                itemData.amount || 0,
                itemData.calories || 0,
                itemData.carbs || 0,
                itemData.protein || 0,
                itemData.proteinG || 0,
                itemData.fat || 0,
                itemId,
                userId,
                dayName.toLowerCase(),
                mealTime
            ]);
            
            console.log('✅ Meal item updated in database:', itemData.name);
            return { id: itemId, ...itemData };
        } catch (error) {
            console.error('❌ Database error updating meal item:', error.message);
            return null;
        }
    }

    // Delete meal item
    async deleteMealItem(userId, dayName, mealTime, itemId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            await query(`
                DELETE FROM user_meals 
                WHERE id = ? AND user_id = ? AND day = ? AND meal_time = ?
            `, [itemId, userId, dayName.toLowerCase(), mealTime]);
            
            console.log('✅ Meal item deleted from database, ID:', itemId);
            return true;
        } catch (error) {
            console.error('❌ Database error deleting meal item:', error.message);
            return false;
        }
    }

    // Update meal time
    async updateMealTime(userId, dayName, oldMealTime, newMealTime) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            await query(`
                UPDATE user_meals 
                SET meal_time = ?
                WHERE user_id = ? AND day = ? AND meal_time = ?
            `, [newMealTime, userId, dayName.toLowerCase(), oldMealTime]);
            
            console.log('✅ Meal time updated in database:', `${oldMealTime} -> ${newMealTime}`);
            return true;
        } catch (error) {
            console.error('❌ Database error updating meal time:', error.message);
            return false;
        }
    }

    // Get default day meals structure
    async getDefaultDayMeals(userId = null) {
        const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
        
        // Get macro settings from user settings if userId provided
        let macroSettings = { proteinLevel: 1.9, fatLevel: 0.8, calorieAdjustment: 0 };
        if (userId) {
            try {
                const userSettings = await settingsService.getUserSettings(userId);
                macroSettings = {
                    proteinLevel: userSettings.proteinLevel || 1.9,
                    fatLevel: userSettings.fatLevel || 0.8,
                    calorieAdjustment: userSettings.calorieAdjustment || 0
                };
            } catch (settingsError) {
                console.log('Using default macro settings for default meals:', settingsError.message);
            }
        }
        
        return {
            ...macroSettings,
            meals: defaultTimes.map((time, index) => ({
                id: index + 1,
                time: time,
                items: []
            }))
        };
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new MealService();
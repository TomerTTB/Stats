const { query, isDatabaseAvailable } = require('./connection');
const settingsService = require('./settingsService');
const dailyMacroService = require('./dailyMacroService');

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
            
            // Group meals by meal_time with correct ID mapping
            const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
            const mealsByTime = {};
            
            // Group by meal_id instead of meal_time for better organization
            const mealsById = {};
            
            result.rows.forEach(row => {
                const mealId = row.meal_id;
                
                // Skip rows without meal_id (old data)
                if (!mealId) return;
                
                if (!mealsById[mealId]) {
                    mealsById[mealId] = {
                        id: mealId,
                        time: null,
                        items: []
                    };
                }
                
                // Check if this is a placeholder
                if (row.food_item.startsWith('__MEAL_TIME_PLACEHOLDER__MEAL_')) {
                    mealsById[mealId].time = row.meal_time;
                } else if (row.food_item !== '__MEAL_TIME_PLACEHOLDER__') {
                    // Add real food items
                    mealsById[mealId].time = row.meal_time; // Use the time from the food item
                    mealsById[mealId].items.push({
                        id: row.id,
                        name: row.food_item,
                        amount: row.amount,
                        calories: row.calories,
                        carbs: row.carbs,
                        protein: row.protein,
                        proteinG: row.protein_general, // Use protein_general only, no fallback
                        fat: row.fat,
                        // Calculate base values from current values (for backward compatibility)
                        baseAmount: row.amount,
                        baseCalories: row.calories,
                        baseCarbs: row.carbs,
                        baseProtein: row.protein,
                        baseFat: row.fat,
                        baseProteinG: row.protein_general
                    });
                }
            });
            
            // Convert to array format expected by frontend
            const fallbackTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
            const finalMeals = [];
            
            // Build final meals array using meal_id
            for (let i = 1; i <= 6; i++) {
                if (mealsById[i]) {
                    finalMeals.push(mealsById[i]);
                } else {
                    // Fill with default meal for missing positions
                    finalMeals.push({
                        id: i,
                        time: fallbackTimes[i - 1],
                        items: []
                    });
                }
            }
            
            const resultMeals = finalMeals;
            
            // Get daily macro settings for this specific day
            let macroSettings = { proteinLevel: null, fatLevel: null, calorieAdjustment: 0 };
            try {
                macroSettings = await dailyMacroService.getDailyMacros(userId, dayName);
            } catch (settingsError) {
                console.log('Using default macro settings:', settingsError.message);
            }
            
            return {
                ...macroSettings,
                meals: resultMeals
            };
        } catch (error) {
            console.error('❌ Database error getting day meals:', error.message);
            return this.getDefaultDayMeals();
        }
    }

    // Add item to a meal
    async addMealItem(userId, dayName, mealTime, itemData, mealId = null) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            // Find the meal_id for this meal time
            const mealResult = await query(`
                SELECT meal_id FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_time = ? AND food_item LIKE '__MEAL_TIME_PLACEHOLDER__MEAL_%'
                LIMIT 1
            `, [userId, dayName.toLowerCase(), mealTime]);

            // Use provided mealId if available, otherwise try to find it
            if (!mealId) {
                if (mealResult.rows.length > 0) {
                    mealId = mealResult.rows[0].meal_id;
                } else {
                    // If no placeholder found, try to determine meal_id from time proximity
                    const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
                    let closestMealId = 1;
                    let minDifference = Infinity;
                    
                    for (let i = 0; i < defaultTimes.length; i++) {
                        const defaultTime = defaultTimes[i];
                        const timeDiff = Math.abs(
                            (parseInt(mealTime.split(':')[0]) * 60 + parseInt(mealTime.split(':')[1])) -
                            (parseInt(defaultTime.split(':')[0]) * 60 + parseInt(defaultTime.split(':')[1]))
                        );
                        
                        if (timeDiff < minDifference) {
                            minDifference = timeDiff;
                            closestMealId = i + 1;
                        }
                    }
                    mealId = closestMealId;
                }
            }

            // Remove placeholder for this meal
            await query(`
                DELETE FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_time = ? AND food_item LIKE '__MEAL_TIME_PLACEHOLDER__MEAL_%'
            `, [userId, dayName.toLowerCase(), mealTime]);

            // Add the actual food item with meal_id
            await query(`
                INSERT INTO user_meals (user_id, day, meal_time, meal_id, food_item, amount, calories, carbs, protein, protein_general, fat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                dayName.toLowerCase(),
                mealTime,
                mealId,
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
            // Delete the meal item
            await query(`
                DELETE FROM user_meals 
                WHERE id = ? AND user_id = ? AND day = ? AND meal_time = ?
            `, [itemId, userId, dayName.toLowerCase(), mealTime]);
            
            // Check if this was the last real food item for this meal time
            const remainingItems = await query(`
                SELECT COUNT(*) as count FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_time = ? AND (
                    food_item != '__MEAL_TIME_PLACEHOLDER__' AND 
                    food_item NOT LIKE '__MEAL_TIME_PLACEHOLDER__MEAL_%'
                )
            `, [userId, dayName.toLowerCase(), mealTime]);

            // If no real food items remain and this is a custom time (not default), preserve it with a placeholder
            if (remainingItems.rows[0].count === 0) {
                const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
                if (!defaultTimes.includes(mealTime)) {
                    await query(`
                        INSERT INTO user_meals (user_id, day, meal_time, food_item, amount, calories, carbs, protein, protein_general, fat)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        userId,
                        dayName.toLowerCase(),
                        mealTime,
                        '__MEAL_TIME_PLACEHOLDER__',
                        0, 0, 0, 0, 0, 0
                    ]);
                    console.log('✅ Custom meal time preserved with placeholder:', mealTime);
                }
            }
            
            console.log('✅ Meal item deleted from database, ID:', itemId);
            return true;
        } catch (error) {
            console.error('❌ Database error deleting meal item:', error.message);
            return false;
        }
    }

    // Delete all items from a specific meal
    async deleteAllMealItems(userId, dayName, mealId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Delete all food items for this meal_id (but not placeholders)
            const result = await query(`
                DELETE FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_id = ? AND food_item NOT LIKE '__MEAL_TIME_PLACEHOLDER__%'
            `, [userId, dayName.toLowerCase(), mealId]);
            
            console.log(`✅ Deleted all items from meal ${mealId} for ${dayName}`);
            return true;
        } catch (error) {
            console.error('❌ Database error deleting all meal items:', error.message);
            return false;
        }
    }

    // Set meal time for a specific meal ID (creates placeholder if needed)
    async setMealTime(userId, dayName, mealId, newMealTime) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Update ALL food items that belong to this meal ID to the new time
            await query(`
                UPDATE user_meals 
                SET meal_time = ?
                WHERE user_id = ? AND day = ? AND meal_id = ? AND food_item NOT LIKE '__MEAL_TIME_PLACEHOLDER__%'
            `, [newMealTime, userId, dayName.toLowerCase(), mealId]);
            
            console.log(`✅ Updated meal ${mealId} food items to ${newMealTime}`);

            // Check if there are any real food items for this meal ID
            const foodItemsResult = await query(`
                SELECT COUNT(*) as count FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_id = ? AND food_item NOT LIKE '__MEAL_TIME_PLACEHOLDER__%'
            `, [userId, dayName.toLowerCase(), mealId]);

            // Delete ALL existing placeholders for this specific meal ID
            await query(`
                DELETE FROM user_meals 
                WHERE user_id = ? AND day = ? AND food_item = '__MEAL_TIME_PLACEHOLDER__MEAL_${mealId}__'
            `, [userId, dayName.toLowerCase()]);

            // Only create placeholder if there are no real food items for this meal
            if (foodItemsResult.rows[0].count === 0) {
                await query(`
                    INSERT INTO user_meals (user_id, day, meal_time, meal_id, food_item, amount, calories, carbs, protein, protein_general, fat)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    dayName.toLowerCase(),
                    newMealTime,
                    mealId,
                    `__MEAL_TIME_PLACEHOLDER__MEAL_${mealId}__`,  // Include meal ID in placeholder
                    0, 0, 0, 0, 0, 0
                ]);
                console.log(`✅ Created placeholder for meal ${mealId} at ${newMealTime}`);
            } else {
                console.log(`ℹ️  No placeholder needed for meal ${mealId} - has ${foodItemsResult.rows[0].count} food items`);
            }

            console.log(`✅ Meal ${mealId} time set to ${newMealTime} for ${dayName}`);
            return true;
        } catch (error) {
            console.error('❌ Database error setting meal time:', error.message);
            return false;
        }
    }

    // Clean up all duplicate placeholders for a specific day
    async cleanupDayPlaceholders(userId, dayName) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Get all placeholder entries for this day
            const result = await query(`
                SELECT * FROM user_meals 
                WHERE user_id = ? AND day = ? AND food_item LIKE '__MEAL_TIME_PLACEHOLDER__MEAL_%'
                ORDER BY meal_id, id
            `, [userId, dayName.toLowerCase()]);
            
            // Group by meal_id and keep only the latest one
            const toDelete = [];
            const seen = new Set();
            
            for (const row of result.rows) {
                const key = `${row.meal_id}`;
                if (seen.has(key)) {
                    toDelete.push(row.id);
                } else {
                    seen.add(key);
                }
            }
            
            if (toDelete.length > 0) {
                // Delete duplicates
                await query(`
                    DELETE FROM user_meals 
                    WHERE id IN (${toDelete.map(() => '?').join(',')})
                `, toDelete);
                
                console.log(`🧹 Cleaned up ${toDelete.length} duplicate placeholders for ${dayName}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
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
            // Check if there are any existing entries for this meal time
            const existingEntries = await query(`
                SELECT COUNT(*) as count FROM user_meals 
                WHERE user_id = ? AND day = ? AND meal_time = ?
            `, [userId, dayName.toLowerCase(), oldMealTime]);

            if (existingEntries.rows[0].count > 0) {
                // Update existing entries
                await query(`
                    UPDATE user_meals 
                    SET meal_time = ?
                    WHERE user_id = ? AND day = ? AND meal_time = ?
                `, [newMealTime, userId, dayName.toLowerCase(), oldMealTime]);
                console.log('✅ Meal time updated in database:', `${oldMealTime} -> ${newMealTime}`);
            } else {
                // No existing entries, create a placeholder entry to preserve the meal time
                await query(`
                    INSERT INTO user_meals (user_id, day, meal_time, food_item, amount, calories, carbs, protein, protein_general, fat)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    dayName.toLowerCase(),
                    newMealTime,
                    '__MEAL_TIME_PLACEHOLDER__', // Special placeholder name
                    0, 0, 0, 0, 0, 0
                ]);
                console.log('✅ Meal time placeholder created in database:', `${oldMealTime} -> ${newMealTime}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Database error updating meal time:', error.message);
            return false;
        }
    }

    // Get default day meals structure
    async getDefaultDayMeals(userId = null) {
        const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
        
        // Get macro settings from daily macro service if userId provided
        let macroSettings = { proteinLevel: null, fatLevel: null, calorieAdjustment: 0 };
        if (userId) {
            try {
                // For default meals, we'll use the default macro settings
                // since we don't have a specific day context
                macroSettings = dailyMacroService.getDefaultMacros();
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
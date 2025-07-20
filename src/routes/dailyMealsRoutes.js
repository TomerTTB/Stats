const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mealService = require('../database/mealService');
const dailyMacroService = require('../database/dailyMacroService');

// Get meals for a specific day - user-specific with authentication
router.get('/:day', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/daily-meals/:day');
    try {
        const day = req.params.day.toLowerCase();
        const userId = req.user.id;
        
        const data = await mealService.getUserDayMeals(userId, day);
        res.json(data);
    } catch (error) {
        console.error('Error in GET /api/daily-meals/:day:', error);
        res.status(500).json({ error: 'Failed to read meals' });
    }
});

// Update meal time - user-specific with authentication
router.put('/:day/meals/:mealId/time', authenticateToken, async (req, res) => {
    console.log('Handling PUT request for /api/daily-meals/:day/meals/:mealId/time');
    try {
        const { day, mealId } = req.params;
        const { time } = req.body;
        const userId = req.user.id;
        
        // Handle meal time updates - directly create placeholder if meal doesn't exist
        const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
        const mealIndex = parseInt(mealId) - 1;
        
        if (mealIndex < 0 || mealIndex >= defaultTimes.length) {
            return res.status(400).json({ error: 'Invalid meal ID' });
        }

        // For meal time updates, we'll directly handle creating/updating the placeholder
        const success = await mealService.setMealTime(userId, day, parseInt(mealId), time);
        if (success) {
            res.json({ message: 'Meal time updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update meal time in database' });
        }
    } catch (error) {
        console.error('Error in PUT /api/daily-meals/:day/meals/:mealId/time:', error);
        res.status(500).json({ error: 'Failed to update meal time' });
    }
});

// Add item to meal for a specific day - user-specific with authentication
router.post('/:day/meals/:mealId/items', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/daily-meals/:day/meals/:mealId/items');
    console.log('📦 Received item data:', JSON.stringify(req.body, null, 2));
    try {
        const { day, mealId } = req.params;
        const newItem = req.body;
        const userId = req.user.id;
        
        // Get meal time from the item data or fallback to default
        let mealTime = newItem.mealTime;
        if (!mealTime) {
            // Fallback: get meal time from mealId
            const dayData = await mealService.getUserDayMeals(userId, day);
            let meal = dayData.meals.find(m => m.id === parseInt(mealId));
            
            // If meal doesn't exist, create it with default time
            if (!meal) {
                const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
                const mealIndex = parseInt(mealId) - 1;
                if (mealIndex >= 0 && mealIndex < defaultTimes.length) {
                    mealTime = defaultTimes[mealIndex];
                } else {
                    return res.status(400).json({ error: 'Invalid meal ID' });
                }
            } else {
                mealTime = meal.time;
            }
        }
        
        // Remove mealTime from itemData before passing to addMealItem
        const { mealTime: _, ...itemDataWithoutTime } = newItem;
        
        const addedItem = await mealService.addMealItem(userId, day, mealTime, itemDataWithoutTime, parseInt(mealId));
        if (addedItem) {
            res.json(addedItem);
        } else {
            res.status(500).json({ error: 'Failed to add item to database' });
        }
    } catch (error) {
        console.error('Error in POST /api/daily-meals/:day/meals/:mealId/items:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update item in meal for a specific day - user-specific with authentication
router.put('/:day/meals/:mealId/items/:itemId', authenticateToken, async (req, res) => {
    console.log('Handling PUT request for /api/daily-meals/:day/meals/:mealId/items/:itemId');
    try {
        const { day, mealId, itemId } = req.params;
        const updatedItem = req.body;
        const userId = req.user.id;
        
        // Get meal time from mealId
        const dayData = await mealService.getUserDayMeals(userId, day);
        let meal = dayData.meals.find(m => m.id === parseInt(mealId));
        
        // If meal doesn't exist, create it with default time
        if (!meal) {
            const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
            const mealIndex = parseInt(mealId) - 1;
            if (mealIndex >= 0 && mealIndex < defaultTimes.length) {
                meal = {
                    id: parseInt(mealId),
                    time: defaultTimes[mealIndex],
                    items: []
                };
            } else {
                return res.status(400).json({ error: 'Invalid meal ID' });
            }
        }

        const result = await mealService.updateMealItem(userId, day, meal.time, itemId, updatedItem);
        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: 'Item not found or failed to update' });
        }
    } catch (error) {
        console.error('Error in PUT /api/daily-meals/:day/meals/:mealId/items/:itemId:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item from meal for a specific day - user-specific with authentication
router.delete('/:day/meals/:mealId/items/:itemId', authenticateToken, async (req, res) => {
    console.log('Handling DELETE request for /api/daily-meals/:day/meals/:mealId/items/:itemId');
    try {
        const { day, mealId, itemId } = req.params;
        const userId = req.user.id;
        
        // Get meal time from mealId
        const dayData = await mealService.getUserDayMeals(userId, day);
        let meal = dayData.meals.find(m => m.id === parseInt(mealId));
        
        // If meal doesn't exist, create it with default time
        if (!meal) {
            const defaultTimes = ["08:00", "11:00", "14:00", "17:00", "20:00", "23:00"];
            const mealIndex = parseInt(mealId) - 1;
            if (mealIndex >= 0 && mealIndex < defaultTimes.length) {
                meal = {
                    id: parseInt(mealId),
                    time: defaultTimes[mealIndex],
                    items: []
                };
            } else {
                return res.status(400).json({ error: 'Invalid meal ID' });
            }
        }

        const success = await mealService.deleteMealItem(userId, day, meal.time, itemId);
        if (success) {
            res.json({ message: 'Item deleted successfully' });
        } else {
            res.status(404).json({ error: 'Item not found or failed to delete' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/daily-meals/:day/meals/:mealId/items/:itemId:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Delete all items from meal for a specific day - user-specific with authentication
router.delete('/:day/meals/:mealId/items', authenticateToken, async (req, res) => {
    console.log('Handling DELETE request for /api/daily-meals/:day/meals/:mealId/items');
    try {
        const { day, mealId } = req.params;
        const userId = req.user.id;
        
        const success = await mealService.deleteAllMealItems(userId, day, parseInt(mealId));
        if (success) {
            res.json({ message: 'All items deleted successfully' });
        } else {
            res.status(404).json({ error: 'Meal not found or failed to delete items' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/daily-meals/:day/meals/:mealId/items:', error);
        res.status(500).json({ error: 'Failed to delete items' });
    }
});

// Update macro levels for a specific day - now using daily macro service
router.put('/:day/macros', authenticateToken, async (req, res) => {
    try {
        const { proteinLevel, fatLevel, calorieAdjustment } = req.body;
        const userId = req.user.id;
        const { day } = req.params;
        
        // Save daily macro settings for this specific day
        const success = await dailyMacroService.saveDailyMacros(userId, day, {
            proteinLevel: proteinLevel,
            fatLevel: fatLevel,
            calorieAdjustment: calorieAdjustment || 0
        });
        
        if (success) {
            console.log(`✅ Daily macro settings updated for user ${userId}, day ${day}: protein=${proteinLevel}, fat=${fatLevel}, calorie=${calorieAdjustment}`);
            res.json({ message: 'Daily macro settings updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update daily macro settings' });
        }
    } catch (error) {
        console.error('Error updating daily macro settings:', error);
        res.status(500).json({ error: 'Failed to update daily macro settings' });
    }
});

// Add a POST route for macros - now using daily macro service
router.post('/:day/macros', authenticateToken, async (req, res) => {
    try {
        const { proteinLevel, fatLevel, calorieAdjustment } = req.body;
        const userId = req.user.id;
        const { day } = req.params;
        
        // Save daily macro settings for this specific day
        const success = await dailyMacroService.saveDailyMacros(userId, day, {
            proteinLevel: proteinLevel,
            fatLevel: fatLevel,
            calorieAdjustment: calorieAdjustment || 0
        });
        
        if (success) {
            console.log(`✅ Daily macro settings saved for user ${userId}, day ${day}: protein=${proteinLevel}, fat=${fatLevel}, calorie=${calorieAdjustment}`);
            res.json({ message: 'Daily macro settings saved successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save daily macro settings' });
        }
    } catch (error) {
        console.error('Error saving daily macro settings:', error);
        res.status(500).json({ error: 'Failed to save daily macro settings' });
    }
});

// Clean up duplicate placeholders for a specific day
router.post('/:day/cleanup-placeholders', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/daily-meals/:day/cleanup-placeholders');
    try {
        const { day } = req.params;
        const userId = req.user.id;
        
        const success = await mealService.cleanupDayPlaceholders(userId, day);
        if (success) {
            res.json({ message: 'Placeholders cleaned up successfully' });
        } else {
            res.status(500).json({ error: 'Failed to cleanup placeholders' });
        }
    } catch (error) {
        console.error('Error in POST /api/daily-meals/:day/cleanup-placeholders:', error);
        res.status(500).json({ error: 'Failed to cleanup placeholders' });
    }
});

module.exports = router; 
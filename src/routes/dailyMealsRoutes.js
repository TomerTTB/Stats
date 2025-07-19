const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const mealService = require('../database/mealService');

// Get meals for a specific day - user-specific with authentication
router.get('/:day', requireAuth, async (req, res) => {
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
router.put('/:day/meals/:mealId/time', requireAuth, async (req, res) => {
    console.log('Handling PUT request for /api/daily-meals/:day/meals/:mealId/time');
    try {
        const { day, mealId } = req.params;
        const { time } = req.body;
        const userId = req.user.id;
        
        // Get current meal data to find the old time
        const dayData = await mealService.getUserDayMeals(userId, day);
        const meal = dayData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        const success = await mealService.updateMealTime(userId, day, meal.time, time);
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
router.post('/:day/meals/:mealId/items', requireAuth, async (req, res) => {
    console.log('Handling POST request for /api/daily-meals/:day/meals/:mealId/items');
    console.log('📦 Received item data:', JSON.stringify(req.body, null, 2));
    try {
        const { day, mealId } = req.params;
        const newItem = req.body;
        const userId = req.user.id;
        
        // Get meal time from mealId (assuming mealId corresponds to time)
        const dayData = await mealService.getUserDayMeals(userId, day);
        const meal = dayData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        
        const addedItem = await mealService.addMealItem(userId, day, meal.time, newItem);
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
router.put('/:day/meals/:mealId/items/:itemId', requireAuth, async (req, res) => {
    console.log('Handling PUT request for /api/daily-meals/:day/meals/:mealId/items/:itemId');
    try {
        const { day, mealId, itemId } = req.params;
        const updatedItem = req.body;
        const userId = req.user.id;
        
        // Get meal time from mealId
        const dayData = await mealService.getUserDayMeals(userId, day);
        const meal = dayData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
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
router.delete('/:day/meals/:mealId/items/:itemId', requireAuth, async (req, res) => {
    console.log('Handling DELETE request for /api/daily-meals/:day/meals/:mealId/items/:itemId');
    try {
        const { day, mealId, itemId } = req.params;
        const userId = req.user.id;
        
        // Get meal time from mealId
        const dayData = await mealService.getUserDayMeals(userId, day);
        const meal = dayData.meals.find(m => m.id === parseInt(mealId));
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
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

// Update macro levels for a specific day - now using database settings service  
router.put('/:day/macros', requireAuth, async (req, res) => {
    try {
        const { proteinLevel, fatLevel, calorieAdjustment } = req.body;
        const userId = req.user.id;
        
        // Import settings service
        const settingsService = require('../database/settingsService');
        
        // Get current user settings
        const currentSettings = await settingsService.getUserSettings(userId);
        
        // Update macro settings
        const updatedSettings = {
            ...currentSettings,
            proteinLevel: proteinLevel || currentSettings.proteinLevel || 1.9,
            fatLevel: fatLevel || currentSettings.fatLevel || 0.8,
            calorieAdjustment: calorieAdjustment || currentSettings.calorieAdjustment || 0
        };
        
        // Save updated settings to database
        await settingsService.saveUserSettings(userId, updatedSettings);
        
        console.log(`✅ Macro settings updated for user ${userId}: protein=${proteinLevel}, fat=${fatLevel}, calorie=${calorieAdjustment}`);
        res.json({ message: 'Macro settings updated successfully' });
    } catch (error) {
        console.error('Error updating macro settings:', error);
        res.status(500).json({ error: 'Failed to update macro settings' });
    }
});

// Add a POST route for macros - now using database settings service
router.post('/:day/macros', requireAuth, async (req, res) => {
    try {
        const { proteinLevel, fatLevel, calorieAdjustment } = req.body;
        const userId = req.user.id;
        
        // Import settings service
        const settingsService = require('../database/settingsService');
        
        // Get current user settings
        const currentSettings = await settingsService.getUserSettings(userId);
        
        // Update macro settings
        const updatedSettings = {
            ...currentSettings,
            proteinLevel: proteinLevel || currentSettings.proteinLevel || 1.9,
            fatLevel: fatLevel || currentSettings.fatLevel || 0.8,
            calorieAdjustment: calorieAdjustment || currentSettings.calorieAdjustment || 0
        };
        
        // Save updated settings to database
        await settingsService.saveUserSettings(userId, updatedSettings);
        
        console.log(`✅ Macro settings saved for user ${userId}: protein=${proteinLevel}, fat=${fatLevel}, calorie=${calorieAdjustment}`);
        res.json({ message: 'Macro settings saved successfully' });
    } catch (error) {
        console.error('Error saving macro settings:', error);
        res.status(500).json({ error: 'Failed to save macro settings' });
    }
});

module.exports = router; 
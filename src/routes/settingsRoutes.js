const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const settingsService = require('../database/settingsService');
const userService = require('../database/userService');

// Get user settings - user-specific with authentication
router.get('/', requireAuth, async (req, res) => {
    console.log('Handling GET request for /api/settings');
    try {
        const userId = req.user.id;
        const settings = await settingsService.getUserSettings(userId);
        
        // Ensure userName is populated from session data
        settings.userName = req.user.name || '';
        
        res.json(settings);
    } catch (error) {
        console.error('Error in GET /api/settings:', error);
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

// Update user settings - user-specific with authentication
router.post('/', requireAuth, async (req, res) => {
    console.log('Handling POST request for /api/settings');
    try {
        const userId = req.user.id;
        const settings = req.body;
        
        // Validate required fields
        const requiredFields = ['sex', 'age', 'weight', 'height', 'activityLevel'];
        for (const field of requiredFields) {
            if (!settings[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        // Validate numeric fields
        const numericFields = ['age', 'weight', 'height', 'calorieAdjustment', 'bmr', 'totalCalories', 'mealInterval'];
        for (const field of numericFields) {
            if (settings[field] !== undefined) {
                settings[field] = parseFloat(settings[field]);
                if (isNaN(settings[field])) {
                    return res.status(400).json({ error: `Invalid numeric value for field: ${field}` });
                }
            }
        }

        // Validate meal interval
        if (settings.mealInterval < 1 || settings.mealInterval > 6) {
            return res.status(400).json({ error: 'Meal interval must be between 1 and 6 hours' });
        }

        // Handle userName update - update user profile using SQLite
        if (settings.userName && settings.userName !== req.user.name) {
            try {
                // Update user's name using SQLite-based user service
                const success = await userService.updateUserName(userId, settings.userName);
                if (success) {
                    // Update session data
                    req.session.userName = settings.userName;
                    console.log('✅ User name updated successfully:', settings.userName);
                } else {
                    console.error('❌ Failed to update user name in database');
                }
            } catch (error) {
                console.error('Error updating user name:', error);
                // Continue with settings save even if name update fails
            }
        }

        // Save settings using the new SQLite-based service
        const success = await settingsService.saveUserSettings(userId, settings);
        if (success) {
            res.json({ message: 'Settings saved successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save settings to database' });
        }
    } catch (error) {
        console.error('Error in POST /api/settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router; 
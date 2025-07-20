const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const settingsService = require('../database/settingsService');
const userService = require('../database/userService');

// Get user settings - user-specific with authentication
router.get('/', authenticateToken, async (req, res) => {
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
router.post('/', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/settings');
    try {
        const userId = req.user.id;
        const settings = req.body;
        
        // Validate required fields - allow partial saves for new users
        // Only require all fields if user is trying to calculate BMR/calories
        const hasCalculations = settings.bmr > 0 || settings.totalCalories > 0;
        
        if (hasCalculations) {
            // If user has calculations, all required fields must be filled
            const requiredFields = ['sex', 'age', 'weight', 'height', 'activityLevel'];
            for (const field of requiredFields) {
                if (!settings[field]) {
                    return res.status(400).json({ error: `Missing required field: ${field}` });
                }
            }
        } else {
            // For new users or partial saves, only validate activityLevel
            if (!settings.activityLevel) {
                return res.status(400).json({ error: 'Missing required field: activityLevel' });
            }
        }

        // Validate numeric fields - allow empty values for new users
        const numericFields = ['age', 'weight', 'height', 'bmr', 'totalCalories', 'mealInterval'];
        for (const field of numericFields) {
            if (settings[field] !== undefined && settings[field] !== null && settings[field] !== '') {
                settings[field] = parseFloat(settings[field]);
                if (isNaN(settings[field])) {
                    return res.status(400).json({ error: `Invalid numeric value for field: ${field}` });
                }
            } else {
                // Set empty values to null for database storage
                settings[field] = null;
            }
        }

        // Validate meal interval - allow empty values for new users
        if (settings.mealInterval !== null && settings.mealInterval !== undefined && settings.mealInterval !== '') {
            if (settings.mealInterval < 1 || settings.mealInterval > 6) {
                return res.status(400).json({ error: 'Meal interval must be between 1 and 6 hours' });
            }
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
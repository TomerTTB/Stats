const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const weightService = require('../database/weightService');

// GET - Get all weight entries for a user
router.get('/', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/weight');
    try {
        const userId = req.user.id;
        const weightData = await weightService.getUserWeightEntries(userId);
        res.json(weightData);
    } catch (error) {
        console.error('Error in GET /api/weight:', error);
        res.status(500).json({ error: 'Failed to read weight entries' });
    }
});

// POST - Add a new weight entry
router.post('/', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/weight');
    try {
        const userId = req.user.id;
        const { date, weight, note } = req.body;
        
        // Validate required fields
        if (!date || !weight) {
            return res.status(400).json({ error: 'Date and weight are required' });
        }
        
        // Validate weight is a positive number
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return res.status(400).json({ error: 'Weight must be a positive number' });
        }
        
        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        
        const entryData = {
            date: date,
            weight: weightNum,
            note: note || ''
        };
        
        const newEntry = await weightService.addWeightEntry(userId, entryData);
        if (newEntry) {
            res.json({ message: 'Weight entry saved successfully', entry: newEntry });
        } else {
            res.status(500).json({ error: 'Failed to save weight entry to database' });
        }
    } catch (error) {
        console.error('Error in POST /api/weight:', error);
        res.status(500).json({ error: 'Failed to save weight entry' });
    }
});

// PUT - Update an existing weight entry
router.put('/:id', authenticateToken, async (req, res) => {
    console.log('Handling PUT request for /api/weight/:id');
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const { date, weight, note } = req.body;
        
        // Validate required fields
        if (!date || !weight) {
            return res.status(400).json({ error: 'Date and weight are required' });
        }
        
        // Validate weight is a positive number
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            return res.status(400).json({ error: 'Weight must be a positive number' });
        }
        
        const entryData = {
            date: date,
            weight: weightNum,
            note: note || ''
        };
        
        const updatedEntry = await weightService.updateWeightEntry(userId, entryId, entryData);
        if (updatedEntry) {
            res.json({ message: 'Weight entry updated successfully', entry: updatedEntry });
        } else {
            res.status(404).json({ error: 'Weight entry not found or failed to update' });
        }
    } catch (error) {
        console.error('Error in PUT /api/weight/:id:', error);
        res.status(500).json({ error: 'Failed to update weight entry' });
    }
});

// DELETE - Delete a weight entry
router.delete('/:id', authenticateToken, async (req, res) => {
    console.log('Handling DELETE request for /api/weight/:id');
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        
        const success = await weightService.deleteWeightEntry(userId, entryId);
        if (success) {
            res.json({ message: 'Weight entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Weight entry not found or failed to delete' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/weight/:id:', error);
        res.status(500).json({ error: 'Failed to delete weight entry' });
    }
});

module.exports = router; 
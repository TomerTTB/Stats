const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const foodService = require('../database/foodService');

// Debug logging
router.use((req, res, next) => {
    console.log(`[Foods Route] ${req.method} ${req.url}`);
    next();
});

// Get all foods - requires authentication, shared database
router.get('/', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/foods');
    try {
        const { search } = req.query;
        
        let foods;
        if (search) {
            // Use search functionality
            foods = await foodService.searchFoods(search);
        } else {
            // Get all foods
            foods = await foodService.getAllFoods();
        }
        
        // Maintain the same response format as before
        res.json({ foods: foods });
    } catch (error) {
        console.error('Error in GET /api/foods:', error);
        res.status(500).json({ error: 'Failed to load foods database' });
    }
});

// Search foods endpoint (alternative to query parameter)
router.get('/search', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/foods/search');
    try {
        const { q } = req.query;
        const foods = await foodService.searchFoods(q || '');
        
        res.json({ foods: foods });
    } catch (error) {
        console.error('Error in GET /api/foods/search:', error);
        res.status(500).json({ error: 'Failed to search foods database' });
    }
});

// Add new food - requires authentication, shared database
router.post('/', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/foods');
    try {
        const success = await foodService.addFood(req.body);
        if (success) {
            res.status(201).json(req.body);
        } else {
            res.status(500).json({ error: 'Failed to add food to database' });
        }
    } catch (error) {
        console.error('Error in POST /api/foods:', error);
        res.status(500).json({ error: 'Failed to add new food' });
    }
});

// Update food - requires authentication, shared database
router.put('/:index', authenticateToken, async (req, res) => {
    console.log('Handling PUT request for /api/foods/:index');
    try {
        const index = parseInt(req.params.index);
        
        // For SQLite mode, we need to get the food ID first
        // Since frontend sends index, we need to map it to database ID
        const allFoods = await foodService.getAllFoods();
        if (index < 0 || index >= allFoods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        // For now, we'll use the index approach for compatibility
        // In SQLite mode, this will work through the updateFood method
        const success = await foodService.updateFood(index, req.body);
        if (success) {
            res.json(req.body);
        } else {
            res.status(500).json({ error: 'Failed to update food in database' });
        }
    } catch (error) {
        console.error('Error in PUT /api/foods/:index:', error);
        res.status(500).json({ error: 'Failed to update food' });
    }
});

// Delete food - requires authentication, shared database
router.delete('/:index', authenticateToken, async (req, res) => {
    console.log('Handling DELETE request for /api/foods/:index');
    try {
        const index = parseInt(req.params.index);
        
        // Get all foods to validate index and find the item to delete
        const allFoods = await foodService.getAllFoods();
        if (index < 0 || index >= allFoods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        // For now, we'll use the index approach for compatibility
        // In SQLite mode, this will work through the deleteFood method
        const success = await foodService.deleteFood(index);
        if (success) {
            res.status(204).send();
        } else {
            res.status(500).json({ error: 'Failed to delete food from database' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/foods/:index:', error);
        res.status(500).json({ error: 'Failed to delete food' });
    }
});

module.exports = router; 
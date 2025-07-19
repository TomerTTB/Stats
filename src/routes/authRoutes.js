const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const userService = require('../database/userService');

// Helper function to generate user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Register new user
router.post('/register', async (req, res) => {
    console.log('Handling POST request for /api/auth/register');
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user already exists using SQLite
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: generateUserId(),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        // Add user to SQLite database
        const success = await userService.createUser(newUser);
        if (!success) {
            return res.status(500).json({ error: 'Failed to create user in database' });
        }

        // Don't send password back
        const { password: _, ...userResponse } = newUser;

        res.status(201).json({ 
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    console.log('Handling POST request for /api/auth/login');
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user using SQLite
        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;

        // Don't send password back
        const { password: _, ...userResponse } = user;

        res.json({ 
            message: 'Login successful',
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Error during logout' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get current user (check if logged in)
router.get('/me', async (req, res) => {
    console.log('Handling GET request for /api/auth/me');
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Get user using SQLite
        const user = await userService.getUserById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Don't send password back
        const { password: _, ...userResponse } = user;

        res.json({ user: userResponse });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
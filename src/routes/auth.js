const express = require('express');
const { v4: uuidv4 } = require('uuid');
const userService = require('../database/userService');
const { 
    hashPassword, 
    comparePassword, 
    generateToken,
    checkRateLimit,
    recordFailedAttempt,
    clearFailedAttempts,
    authenticateToken
} = require('../middleware/auth');

const router = express.Router();

// Input validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, 255); // Limit length and trim whitespace
}

// Register new user
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request body:', req.body);
        const { email, name, password, confirmPassword } = req.body;

        // Input validation
        if (!email || !name || !password || !confirmPassword) {
            console.log('Missing fields:', { 
                email: !!email, 
                name: !!name, 
                password: !!password, 
                confirmPassword: !!confirmPassword 
            });
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedName = sanitizeInput(name);

        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await userService.getUserByEmail(sanitizedEmail);
        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userId = uuidv4();
        const userData = {
            id: userId,
            email: sanitizedEmail,
            name: sanitizedName,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        const success = await userService.createUser(userData);
        if (!success) {
            return res.status(500).json({
                error: 'Failed to create user'
            });
        }

        // Generate token
        const token = generateToken({
            id: userId,
            email: sanitizedEmail,
            name: sanitizedName
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                email: sanitizedEmail,
                name: sanitizedName
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error during registration'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const sanitizedEmail = sanitizeInput(email).toLowerCase();

        // Check rate limiting
        try {
            checkRateLimit(sanitizedEmail);
        } catch (rateLimitError) {
            return res.status(429).json({
                error: rateLimitError.message
            });
        }

        // Find user
        const user = await userService.getUserByEmail(sanitizedEmail);
        if (!user) {
            recordFailedAttempt(sanitizedEmail);
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Compare password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            recordFailedAttempt(sanitizedEmail);
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(sanitizedEmail);

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error during login'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Failed to get user profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            });
        }

        const sanitizedName = sanitizeInput(name);
        if (sanitizedName.length < 1) {
            return res.status(400).json({
                error: 'Name cannot be empty'
            });
        }

        const success = await userService.updateUserName(req.user.id, sanitizedName);
        if (!success) {
            return res.status(500).json({
                error: 'Failed to update profile'
            });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: req.user.id,
                email: req.user.email,
                name: sanitizedName
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', authenticateToken, (req, res) => {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
        message: 'Logout successful'
    });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Get current user (check if logged in) - alias for /verify
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;
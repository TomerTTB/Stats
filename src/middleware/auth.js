const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../database/userService');

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Hash password
async function hashPassword(password) {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        throw new Error('Error hashing password');
    }
}

// Compare password
async function comparePassword(password, hashedPassword) {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing password');
    }
}

// Generate JWT token
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'food-diary-app'
    });
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get fresh user data from database
        const user = await userService.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid token. User not found.'
            });
        }

        // Add user to request object
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(403).json({
            error: error.message || 'Invalid token'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await userService.getUserById(decoded.id);
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name
                };
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Rate limiting helper (simple in-memory implementation)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    // Reset if lockout time has passed
    if (now - attempts.lastAttempt > LOCKOUT_TIME) {
        attempts.count = 0;
    }

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeLeft = LOCKOUT_TIME - (now - attempts.lastAttempt);
        throw new Error(`Too many login attempts. Try again in ${Math.ceil(timeLeft / 60000)} minutes.`);
    }

    return attempts;
}

function recordFailedAttempt(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
    attempts.count += 1;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);
}

function clearFailedAttempts(identifier) {
    loginAttempts.delete(identifier);
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth,
    checkRateLimit,
    recordFailedAttempt,
    clearFailedAttempts
};
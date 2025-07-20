const jwt = require('jsonwebtoken');
const userService = require('../database/userService');

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Get user from database to ensure they still exist
        const user = await userService.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Add user info to request object
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await userService.getUserById(decoded.userId);
            
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
        // For optional auth, we don't return errors, just continue without user
        next();
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id,
            email: user.email 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
    );
};

// Generate refresh token (longer lived)
const generateRefreshToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { 
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        }
    );
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    generateRefreshToken
};
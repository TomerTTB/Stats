const fs = require('fs').promises;
const path = require('path');

// Authentication middleware - requires user to be logged in
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Add user info to request object for easy access
    req.user = {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName
    };
    
    next();
}

// Optional authentication - adds user info if logged in, but doesn't require it
function optionalAuth(req, res, next) {
    if (req.session.userId) {
        req.user = {
            id: req.session.userId,
            email: req.session.userEmail,
            name: req.session.userName
        };
    }
    
    next();
}

// Helper function to get user data directory
function getUserDataPath(userId) {
    return path.join(__dirname, '..', 'data', 'users', userId);
}

// Helper function to ensure user data directory exists
async function ensureUserDataDirectory(userId) {
    const userDataPath = getUserDataPath(userId);
    const userMealsPath = path.join(userDataPath, 'meals');
    
    try {
        await fs.mkdir(userDataPath, { recursive: true });
        await fs.mkdir(userMealsPath, { recursive: true });
        return userDataPath;
    } catch (error) {
        console.error('Error creating user data directory:', error);
        throw error;
    }
}

// Helper function to get user settings file path
function getUserSettingsPath(userId) {
    return path.join(getUserDataPath(userId), 'settings.json');
}

// Helper function to get user meals directory path
function getUserMealsPath(userId) {
    return path.join(getUserDataPath(userId), 'meals');
}

module.exports = {
    requireAuth,
    optionalAuth,
    getUserDataPath,
    ensureUserDataDirectory,
    getUserSettingsPath,
    getUserMealsPath
}; 
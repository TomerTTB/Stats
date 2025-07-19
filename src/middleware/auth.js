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

module.exports = {
    requireAuth,
    optionalAuth
}; 
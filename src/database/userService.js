const { query, isDatabaseAvailable } = require('./connection');

class UserService {
    constructor() {
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        if (isDatabaseAvailable()) {
            console.log('👤 User service using SQLite database');
        } else {
            console.log('🚫 User database not available');
        }
    }

    // Get user by email
    async getUserByEmail(email) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            const result = await query('SELECT * FROM users WHERE email = ?', [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('❌ Database error getting user by email:', error.message);
            return null;
        }
    }

    // Get user by ID
    async getUserById(id) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            const result = await query('SELECT * FROM users WHERE id = ?', [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('❌ Database error getting user by ID:', error.message);
            return null;
        }
    }

    // Create new user
    async createUser(userData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            await query(`
                INSERT INTO users (id, email, name, password, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, [
                userData.id,
                userData.email,
                userData.name,
                userData.password,
                userData.createdAt || new Date().toISOString()
            ]);
            
            console.log('✅ User created in database:', userData.email);
            return true;
        } catch (error) {
            console.error('❌ Database error creating user:', error.message);
            return false;
        }
    }

    // Update user name
    async updateUserName(userId, newName) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            await query(`
                UPDATE users 
                SET name = ?
                WHERE id = ?
            `, [newName, userId]);
            
            console.log('✅ User name updated in database:', newName);
            return true;
        } catch (error) {
            console.error('❌ Database error updating user name:', error.message);
            return false;
        }
    }

    // Get all users
    async getAllUsers() {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return [];
        }

        try {
            const result = await query('SELECT * FROM users ORDER BY created_at');
            return result.rows;
        } catch (error) {
            console.error('❌ Database error getting all users:', error.message);
            return [];
        }
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new UserService();
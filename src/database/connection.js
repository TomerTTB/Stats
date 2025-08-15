const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Get database configuration from environment
const dbType = process.env.DB_TYPE || 'sqlite';
const dbPath = process.env.DB_PATH || './src/data/nutrition_app.db';
const nodeEnv = process.env.NODE_ENV || 'development';

// Resolve absolute path for database
const resolvedDbPath = path.resolve(dbPath);

let db = null;
let dbAvailable = false;

// Initialize SQLite connection
function initializeDatabase() {
    try {
        // Ensure data directory exists
        const dbDir = path.dirname(resolvedDbPath);
        const fs = require('fs');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Use synchronous connection for immediate availability
        try {
            db = new sqlite3.Database(resolvedDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error('SQLite connection error:', err.message);
                    console.log('⚠️  Database not available, will use JSON fallback');
                    dbAvailable = false;
                } else {
                    console.log(`✅ Connected to SQLite database: ${resolvedDbPath}`);
                    dbAvailable = true;
                }
            });
            
            // Wait a moment for connection to establish
            setTimeout(() => {
                if (db) {
                    dbAvailable = true;
                }
            }, 100);
            
        } catch (dbError) {
            console.error('Database creation error:', dbError.message);
            dbAvailable = false;
        }
    } catch (error) {
        console.error('Database initialization error:', error.message);
        console.log('⚠️  Database not available, will use JSON fallback');
        dbAvailable = false;
    }
}

// Simple query function with fallback handling
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!dbAvailable || !db) {
            reject(new Error('Database not available'));
            return;
        }

        // Use db.run for INSERT, UPDATE, DELETE operations to get lastInsertRowid and changes
        if (sql.trim().toUpperCase().startsWith('INSERT') || 
            sql.trim().toUpperCase().startsWith('UPDATE') || 
            sql.trim().toUpperCase().startsWith('DELETE')) {
            
            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database error:', err.message);
                    reject(err);
                } else {
                    resolve({ 
                        rows: [], 
                        lastInsertRowid: this.lastID,
                        changes: this.changes 
                    });
                }
            });
        } else {
            // Use db.all for SELECT operations
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database error:', err.message);
                    reject(err);
                } else {
                    resolve({ rows });
                }
            });
        }
    });
};

// Check if database is available (with retry logic)
const isDatabaseAvailable = () => {
    // If not available, try to reinitialize once
    if (!dbAvailable && !db) {
        initializeDatabase();
        // Give it a moment to connect
        return new Promise(resolve => {
            setTimeout(() => resolve(dbAvailable), 200);
        });
    }
    return dbAvailable;
};

// Initialize on module load
initializeDatabase();

module.exports = {
    query,
    db,
    isDatabaseAvailable,
    dbPath: resolvedDbPath
};
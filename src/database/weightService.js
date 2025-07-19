const { query, isDatabaseAvailable } = require('./connection');

class WeightService {
    constructor() {
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        if (isDatabaseAvailable()) {
            console.log('⚖️  Weight service using SQLite database');
        } else {
            console.log('🚫 Weight database not available');
        }
    }

    // Get all weight entries for a user
    async getUserWeightEntries(userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return { entries: [] };
        }

        try {
            const result = await query(`
                SELECT * FROM user_weight 
                WHERE user_id = ? 
                ORDER BY date DESC
            `, [userId]);

            return {
                entries: result.rows.map(row => ({
                    id: row.id.toString(),
                    date: row.date,
                    weight: row.weight,
                    note: row.note || '',
                    createdAt: row.created_at
                }))
            };
        } catch (error) {
            console.error('❌ Database error getting weight entries:', error.message);
            return { entries: [] };
        }
    }

    // Add new weight entry
    async addWeightEntry(userId, entryData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            // Check if entry exists for this date
            const existing = await query(`
                SELECT id FROM user_weight 
                WHERE user_id = ? AND date = ?
            `, [userId, entryData.date]);

            if (existing.rows.length > 0) {
                // Update existing entry
                await query(`
                    UPDATE user_weight 
                    SET weight = ?, note = ?
                    WHERE user_id = ? AND date = ?
                `, [entryData.weight, entryData.note || '', userId, entryData.date]);

                console.log('✅ Weight entry updated in database for date:', entryData.date);
                return { id: existing.rows[0].id, ...entryData };
            } else {
                // Insert new entry
                const result = await query(`
                    INSERT INTO user_weight (user_id, date, weight, note)
                    VALUES (?, ?, ?, ?)
                `, [userId, entryData.date, entryData.weight, entryData.note || '']);

                console.log('✅ Weight entry added to database for date:', entryData.date);
                return { id: Date.now().toString(), ...entryData };
            }
        } catch (error) {
            console.error('❌ Database error adding weight entry:', error.message);
            return null;
        }
    }

    // Update weight entry
    async updateWeightEntry(userId, entryId, entryData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            await query(`
                UPDATE user_weight 
                SET date = ?, weight = ?, note = ?
                WHERE id = ? AND user_id = ?
            `, [entryData.date, entryData.weight, entryData.note || '', entryId, userId]);

            console.log('✅ Weight entry updated in database, ID:', entryId);
            return { id: entryId, ...entryData };
        } catch (error) {
            console.error('❌ Database error updating weight entry:', error.message);
            return null;
        }
    }

    // Delete weight entry
    async deleteWeightEntry(userId, entryId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            const result = await query(`
                DELETE FROM user_weight 
                WHERE id = ? AND user_id = ?
            `, [entryId, userId]);

            console.log('✅ Weight entry deleted from database, ID:', entryId);
            return true;
        } catch (error) {
            console.error('❌ Database error deleting weight entry:', error.message);
            return false;
        }
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new WeightService();
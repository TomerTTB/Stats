const { query, isDatabaseAvailable } = require('./connection');

class FoodService {
    constructor() {
        this.usingDatabase = false;
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        this.usingDatabase = isDatabaseAvailable();
        if (this.usingDatabase) {
            console.log('🗄️  Food service using SQLite database');
        } else {
            console.log('🚫 Database not available');
        }
    }

    // Get all foods
    async getAllFoods() {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return [];
        }

        try {
            const result = await query('SELECT * FROM foods ORDER BY item');
            return result.rows.map(row => ({
                item: row.item,
                amount: row.amount,
                calories: row.calories,
                carbs: row.carbs,
                protein: row.protein,
                proteinGeneral: row.protein_general,
                fat: row.fat
            }));
        } catch (error) {
            console.error('❌ Database error:', error.message);
            return [];
        }
    }

    // Search foods
    async searchFoods(searchTerm) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return [];
        }

        try {
            const result = await query(`
                SELECT * FROM foods 
                WHERE item LIKE ? 
                ORDER BY item
                LIMIT 50
            `, [`%${searchTerm}%`]);

            return result.rows.map(row => ({
                item: row.item,
                amount: row.amount,
                calories: row.calories,
                carbs: row.carbs,
                protein: row.protein,
                proteinGeneral: row.protein_general,
                fat: row.fat
            }));
        } catch (error) {
            console.error('❌ Database search error:', error.message);
            return [];
        }
    }

    // Add new food
    async addFood(foodData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            await query(`
                INSERT INTO foods (item, amount, calories, carbs, protein, protein_general, fat)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                foodData.item,
                foodData.amount,
                foodData.calories,
                foodData.carbs,
                foodData.protein,
                foodData.proteinGeneral,
                foodData.fat
            ]);
            console.log('✅ Food added to database:', foodData.item);
            return true;
        } catch (error) {
            console.error('❌ Database insert error:', error.message);
            return false;
        }
    }

    // Update food by index (for frontend compatibility)
    async updateFood(index, foodData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Get all foods to find the actual database ID
            const allFoods = await this.getAllFoods();
            if (index < 0 || index >= allFoods.length) {
                console.error('Invalid index for update:', index);
                return false;
            }

            // Get the food item at the specified index
            const targetFood = allFoods[index];

            // Update by matching the item name (since we don't have ID in the response)
            // This is a workaround for the current frontend implementation
            const result = await query(`
                UPDATE foods 
                SET item = ?, amount = ?, calories = ?, carbs = ?, protein = ?, protein_general = ?, fat = ?
                WHERE item = ? AND amount = ? AND calories = ?
            `, [
                foodData.item,
                foodData.amount,
                foodData.calories,
                foodData.carbs,
                foodData.protein,
                foodData.proteinGeneral,
                foodData.fat,
                targetFood.item,
                targetFood.amount,
                targetFood.calories
            ]);

            console.log('✅ Food updated in database:', foodData.item);
            return true;
        } catch (error) {
            console.error('❌ Database update error:', error.message);
            return false;
        }
    }

    // Delete food by index (for frontend compatibility)
    async deleteFood(index) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            // Get all foods to find the actual item to delete
            const allFoods = await this.getAllFoods();
            if (index < 0 || index >= allFoods.length) {
                console.error('Invalid index for delete:', index);
                return false;
            }

            // Get the food item at the specified index
            const targetFood = allFoods[index];

            // Delete by matching the item details
            const result = await query(`
                DELETE FROM foods 
                WHERE item = ? AND amount = ? AND calories = ?
            `, [
                targetFood.item,
                targetFood.amount,
                targetFood.calories
            ]);

            console.log('✅ Food deleted from database:', targetFood.item);
            return true;
        } catch (error) {
            console.error('❌ Database delete error:', error.message);
            return false;
        }
    }

    // Get current storage method
    getStorageMethod() {
        return isDatabaseAvailable() ? 'SQLite Database' : 'No Storage Available';
    }
}

module.exports = new FoodService();
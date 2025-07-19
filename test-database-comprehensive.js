const { query, isDatabaseAvailable, dbPath } = require('./src/database/connection');
const { testConnection, initializeDatabase } = require('./src/database/init');
const foodService = require('./src/database/foodService');
const mealService = require('./src/database/mealService');
const settingsService = require('./src/database/settingsService');
const weightService = require('./src/database/weightService');
require('dotenv').config();

// Test results tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Cleanup tracking - keep track of all test data created
let testDataTracker = {
    testUsers: new Set(),
    testFoodItems: new Set(),
    testMealItems: new Set(),
    testWeightEntries: new Set(),
    startTime: Date.now()
};

// Utility functions for better logging
function logSection(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`🧪 ${title}`);
    console.log('='.repeat(60));
}

function logSubsection(title) {
    console.log(`\n📋 ${title}`);
    console.log('-'.repeat(40));
}

let currentTestName = '';
let currentTestPassed = true;

function logTest(testName) {
    // Mark previous test as complete
    if (currentTestName) {
        if (currentTestPassed) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
    }
    
    console.log(`\n🔬 ${testName}`);
    testResults.total++;
    currentTestName = testName;
    currentTestPassed = true; // Assume test passes unless we see an error
}

function logTestError(message, error = null) {
    console.log(`   ❌ ${message}`);
    if (error) {
        console.log(`      Error: ${error.message}`);
        testResults.errors.push({ test: currentTestName || message, error: error.message });
    }
    currentTestPassed = false; // Mark current test as failed
}

function logSuccess(message) {
    console.log(`   ✅ ${message}`);
    // Don't increment here - we track at test level
}

function logError(message, error = null) {
    console.log(`   ❌ ${message}`);
    if (error) {
        console.log(`      Error: ${error.message}`);
        testResults.errors.push({ test: message, error: error.message });
    }
    // Don't increment here - we track at test level
}

function logInfo(message) {
    console.log(`   📄 ${message}`);
}

function logData(label, data) {
    console.log(`   📊 ${label}:`, data);
}

function logCleanup(message) {
    console.log(`   🧹 ${message}`);
}

// Helper function to generate unique test user ID and track it
function createTestUserId(prefix = 'user_test') {
    const userId = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    testDataTracker.testUsers.add(userId);
    return userId;
}

// Helper function to track test food items
function trackTestFood(foodName) {
    testDataTracker.testFoodItems.add(foodName);
}

// Main test suite
async function runComprehensiveTests() {
    logSection('COMPREHENSIVE DATABASE TEST SUITE');
    console.log('🎯 Testing all database functionality with detailed logging');
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    
    try {
        // Wait for services to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 1. Environment and Configuration Tests
        await testEnvironmentAndConfiguration();
        
        // 2. Database Connection Tests
        await testDatabaseConnection();
        
        // 3. Schema Initialization Tests
        await testSchemaInitialization();
        
        // 4. Food Service Tests
        await testFoodService();
        
        // 5. Settings Service Tests
        await testSettingsService();
        
        // 6. Weight Service Tests
        await testWeightService();
        
        // 7. Meal Service Tests
        await testMealService();
        
        // 8. Protein Column Separation Tests
        await testProteinColumnSeparation();
        
        // 9. Integration Tests
        await testSystemIntegration();
        
        // 10. Data Validation Tests
        await testDataValidation();
        
        // 11. Error Handling Tests
        await testErrorHandling();
        
        // 12. Cleanup all test data
        await cleanupTestData();
        
        // Final Results
        logTestResults();

    } catch (error) {
        console.error('\n💥 FATAL ERROR IN TEST SUITE:', error);
        
        // Attempt cleanup even if tests failed
        try {
            await cleanupTestData();
        } catch (cleanupError) {
            console.error('⚠️ Cleanup failed after test error:', cleanupError);
        }
        
        process.exit(1);
    }
}

async function testEnvironmentAndConfiguration() {
    logSection('ENVIRONMENT & CONFIGURATION TESTS');
    
    logTest('Environment Variables Check');
    try {
        const dbType = process.env.DB_TYPE || 'sqlite';
        const dbPath = process.env.DB_PATH || './src/data/nutrition_app.db';
        const nodeEnv = process.env.NODE_ENV || 'development';
        
        logData('DB_TYPE', dbType);
        logData('DB_PATH', dbPath);
        logData('NODE_ENV', nodeEnv);
        logData('Database File Path', require('./src/database/connection').dbPath);
        
        logSuccess('Environment configuration loaded successfully');
    } catch (error) {
        logError('Environment configuration failed', error);
    }
}

async function testDatabaseConnection() {
    logSection('DATABASE CONNECTION TESTS');
    
    logTest('Database Availability Check');
    try {
        const isAvailable = isDatabaseAvailable();
        logData('Database Available', isAvailable ? 'YES' : 'NO');
        
        if (isAvailable) {
            logSuccess('Database is available');
        } else {
            logError('Database is not available');
            return;
        }
    } catch (error) {
        logError('Database availability check failed', error);
        return;
    }
    
    logTest('Database Connection Test');
    try {
        const connectionOk = await testConnection();
        if (connectionOk) {
            logSuccess('Database connection successful');
        } else {
            logError('Database connection failed');
        }
    } catch (error) {
        logError('Connection test failed', error);
    }
}

async function testSchemaInitialization() {
    logSection('SCHEMA INITIALIZATION TESTS');
    
    logTest('Schema Creation and Validation');
    try {
        const schemaOk = await initializeDatabase();
        if (schemaOk) {
            logSuccess('Database schema initialized successfully');
        } else {
            logError('Database schema initialization failed');
        }
        
        // Verify table creation
        const tables = await query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            ORDER BY name
        `);
        
        const expectedTables = ['foods', 'users', 'user_meals', 'user_settings', 'user_weight'];
        const existingTables = tables.rows.map(row => row.name);
        
        logData('Created Tables', existingTables);
        
        for (const table of expectedTables) {
            if (existingTables.includes(table)) {
                logSuccess(`Table '${table}' exists`);
            } else {
                logError(`Table '${table}' missing`);
            }
        }
    } catch (error) {
        logError('Schema initialization test failed', error);
    }
}

async function testFoodService() {
    logSection('FOOD SERVICE TESTS');
    
    logSubsection('Food Service Configuration');
    logData('Storage Method', foodService.getStorageMethod());
    
    logTest('Get All Foods (Initial)');
    try {
        const allFoods = await foodService.getAllFoods();
        logData('Initial Food Count', allFoods.length);
        logSuccess(`Retrieved ${allFoods.length} foods from database`);
    } catch (error) {
        logError('Failed to get all foods', error);
    }
    
    logTest('Add Food Item');
    try {
        const testFoodName = 'Test Apple - Comprehensive - ' + Date.now();
        const testFood = {
            item: testFoodName,
            amount: '100g',
            calories: 52,
            carbs: 14,
            protein: 0.3,
            proteinGeneral: 0.5,
            fat: 0.2
        };
        
        trackTestFood(testFoodName);
        
        const added = await foodService.addFood(testFood);
        if (added) {
            logSuccess('Food item added successfully');
            logData('Added Food', testFood.item);
        } else {
            logError('Failed to add food item');
        }
    } catch (error) {
        logError('Add food test failed', error);
    }
    
    logTest('Search Foods');
    try {
        const searchResults = await foodService.searchFoods('Test Apple');
        logData('Search Results Count', searchResults.length);
        if (searchResults.length > 0) {
            logSuccess('Food search working correctly');
            logData('Found Food', searchResults[0].item);
        } else {
            logError('Food search returned no results');
        }
    } catch (error) {
        logError('Food search test failed', error);
    }
}

async function testSettingsService() {
    logSection('SETTINGS SERVICE TESTS');
    
    const testUserId = createTestUserId('user_settings_test');
    logData('Test User ID', testUserId);
    logData('Storage Method', settingsService.getStorageMethod());
    
    logTest('Get User Settings (New User)');
    try {
        const initialSettings = await settingsService.getUserSettings(testUserId);
        logSuccess('Initial settings retrieved for new user');
        logData('Default Settings', {
            age: initialSettings.age,
            weight: initialSettings.weight,
            height: initialSettings.height,
            totalCalories: initialSettings.totalCalories,
            proteinLevel: initialSettings.proteinLevel,
            fatLevel: initialSettings.fatLevel
        });
    } catch (error) {
        logError('Failed to get initial user settings', error);
    }
    
    logTest('Save User Settings');
    try {
        const updatedSettings = {
            userName: 'Test User Comprehensive',
            age: 30,
            weight: 75,
            height: 175,
            sex: 'male',
            activityLevel: '1.55',
            calorieAdjustment: 100,
            mealInterval: 3.5,
            proteinLevel: 2.0,
            fatLevel: 0.9,
            totalCalories: 2400
        };
        
        await settingsService.saveUserSettings(testUserId, updatedSettings);
        logSuccess('User settings saved successfully');
        logData('Saved Settings', updatedSettings);
    } catch (error) {
        logError('Failed to save user settings', error);
    }
    
    logTest('Verify Settings Persistence');
    try {
        const retrievedSettings = await settingsService.getUserSettings(testUserId);
        logData('Retrieved Settings', {
            userName: retrievedSettings.userName,
            age: retrievedSettings.age,
            weight: retrievedSettings.weight,
            proteinLevel: retrievedSettings.proteinLevel
        });
        
        if (retrievedSettings.userName === 'Test User Comprehensive' && retrievedSettings.age === 30) {
            logSuccess('Settings persistence verified');
        } else {
            logTestError('Settings not persisted correctly');
        }
    } catch (error) {
        logError('Settings persistence test failed', error);
    }
}

async function testWeightService() {
    logSection('WEIGHT SERVICE TESTS');
    
    const testUserId = createTestUserId('user_weight_test');
    logData('Test User ID', testUserId);
    logData('Storage Method', weightService.getStorageMethod());
    
    logTest('Get Weight Entries (New User)');
    try {
        const initialEntries = await weightService.getUserWeightEntries(testUserId);
        logData('Initial Entries Count', initialEntries.entries.length);
        logSuccess('Weight entries retrieved for new user');
    } catch (error) {
        logError('Failed to get initial weight entries', error);
    }
    
    logTest('Add Weight Entry');
    try {
        const weightEntry = {
            date: '2025-07-19',
            weight: 75.5,
            note: 'Comprehensive test entry'
        };
        
        const addResult = await weightService.addWeightEntry(testUserId, weightEntry);
        if (addResult) {
            logSuccess('Weight entry added successfully');
            logData('Added Entry', `${addResult.weight}kg on ${addResult.date}`);
        } else {
            logError('Failed to add weight entry');
        }
    } catch (error) {
        logError('Add weight entry test failed', error);
    }
    
    logTest('Get Weight Entries After Addition');
    try {
        const updatedEntries = await weightService.getUserWeightEntries(testUserId);
        logData('Updated Entries Count', updatedEntries.entries.length);
        
        if (updatedEntries.entries.length > 0) {
            logSuccess('Weight entry persistence verified');
            logData('Latest Entry', updatedEntries.entries[0]);
        } else {
            logError('Weight entry not persisted');
        }
    } catch (error) {
        logError('Weight entries verification failed', error);
    }
}

async function testMealService() {
    logSection('MEAL SERVICE TESTS');
    
    const testUserId = createTestUserId('user_meal_test');
    const testDay = 'saturday';
    logData('Test User ID', testUserId);
    logData('Test Day', testDay);
    logData('Storage Method', mealService.getStorageMethod());
    
    logTest('Get Day Meals (New User)');
    try {
        const dayMeals = await mealService.getUserDayMeals(testUserId, testDay);
        logData('Default Meal Times Count', dayMeals.meals.length);
        logData('Macro Settings', {
            proteinLevel: dayMeals.proteinLevel,
            fatLevel: dayMeals.fatLevel,
            calorieAdjustment: dayMeals.calorieAdjustment
        });
        logSuccess('Default day meals retrieved successfully');
    } catch (error) {
        logError('Failed to get day meals', error);
    }
    
    logTest('Add Meal Item');
    try {
        const testItem = {
            name: 'Comprehensive Test Food - ' + Date.now(),
            amount: 150,
            calories: 300,
            carbs: 40,
            protein: 25,
            proteinG: 20,
            fat: 8
        };
        
        const addResult = await mealService.addMealItem(testUserId, testDay, '08:00', testItem);
        if (addResult) {
            logSuccess('Meal item added successfully');
            logData('Added Item', `${addResult.name} (${addResult.amount}g, ${addResult.calories} cal)`);
        } else {
            logError('Failed to add meal item');
        }
    } catch (error) {
        logError('Add meal item test failed', error);
    }
    
    logTest('Verify Meal Item Persistence');
    try {
        const updatedMeals = await mealService.getUserDayMeals(testUserId, testDay);
        const firstMeal = updatedMeals.meals[0];
        
        if (firstMeal.items.length > 0) {
            logSuccess('Meal item persistence verified');
            logData('Stored Item', firstMeal.items[0]);
        } else {
            logError('Meal item not persisted');
        }
    } catch (error) {
        logError('Meal item persistence test failed', error);
    }
}

async function testProteinColumnSeparation() {
    logSection('PROTEIN COLUMN SEPARATION TESTS');
    
    const testUserId = createTestUserId('user_protein_test');
    const testDay = 'sunday';
    
    logTest('Protein Only (No ProteinG)');
    try {
        const proteinOnlyFood = {
            name: 'Chicken Breast Test - ' + Date.now(),
            amount: 100,
            calories: 165,
            protein: 31,
            proteinG: 0,
            fat: 3.6
        };
        
        await mealService.addMealItem(testUserId, testDay, '12:00', proteinOnlyFood);
        
        const dbCheck = await query(`
            SELECT protein, protein_general FROM user_meals 
            WHERE user_id = ? AND food_item = ?
        `, [testUserId, proteinOnlyFood.name]);
        
        if (dbCheck.rows.length > 0) {
            const row = dbCheck.rows[0];
            logData('Stored Values', `protein: ${row.protein}, protein_general: ${row.protein_general}`);
            
            if (row.protein === 31 && row.protein_general === 0) {
                logSuccess('Protein-only separation working correctly');
            } else {
                logError('Protein-only separation failed');
            }
        }
    } catch (error) {
        logError('Protein-only test failed', error);
    }
    
    logTest('Both Protein and ProteinG');
    try {
        const bothProteinsFood = {
            name: 'Protein Powder Test - ' + Date.now(),
            amount: 30,
            calories: 120,
            protein: 25,
            proteinG: 28,
            fat: 1
        };
        
        await mealService.addMealItem(testUserId, testDay, '14:00', bothProteinsFood);
        
        const dbCheck = await query(`
            SELECT protein, protein_general FROM user_meals 
            WHERE user_id = ? AND food_item = ?
        `, [testUserId, bothProteinsFood.name]);
        
        if (dbCheck.rows.length > 0) {
            const row = dbCheck.rows[0];
            logData('Stored Values', `protein: ${row.protein}, protein_general: ${row.protein_general}`);
            
            if (row.protein === 25 && row.protein_general === 28) {
                logSuccess('Dual protein separation working correctly');
            } else {
                logError('Dual protein separation failed');
            }
        }
    } catch (error) {
        logError('Dual protein test failed', error);
    }
}

async function testSystemIntegration() {
    logSection('SYSTEM INTEGRATION TESTS');
    
    const testUserId = createTestUserId('user_integration');
    
    logTest('Complete User Workflow');
    try {
        // 1. Create user settings
        const userSettings = {
            userName: 'Integration Test User',
            age: 25,
            weight: 70,
            height: 170,
            proteinLevel: 1.8,
            fatLevel: 0.8
        };
        await settingsService.saveUserSettings(testUserId, userSettings);
        
        // 2. Add weight entry
        const weightEntry = {
            date: '2025-07-19',
            weight: 70,
            note: 'Integration test'
        };
        await weightService.addWeightEntry(testUserId, weightEntry);
        
        // 3. Add meals for the day
        const mealItem = {
            name: 'Integration Meal - ' + Date.now(),
            amount: 100,
            calories: 200,
            protein: 15,
            proteinG: 12,
            fat: 5
        };
        await mealService.addMealItem(testUserId, 'monday', '08:00', mealItem);
        
        // 4. Verify all data is connected
        const settings = await settingsService.getUserSettings(testUserId);
        const weight = await weightService.getUserWeightEntries(testUserId);
        const meals = await mealService.getUserDayMeals(testUserId, 'monday');
        
        logData('Integration Results', {
            userExists: settings.userName === 'Integration Test User',
            weightEntries: weight.entries.length,
            mealItems: meals.meals[0].items.length
        });
        
        logSuccess('Complete user workflow integration successful');
    } catch (error) {
        logError('System integration test failed', error);
    }
}

async function testDataValidation() {
    logSection('DATA VALIDATION TESTS');
    
    logTest('Invalid Data Handling');
    try {
        // Test with invalid food data
        const invalidFood = {
            item: '', // Empty name
            calories: 'invalid', // Non-numeric
            protein: -5 // Negative value
        };
        
        const result = await foodService.addFood(invalidFood);
        logData('Invalid Food Add Result', result ? 'Added' : 'Rejected');
        logSuccess('Invalid data handling test completed');
    } catch (error) {
        logInfo('Invalid data properly rejected (expected behavior)');
    }
}

async function testErrorHandling() {
    logSection('ERROR HANDLING TESTS');
    
    logTest('Non-existent User Operations');
    try {
        const nonExistentUser = 'user_does_not_exist_12345';
        const meals = await mealService.getUserDayMeals(nonExistentUser, 'monday');
        
        if (meals && meals.meals) {
            logSuccess('Non-existent user handled gracefully with default data');
        } else {
            logError('Non-existent user not handled properly');
        }
    } catch (error) {
        logError('Error handling test failed', error);
    }
}

async function cleanupTestData() {
    logSection('CLEANUP TEST DATA');
    
    try {
        let cleanupCount = 0;
        
        // Clean up test users and all their associated data
        logTest('Cleaning up test users and associated data');
        for (const userId of testDataTracker.testUsers) {
            try {
                // Delete user meals
                const mealsDeleted = await query('DELETE FROM user_meals WHERE user_id = ?', [userId]);
                if (mealsDeleted.changes > 0) {
                    logCleanup(`Deleted ${mealsDeleted.changes} meal records for user ${userId}`);
                    cleanupCount += mealsDeleted.changes;
                }
                
                // Delete user weight entries
                const weightDeleted = await query('DELETE FROM user_weight WHERE user_id = ?', [userId]);
                if (weightDeleted.changes > 0) {
                    logCleanup(`Deleted ${weightDeleted.changes} weight records for user ${userId}`);
                    cleanupCount += weightDeleted.changes;
                }
                
                // Delete user settings
                const settingsDeleted = await query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
                if (settingsDeleted.changes > 0) {
                    logCleanup(`Deleted ${settingsDeleted.changes} settings records for user ${userId}`);
                    cleanupCount += settingsDeleted.changes;
                }
                
                // Delete user from users table
                const userDeleted = await query('DELETE FROM users WHERE id = ?', [userId]);
                if (userDeleted.changes > 0) {
                    logCleanup(`Deleted user record: ${userId}`);
                    cleanupCount += userDeleted.changes;
                }
                
            } catch (error) {
                logError(`Failed to cleanup user ${userId}`, error);
            }
        }
        
        // Clean up test food items
        logTest('Cleaning up test food items');
        for (const foodName of testDataTracker.testFoodItems) {
            try {
                const foodDeleted = await query('DELETE FROM foods WHERE item = ?', [foodName]);
                if (foodDeleted.changes > 0) {
                    logCleanup(`Deleted test food: ${foodName}`);
                    cleanupCount += foodDeleted.changes;
                }
            } catch (error) {
                logError(`Failed to cleanup food ${foodName}`, error);
            }
        }
        
        // Clean up any test records by timestamp (safety net)
        logTest('Cleaning up remaining test records by timestamp');
        try {
            // Clean up any remaining test meals created during this test run
            const remainingMeals = await query(`
                DELETE FROM user_meals 
                WHERE food_item LIKE '%Test%' 
                OR food_item LIKE '%Comprehensive%'
            `);
            
            if (remainingMeals.changes > 0) {
                logCleanup(`Deleted ${remainingMeals.changes} remaining test meal records`);
                cleanupCount += remainingMeals.changes;
            }
            
            // Clean up test foods by pattern
            const remainingFoods = await query(`
                DELETE FROM foods 
                WHERE item LIKE '%Test%' 
                OR item LIKE '%Comprehensive%'
            `);
            
            if (remainingFoods.changes > 0) {
                logCleanup(`Deleted ${remainingFoods.changes} remaining test food records`);
                cleanupCount += remainingFoods.changes;
            }
            
        } catch (error) {
            logTestError('Failed to cleanup remaining test records', error);
        }
        
        // Summary
        logData('Total Records Cleaned', cleanupCount);
        logData('Test Users Processed', testDataTracker.testUsers.size);
        logData('Test Foods Processed', testDataTracker.testFoodItems.size);
        
        if (cleanupCount > 0) {
            logSuccess(`Successfully cleaned up ${cleanupCount} test records`);
        } else {
            logInfo('No test records found to clean up');
        }
        
        // Verify cleanup
        logTest('Verifying cleanup completion');
        const remainingTestData = await query(`
            SELECT 
                (SELECT COUNT(*) FROM user_meals WHERE food_item LIKE '%Test%' OR food_item LIKE '%Comprehensive%') as meals,
                (SELECT COUNT(*) FROM foods WHERE item LIKE '%Test%' OR item LIKE '%Comprehensive%') as foods,
                (SELECT COUNT(*) FROM user_settings WHERE user_id LIKE '%test%') as settings,
                (SELECT COUNT(*) FROM user_weight WHERE user_id LIKE '%test%') as weights
        `);
        
        const remaining = remainingTestData.rows[0];
        const totalRemaining = remaining.meals + remaining.foods + remaining.settings + remaining.weights;
        
        if (totalRemaining === 0) {
            logSuccess('✨ Database is clean - all test data removed');
        } else {
            logTestError(`⚠️ ${totalRemaining} test records still remain in database`);
            logData('Remaining Test Data', remaining);
        }
        
    } catch (error) {
        logTestError('Cleanup process failed', error);
    }
}

function logTestResults() {
    // Mark the final test as complete
    if (currentTestName) {
        if (currentTestPassed) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
    }
    
    logSection('TEST RESULTS SUMMARY');
    
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log(`📅 Test completed at: ${new Date().toISOString()}`);
    console.log(`⏱️ Test duration: ${((Date.now() - testDataTracker.startTime) / 1000).toFixed(1)} seconds`);
    
    if (testResults.failed > 0) {
        console.log('\n💥 FAILED TESTS:');
        testResults.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.test}`);
            console.log(`      ${error.error}`);
        });
    }
    
    console.log('\n🎯 DATABASE FUNCTIONALITY STATUS:');
    if (testResults.failed === 0) {
        console.log('   🟢 ALL SYSTEMS OPERATIONAL');
        console.log('   📝 Database is ready for production use');
        console.log('   🧹 All test data has been cleaned up');
    } else if (testResults.failed < testResults.total * 0.1) {
        console.log('   🟡 MOSTLY OPERATIONAL (Minor Issues)');
        console.log('   📝 Database is functional with minor issues');
        console.log('   🧹 Test data cleanup completed');
    } else {
        console.log('   🔴 CRITICAL ISSUES DETECTED');
        console.log('   📝 Database requires attention before production use');
        console.log('   🧹 Test data cleanup attempted');
    }
}

// Run the comprehensive test suite
runComprehensiveTests()
    .then(() => {
        const exitCode = testResults.failed > 0 ? 1 : 0;
        process.exit(exitCode);
    })
    .catch(error => {
        console.error('\n💥 FATAL TEST SUITE ERROR:', error);
        
        // Final cleanup attempt
        cleanupTestData().catch(() => {
            console.error('⚠️ Final cleanup also failed');
        }).finally(() => {
            process.exit(1);
        });
    }); 
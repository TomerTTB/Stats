/**
 * Data generation utilities for creating test data
 */

/**
 * Generate random string of specified length
 * @param {number} length - Length of string to generate
 * @param {string} charset - Character set to use
 */
function generateRandomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate random number within range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Number of decimal places
 */
function generateRandomNumber(min = 0, max = 100, decimals = 0) {
  const random = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(random.toFixed(decimals)) : Math.floor(random);
}

/**
 * Generate random email address
 * @param {string} domain - Email domain (optional)
 */
function generateRandomEmail(domain = 'test.com') {
  const username = generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
  return `${username}@${domain}`;
}

/**
 * Generate random phone number
 * @param {string} format - Phone number format
 */
function generateRandomPhone(format = 'US') {
  if (format === 'US') {
    const area = generateRandomNumber(200, 999);
    const exchange = generateRandomNumber(200, 999);
    const number = generateRandomNumber(1000, 9999);
    return `(${area}) ${exchange}-${number}`;
  }
  return generateRandomString(10, '0123456789');
}

/**
 * Generate random date within range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
function generateRandomDate(startDate = new Date(2020, 0, 1), endDate = new Date()) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

/**
 * Generate test user data
 * @param {Object} overrides - Properties to override
 */
function generateTestUser(overrides = {}) {
  const timestamp = Date.now();
  const randomId = generateRandomString(6);
  
  return {
    username: `testuser_${randomId}_${timestamp}`,
    email: generateRandomEmail(),
    password: 'TestPassword123!',
    name: 'Test User', // API expects 'name' field
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: generateRandomDate(new Date(1970, 0, 1), new Date(2000, 11, 31)),
    phone: generateRandomPhone(),
    ...overrides
  };
}

/**
 * Generate test food data
 * @param {Object} overrides - Properties to override
 */
function generateTestFood(overrides = {}) {
  const foodNames = [
    'Apple', 'Banana', 'Orange', 'Chicken Breast', 'Salmon', 'Rice', 'Pasta',
    'Broccoli', 'Spinach', 'Almonds', 'Greek Yogurt', 'Oatmeal', 'Eggs',
    'Sweet Potato', 'Quinoa', 'Avocado', 'Blueberries', 'Tuna', 'Turkey'
  ];
  
  const randomName = foodNames[Math.floor(Math.random() * foodNames.length)];
  const randomId = generateRandomString(6);
  
  return {
    name: `${randomName} ${randomId}`,
    calories: generateRandomNumber(50, 500),
    protein: generateRandomNumber(1, 50, 1),
    carbs: generateRandomNumber(0, 80, 1),
    fat: generateRandomNumber(0, 30, 1),
    fiber: generateRandomNumber(0, 15, 1),
    sugar: generateRandomNumber(0, 25, 1),
    sodium: generateRandomNumber(0, 1000),
    servingSize: '100g',
    servingUnit: 'grams',
    category: 'Test Food',
    ...overrides
  };
}

/**
 * Generate test meal data
 * @param {Object} overrides - Properties to override
 */
function generateTestMeal(overrides = {}) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const randomMealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
  
  return {
    date: new Date().toISOString().split('T')[0],
    mealType: randomMealType,
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    ...overrides
  };
}

/**
 * Generate test weight entry data
 * @param {Object} overrides - Properties to override
 */
function generateTestWeightEntry(overrides = {}) {
  return {
    date: new Date().toISOString().split('T')[0],
    weight: generateRandomNumber(120, 250, 1),
    unit: 'lbs',
    notes: `Test weight entry ${generateRandomString(6)}`,
    ...overrides
  };
}

/**
 * Generate test nutrition goals
 * @param {Object} overrides - Properties to override
 */
function generateTestNutritionGoals(overrides = {}) {
  return {
    calorieGoal: generateRandomNumber(1500, 3000),
    proteinGoal: generateRandomNumber(80, 200),
    carbGoal: generateRandomNumber(150, 400),
    fatGoal: generateRandomNumber(50, 150),
    fiberGoal: generateRandomNumber(20, 40),
    sugarGoal: generateRandomNumber(25, 50),
    sodiumGoal: generateRandomNumber(1500, 2500),
    ...overrides
  };
}

/**
 * Generate array of test data
 * @param {Function} generator - Generator function
 * @param {number} count - Number of items to generate
 * @param {Object} overrides - Properties to override for all items
 */
function generateTestDataArray(generator, count = 5, overrides = {}) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(generator(overrides));
  }
  return data;
}

/**
 * Generate test data with relationships
 * @param {Object} config - Configuration for data generation
 */
function generateRelatedTestData(config = {}) {
  const {
    userCount = 1,
    foodsPerUser = 10,
    mealsPerUser = 7,
    weightsPerUser = 5
  } = config;
  
  const users = generateTestDataArray(generateTestUser, userCount);
  const data = {};
  
  users.forEach(user => {
    data[user.username] = {
      user,
      foods: generateTestDataArray(generateTestFood, foodsPerUser),
      meals: generateTestDataArray(generateTestMeal, mealsPerUser),
      weights: generateTestDataArray(generateTestWeightEntry, weightsPerUser),
      goals: generateTestNutritionGoals()
    };
  });
  
  return data;
}

/**
 * Generate edge case test data
 */
function generateEdgeCaseData() {
  return {
    // Empty/null values
    emptyUser: {
      username: '',
      email: '',
      password: ''
    },
    
    // Boundary values
    minFood: {
      name: 'Min Food',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    
    maxFood: {
      name: 'Max Food',
      calories: 9999,
      protein: 999,
      carbs: 999,
      fat: 999
    },
    
    // Special characters
    specialCharUser: {
      username: 'test@#$%^&*()',
      email: 'test+special@domain.com',
      password: 'P@ssw0rd!@#$%'
    },
    
    // Long strings
    longStringFood: {
      name: generateRandomString(255),
      calories: 100,
      protein: 10,
      carbs: 15,
      fat: 5
    },
    
    // Future/past dates
    futureMeal: {
      date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mealType: 'breakfast'
    },
    
    pastMeal: {
      date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mealType: 'dinner'
    }
  };
}

/**
 * Generate test data for specific scenarios
 * @param {string} scenario - Scenario name
 */
function generateScenarioData(scenario) {
  const scenarios = {
    'new-user-registration': () => ({
      user: generateTestUser(),
      goals: generateTestNutritionGoals()
    }),
    
    'daily-meal-tracking': () => ({
      user: generateTestUser(),
      foods: generateTestDataArray(generateTestFood, 15),
      meals: [
        generateTestMeal({ mealType: 'breakfast' }),
        generateTestMeal({ mealType: 'lunch' }),
        generateTestMeal({ mealType: 'dinner' }),
        generateTestMeal({ mealType: 'snack' })
      ]
    }),
    
    'weight-tracking': () => ({
      user: generateTestUser(),
      weights: generateTestDataArray(generateTestWeightEntry, 30)
        .map((weight, index) => ({
          ...weight,
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
    }),
    
    'food-database-management': () => ({
      user: generateTestUser(),
      foods: generateTestDataArray(generateTestFood, 50)
    }),
    
    'nutrition-reporting': () => ({
      user: generateTestUser(),
      foods: generateTestDataArray(generateTestFood, 20),
      meals: generateTestDataArray(generateTestMeal, 30)
        .map((meal, index) => ({
          ...meal,
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })),
      goals: generateTestNutritionGoals()
    })
  };
  
  const generator = scenarios[scenario];
  if (!generator) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }
  
  return generator();
}

module.exports = {
  generateRandomString,
  generateRandomNumber,
  generateRandomEmail,
  generateRandomPhone,
  generateRandomDate,
  generateTestUser,
  generateTestFood,
  generateTestMeal,
  generateTestWeightEntry,
  generateTestNutritionGoals,
  generateTestDataArray,
  generateRelatedTestData,
  generateEdgeCaseData,
  generateScenarioData
};
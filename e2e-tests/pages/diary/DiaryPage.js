/**
 * DiaryPage class for meal tracking functionality
 * Handles day navigation, meal section interactions, food search and selection,
 * and nutrition calculation verification methods
 */

const BasePage = require('../base/BasePage');

class DiaryPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Page selectors
    this.selectors = {
      // Date navigation
      prevDayButton: '#prevDay',
      nextDayButton: '#nextDay',
      dayButtons: '.days-of-week button[data-day]',
      
      // Stats/nutrition display
      proteinLevelInput: '#proteinLevelInput',
      proteinPercentage: '#proteinPercentage',
      proteinGrams: '#proteinGrams',
      proteinCalories: '#proteinCalories',
      fatLevelInput: '#fatLevelInput',
      fatPercentage: '#fatPercentage',
      fatGrams: '#fatGrams',
      fatCalories: '#fatCalories',
      carboPercentage: '#carboPercentage',
      carboGrams: '#carboGrams',
      carboCalories: '#carboCalories',
      calorieAdjustmentInput: '#calorieAdjustmentInput',
      goalCalories: '#goalCalories',
      
      // Meals container
      mealsContainer: '#mealsContainer',
      mealSections: '.meal-section',
      mealHeaders: '.meal-header',
      mealTables: '.meal-table',
      
      // Meal-specific selectors
      mealTimeInput: '.meal-time',
      copyMealButton: '.copy-meal-btn',
      pasteMealButton: '.paste-meal-btn',
      
      // Food item rows
      foodItemRows: '.meal-table tbody tr',
      foodSearchInputs: 'input[placeholder="Search food..."]',
      foodSearchResults: '.food-search-results',
      foodSearchItems: '.food-search-item',
      
      // Table columns
      itemColumn: 'td:nth-child(1) input',
      amountColumn: 'td:nth-child(2) input',
      caloriesColumn: 'td:nth-child(3) input',
      carbsColumn: 'td:nth-child(4) input',
      proteinColumn: 'td:nth-child(5) input',
      fatColumn: 'td:nth-child(6) input',
      proteinGColumn: 'td:nth-child(7) input',
      
      // Totals
      totalCalories: '.total-calories',
      totalCarbs: '.total-carbs',
      totalProtein: '.total-protein',
      totalFat: '.total-fat',
      totalProteinG: '.total-protein-g',
      
      // Error display
      errorDisplay: '#errorDisplay'
    };
  }

  /**
   * Navigate to diary page
   */
  async navigateToDiary() {
    await this.navigate('/diary.html');
    await this.waitForPageLoad();
    await this.waitForElement(this.selectors.mealsContainer);
  }

  /**
   * Check if currently on diary page
   */
  async isOnDiaryPage() {
    const currentUrl = this.getCurrentUrl();
    return currentUrl.includes('diary.html');
  }

  /**
   * Wait for diary page to be fully loaded
   */
  async waitForDiaryPageLoad() {
    await this.waitForElement(this.selectors.mealsContainer);
    await this.waitForElement(this.selectors.mealSections);
    
    // Wait for meal tables to be populated
    await this.page.waitForFunction(() => {
      const mealSections = document.querySelectorAll('.meal-section');
      return mealSections.length >= 6; // Should have 6 meals
    });
  }

  // Day navigation methods

  /**
   * Click previous day button
   */
  async clickPreviousDay() {
    await this.clickElement(this.selectors.prevDayButton);
    await this.waitForPageLoad();
  }

  /**
   * Click next day button
   */
  async clickNextDay() {
    await this.clickElement(this.selectors.nextDayButton);
    await this.waitForPageLoad();
  }

  /**
   * Click specific day of week button
   * @param {number} dayIndex - Day index (0=Sunday, 1=Monday, etc.)
   */
  async clickDayOfWeek(dayIndex) {
    const dayButton = `${this.selectors.dayButtons}[data-day="${dayIndex}"]`;
    await this.clickElement(dayButton);
    await this.waitForPageLoad();
  }

  /**
   * Get currently selected day
   */
  async getCurrentSelectedDay() {
    const activeButton = await this.page.locator(`${this.selectors.dayButtons}.active`);
    if (await activeButton.count() > 0) {
      return await activeButton.getAttribute('data-day');
    }
    return null;
  }

  // Meal section interaction methods

  /**
   * Get meal section by meal ID
   * @param {number} mealId - Meal ID (1-6)
   */
  getMealSection(mealId) {
    return this.page.locator(`${this.selectors.mealSections}[data-meal-id="${mealId}"]`);
  }

  /**
   * Get meal table by meal ID
   * @param {number} mealId - Meal ID (1-6)
   */
  getMealTable(mealId) {
    return this.getMealSection(mealId).locator(this.selectors.mealTables);
  }

  /**
   * Set meal time
   * @param {number} mealId - Meal ID (1-6)
   * @param {string} time - Time in HH:MM format
   */
  async setMealTime(mealId, time) {
    const mealSection = this.getMealSection(mealId);
    const timeInput = mealSection.locator(this.selectors.mealTimeInput);
    await timeInput.fill(time);
    await timeInput.press('Enter');
  }

  /**
   * Get meal time
   * @param {number} mealId - Meal ID (1-6)
   */
  async getMealTime(mealId) {
    const mealSection = this.getMealSection(mealId);
    const timeInput = mealSection.locator(this.selectors.mealTimeInput);
    return await timeInput.inputValue();
  }

  /**
   * Copy meal
   * @param {number} mealId - Meal ID to copy
   */
  async copyMeal(mealId) {
    const mealSection = this.getMealSection(mealId);
    const copyButton = mealSection.locator(this.selectors.copyMealButton);
    await copyButton.click();
  }

  /**
   * Paste meal
   * @param {number} mealId - Meal ID to paste to
   */
  async pasteMeal(mealId) {
    const mealSection = this.getMealSection(mealId);
    const pasteButton = mealSection.locator(this.selectors.pasteMealButton);
    await pasteButton.click();
  }

  /**
   * Check if paste button is enabled for a meal
   * @param {number} mealId - Meal ID
   */
  async isPasteButtonEnabled(mealId) {
    const mealSection = this.getMealSection(mealId);
    const pasteButton = mealSection.locator(this.selectors.pasteMealButton);
    return await pasteButton.isEnabled();
  }

  // Food search and selection functionality

  /**
   * Search for food in a specific meal and row
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   * @param {string} searchTerm - Food search term
   */
  async searchFood(mealId, rowIndex, searchTerm) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    const targetRow = foodRows.nth(rowIndex);
    const searchInput = targetRow.locator(this.selectors.itemColumn);
    
    await searchInput.fill(searchTerm);
    
    // Wait a moment for search to process
    await this.page.waitForTimeout(500);
    
    // For empty or non-existent searches, don't wait for results
    if (!searchTerm.trim() || searchTerm === 'nonexistentfood12345') {
      return;
    }
    
    // Wait for search results to appear in the specific row (with shorter timeout)
    try {
      await this.page.waitForFunction(
        ({ mealId, rowIndex }) => {
          const mealSection = document.querySelector(`[data-meal-id="${mealId}"]`);
          if (!mealSection) return false;
          
          const rows = mealSection.querySelectorAll('tbody tr');
          if (!rows[rowIndex]) return false;
          
          const resultsDropdown = rows[rowIndex].querySelector('.food-search-results');
          return resultsDropdown && resultsDropdown.children.length > 0 && resultsDropdown.style.display !== 'none';
        },
        { mealId, rowIndex },
        { timeout: 3000 }
      );
    } catch (error) {
      // If no results appear within timeout, that's okay for some test cases
      console.log(`No search results appeared for "${searchTerm}" in meal ${mealId}, row ${rowIndex}`);
    }
  }

  /**
   * Select food from search results
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   * @param {number} resultIndex - Search result index (0-based)
   */
  async selectFoodFromResults(mealId, rowIndex, resultIndex) {
    // Find the specific search results dropdown for this meal and row
    const mealSection = this.getMealSection(mealId);
    const mealTable = mealSection.locator(this.selectors.mealTables);
    const foodRows = mealTable.locator('tbody tr');
    const targetRow = foodRows.nth(rowIndex);
    const searchResults = targetRow.locator(this.selectors.foodSearchResults);
    
    // Wait for the results to be visible
    await searchResults.waitFor({ state: 'visible', timeout: 5000 });
    
    const searchItems = searchResults.locator(this.selectors.foodSearchItems);
    const targetItem = searchItems.nth(resultIndex);
    
    await targetItem.click();
    
    // Wait for food data to be populated
    await this.page.waitForTimeout(500);
  }

  /**
   * Add food to meal by searching and selecting
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   * @param {string} foodName - Food name to search for
   * @param {string} amount - Amount/serving size
   */
  async addFoodToMeal(mealId, rowIndex, foodName, amount = '1') {
    // Search for food
    await this.searchFood(mealId, rowIndex, foodName);
    
    // Select first result
    await this.selectFoodFromResults(mealId, rowIndex, 0);
    
    // Wait for food data to be populated
    await this.page.waitForTimeout(1000);
    
    // Always set the amount to ensure it matches what we expect
    await this.setFoodAmount(mealId, rowIndex, amount);
    
    // Wait for calculations to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Set food amount in a specific row
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   * @param {string} amount - Amount value
   */
  async setFoodAmount(mealId, rowIndex, amount) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    const targetRow = foodRows.nth(rowIndex);
    const amountInput = targetRow.locator(this.selectors.amountColumn);
    
    await amountInput.fill(amount);
    await amountInput.press('Tab'); // Trigger calculation
    await amountInput.dispatchEvent('change'); // Ensure change event fires
    
    // Wait for calculations to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Get food item data from a specific row
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   */
  async getFoodItemData(mealId, rowIndex) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    const targetRow = foodRows.nth(rowIndex);
    
    // Helper function to safely get value from input or text content
    const safeGetValue = async (selector) => {
      try {
        const element = targetRow.locator(selector);
        if (await element.count() > 0) {
          // Try to get input value first
          try {
            return await element.inputValue();
          } catch {
            // If not an input, get text content
            const text = await element.textContent();
            return text ? text.trim() : '';
          }
        }
        return '';
      } catch (error) {
        console.log(`Could not get value for selector ${selector}:`, error.message);
        return '';
      }
    };
    
    // Also try alternative selectors for nutritional values (they might be spans or divs)
    const safeGetNutritionalValue = async (inputSelector, textSelector) => {
      // First try the input selector
      let value = await safeGetValue(inputSelector);
      if (value) return value;
      
      // If no value from input, try text selector
      if (textSelector) {
        value = await safeGetValue(textSelector);
        if (value) return value;
      }
      
      return '';
    };
    
    return {
      item: await safeGetValue(this.selectors.itemColumn),
      amount: await safeGetValue(this.selectors.amountColumn),
      calories: await safeGetNutritionalValue(this.selectors.caloriesColumn, 'td:nth-child(3)'),
      carbs: await safeGetNutritionalValue(this.selectors.carbsColumn, 'td:nth-child(4)'),
      protein: await safeGetNutritionalValue(this.selectors.proteinColumn, 'td:nth-child(5)'),
      fat: await safeGetNutritionalValue(this.selectors.fatColumn, 'td:nth-child(6)'),
      proteinG: await safeGetNutritionalValue(this.selectors.proteinGColumn, 'td:nth-child(7)')
    };
  }

  /**
   * Clear food item from a specific row
   * @param {number} mealId - Meal ID (1-6)
   * @param {number} rowIndex - Row index (0-based)
   */
  async clearFoodItem(mealId, rowIndex) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    const targetRow = foodRows.nth(rowIndex);
    
    // Clear all input fields in the row
    const inputs = targetRow.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      await inputs.nth(i).fill('');
    }
  }

  // Nutrition calculation verification methods

  /**
   * Get meal totals
   * @param {number} mealId - Meal ID (1-6)
   */
  async getMealTotals(mealId) {
    const mealTable = this.getMealTable(mealId);
    
    return {
      calories: await mealTable.locator(this.selectors.totalCalories).textContent(),
      carbs: await mealTable.locator(this.selectors.totalCarbs).textContent(),
      protein: await mealTable.locator(this.selectors.totalProtein).textContent(),
      fat: await mealTable.locator(this.selectors.totalFat).textContent(),
      proteinG: await mealTable.locator(this.selectors.totalProteinG).textContent()
    };
  }

  /**
   * Get daily nutrition stats
   */
  async getDailyNutritionStats() {
    return {
      proteinLevel: await this.page.inputValue(this.selectors.proteinLevelInput),
      proteinPercentage: await this.getElementText(this.selectors.proteinPercentage),
      proteinGrams: await this.getElementText(this.selectors.proteinGrams),
      proteinCalories: await this.getElementText(this.selectors.proteinCalories),
      fatLevel: await this.page.inputValue(this.selectors.fatLevelInput),
      fatPercentage: await this.getElementText(this.selectors.fatPercentage),
      fatGrams: await this.getElementText(this.selectors.fatGrams),
      fatCalories: await this.getElementText(this.selectors.fatCalories),
      carboPercentage: await this.getElementText(this.selectors.carboPercentage),
      carboGrams: await this.getElementText(this.selectors.carboGrams),
      carboCalories: await this.getElementText(this.selectors.carboCalories),
      calorieAdjustment: await this.page.inputValue(this.selectors.calorieAdjustmentInput),
      goalCalories: await this.getElementText(this.selectors.goalCalories)
    };
  }

  /**
   * Set protein level
   * @param {string} level - Protein level value
   */
  async setProteinLevel(level) {
    await this.fillInput(this.selectors.proteinLevelInput, level);
    await this.page.keyboard.press('Tab'); // Trigger calculation
  }

  /**
   * Set fat level
   * @param {string} level - Fat level value
   */
  async setFatLevel(level) {
    await this.fillInput(this.selectors.fatLevelInput, level);
    await this.page.keyboard.press('Tab'); // Trigger calculation
  }

  /**
   * Set calorie adjustment
   * @param {string} adjustment - Calorie adjustment value
   */
  async setCalorieAdjustment(adjustment) {
    await this.fillInput(this.selectors.calorieAdjustmentInput, adjustment);
    await this.page.keyboard.press('Tab'); // Trigger calculation
  }

  /**
   * Verify nutrition calculations are correct
   * @param {Object} expectedTotals - Expected nutrition totals
   */
  async verifyNutritionCalculations(expectedTotals) {
    const actualStats = await this.getDailyNutritionStats();
    
    // Compare key nutrition values
    if (expectedTotals.proteinGrams) {
      const actualProtein = parseFloat(actualStats.proteinGrams);
      const expectedProtein = parseFloat(expectedTotals.proteinGrams);
      if (Math.abs(actualProtein - expectedProtein) > 0.1) {
        throw new Error(`Protein calculation mismatch: expected ${expectedProtein}g, got ${actualProtein}g`);
      }
    }
    
    if (expectedTotals.fatGrams) {
      const actualFat = parseFloat(actualStats.fatGrams);
      const expectedFat = parseFloat(expectedTotals.fatGrams);
      if (Math.abs(actualFat - expectedFat) > 0.1) {
        throw new Error(`Fat calculation mismatch: expected ${expectedFat}g, got ${actualFat}g`);
      }
    }
    
    if (expectedTotals.carboGrams) {
      const actualCarbs = parseFloat(actualStats.carboGrams);
      const expectedCarbs = parseFloat(expectedTotals.carboGrams);
      if (Math.abs(actualCarbs - expectedCarbs) > 0.1) {
        throw new Error(`Carbs calculation mismatch: expected ${expectedCarbs}g, got ${actualCarbs}g`);
      }
    }
  }

  /**
   * Get total number of meals
   */
  async getMealCount() {
    const mealSections = this.page.locator(this.selectors.mealSections);
    return await mealSections.count();
  }

  /**
   * Get number of food items in a meal
   * @param {number} mealId - Meal ID (1-6)
   */
  async getFoodItemCount(mealId) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    return await foodRows.count();
  }

  /**
   * Check if meal has any food items
   * @param {number} mealId - Meal ID (1-6)
   */
  async mealHasFoodItems(mealId) {
    const mealTable = this.getMealTable(mealId);
    const firstRowItem = mealTable.locator('tbody tr').first().locator(this.selectors.itemColumn);
    const itemValue = await firstRowItem.inputValue();
    return itemValue.trim() !== '';
  }

  /**
   * Get all food items from a meal
   * @param {number} mealId - Meal ID (1-6)
   */
  async getAllFoodItemsFromMeal(mealId) {
    const mealTable = this.getMealTable(mealId);
    const foodRows = mealTable.locator('tbody tr');
    const rowCount = await foodRows.count();
    const foodItems = [];
    
    for (let i = 0; i < rowCount; i++) {
      const itemData = await this.getFoodItemData(mealId, i);
      if (itemData.item.trim() !== '') {
        foodItems.push(itemData);
      }
    }
    
    return foodItems;
  }

  /**
   * Verify meal totals are calculated correctly
   * @param {number} mealId - Meal ID (1-6)
   */
  async verifyMealTotals(mealId) {
    const foodItems = await this.getAllFoodItemsFromMeal(mealId);
    const mealTotals = await this.getMealTotals(mealId);
    
    // Calculate expected totals
    let expectedCalories = 0;
    let expectedCarbs = 0;
    let expectedProtein = 0;
    let expectedFat = 0;
    let expectedProteinG = 0;
    
    foodItems.forEach(item => {
      expectedCalories += parseFloat(item.calories) || 0;
      expectedCarbs += parseFloat(item.carbs) || 0;
      expectedProtein += parseFloat(item.protein) || 0;
      expectedFat += parseFloat(item.fat) || 0;
      expectedProteinG += parseFloat(item.proteinG) || 0;
    });
    
    // Compare with actual totals
    const actualCalories = parseFloat(mealTotals.calories);
    const actualCarbs = parseFloat(mealTotals.carbs);
    const actualProtein = parseFloat(mealTotals.protein);
    const actualFat = parseFloat(mealTotals.fat);
    const actualProteinG = parseFloat(mealTotals.proteinG);
    
    if (Math.abs(actualCalories - expectedCalories) > 0.1) {
      throw new Error(`Meal ${mealId} calories mismatch: expected ${expectedCalories}, got ${actualCalories}`);
    }
    
    if (Math.abs(actualCarbs - expectedCarbs) > 0.1) {
      throw new Error(`Meal ${mealId} carbs mismatch: expected ${expectedCarbs}, got ${actualCarbs}`);
    }
    
    if (Math.abs(actualProtein - expectedProtein) > 0.1) {
      throw new Error(`Meal ${mealId} protein mismatch: expected ${expectedProtein}, got ${actualProtein}`);
    }
    
    if (Math.abs(actualFat - expectedFat) > 0.1) {
      throw new Error(`Meal ${mealId} fat mismatch: expected ${expectedFat}, got ${actualFat}`);
    }
    
    if (Math.abs(actualProteinG - expectedProteinG) > 0.1) {
      throw new Error(`Meal ${mealId} protein G mismatch: expected ${expectedProteinG}, got ${actualProteinG}`);
    }
  }

  /**
   * Check if error message is displayed
   */
  async isErrorDisplayed() {
    return await this.isElementVisible(this.selectors.errorDisplay);
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    return await this.getElementText(this.selectors.errorDisplay);
  }

  /**
   * Verify page loads correctly
   */
  async verifyPageLoaded() {
    await this.assertElementVisible(this.selectors.mealsContainer);
    
    // Verify we have 6 meal sections
    const mealCount = await this.getMealCount();
    if (mealCount !== 6) {
      throw new Error(`Expected 6 meals but found ${mealCount}`);
    }
    
    // Verify each meal has a table
    for (let mealId = 1; mealId <= 6; mealId++) {
      const mealTable = this.getMealTable(mealId);
      await this.assertElementVisible(mealTable);
    }
  }
}

module.exports = DiaryPage;
const { test, expect } = require('@playwright/test');
const { authFixture } = require('./fixtures/auth.fixture');
const DiaryPage = require('./pages/diary/DiaryPage');

const authTest = authFixture;

authTest('debug food structure', async ({ authenticatedPage }) => {
  const diaryPage = new DiaryPage(authenticatedPage);
  
  // Navigate to diary page
  await diaryPage.navigateToDiary();
  await diaryPage.waitForDiaryPageLoad();
  
  // Add food to meal
  await diaryPage.addFoodToMeal(1, 0, 'Me', '1');
  
  // Get the meal table and inspect its structure
  const mealTable = diaryPage.getMealTable(1);
  const firstRow = mealTable.locator('tbody tr').first();
  
  // Log the HTML structure
  const rowHTML = await firstRow.innerHTML();
  console.log('Row HTML:', rowHTML);
  
  // Try to get all input elements in the row
  const inputs = firstRow.locator('input');
  const inputCount = await inputs.count();
  console.log('Number of inputs:', inputCount);
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const value = await input.inputValue();
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    console.log(`Input ${i}: value="${value}", placeholder="${placeholder}", type="${type}"`);
  }
  
  // Try the specific selectors
  const itemValue = await firstRow.locator('td:nth-child(1) input').inputValue();
  console.log('Item value:', itemValue);
  
  try {
    const caloriesValue = await firstRow.locator('td:nth-child(3) input').inputValue();
    console.log('Calories value:', caloriesValue);
  } catch (error) {
    console.log('Calories input not found:', error.message);
  }
  
  // Take a screenshot
  await authenticatedPage.screenshot({ path: 'debug-food-structure.png', fullPage: true });
});
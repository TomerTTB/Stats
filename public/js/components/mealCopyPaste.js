// Meal Copy/Paste functionality
class MealCopyPaste {
    constructor() {
        this.copiedMeal = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Use event delegation to handle dynamically created buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-meal-btn')) {
                const button = e.target.closest('.copy-meal-btn');
                const mealId = button.dataset.mealId;
                this.copyMeal(mealId);
            }
            
            if (e.target.closest('.paste-meal-btn')) {
                const button = e.target.closest('.paste-meal-btn');
                const mealId = button.dataset.mealId;
                this.pasteMeal(mealId);
            }
        });
    }

    copyMeal(mealId) {
        try {
            const mealSection = document.querySelector(`[data-meal-id="${mealId}"]`);
            if (!mealSection) {
                console.error('Meal section not found');
                return;
            }

            // Extract meal data from the table
            const table = mealSection.querySelector('.meal-table');
            const tbody = table.querySelector('tbody');
            const rows = tbody.querySelectorAll('tr');
            
            const mealData = {
                mealId: mealId,
                time: mealSection.querySelector('.meal-time').value,
                items: []
            };

            // Extract data from each row that has food items
            rows.forEach(row => {
                const foodInput = row.querySelector('.food-search-input');
                const amountInput = row.querySelector('.amount-input');
                const nutritionalValues = row.querySelectorAll('.nutritional-value');

                // Only copy rows that have food items
                if (foodInput && foodInput.value.trim()) {
                    const item = {
                        name: foodInput.value.trim(),
                        amount: amountInput.value || '',
                        baseAmount: amountInput.getAttribute('data-base-amount') || amountInput.value || '',
                        calories: nutritionalValues[0]?.textContent || '',
                        carbs: nutritionalValues[1]?.textContent || '',
                        protein: nutritionalValues[2]?.textContent || '',
                        fat: nutritionalValues[3]?.textContent || '',
                        proteinG: nutritionalValues[4]?.textContent || '',
                        // Store base values for proper scaling
                        baseCalories: nutritionalValues[0]?.getAttribute('data-base-value') || nutritionalValues[0]?.textContent || '',
                        baseCarbs: nutritionalValues[1]?.getAttribute('data-base-value') || nutritionalValues[1]?.textContent || '',
                        baseProtein: nutritionalValues[2]?.getAttribute('data-base-value') || nutritionalValues[2]?.textContent || '',
                        baseFat: nutritionalValues[3]?.getAttribute('data-base-value') || nutritionalValues[3]?.textContent || '',
                        baseProteinG: nutritionalValues[4]?.getAttribute('data-base-value') || nutritionalValues[4]?.textContent || ''
                    };
                    mealData.items.push(item);
                }
            });

            // Store the copied meal data
            this.copiedMeal = mealData;

            // Enable all paste buttons
            this.updatePasteButtons();

            // Show success message
            this.showMessage(`Meal ${mealId} copied! (${mealData.items.length} items)`, 'success');

            console.log('Meal copied:', mealData);

        } catch (error) {
            console.error('Error copying meal:', error);
            this.showMessage('Error copying meal', 'error');
        }
    }

    async pasteMeal(targetMealId) {
        if (!this.copiedMeal) {
            this.showMessage('No meal copied yet. Copy a meal first.', 'warning');
            return;
        }

        try {
            const targetMealSection = document.querySelector(`[data-meal-id="${targetMealId}"]`);
            if (!targetMealSection) {
                console.error('Target meal section not found');
                return;
            }

            // No confirmation needed - proceed with paste operation

            // Clear existing meal data
            await this.clearMeal(targetMealSection);

            // Paste the copied meal data
            await this.populateMeal(targetMealSection, this.copiedMeal);

            // Update totals and save
            const table = targetMealSection.querySelector('.meal-table');
            updateTotals(table);
            
            // Save the meal data
            const tbody = table.querySelector('tbody');
            const rows = tbody.querySelectorAll('tr');
            for (const row of rows) {
                const foodInput = row.querySelector('.food-search-input');
                if (foodInput && foodInput.value.trim()) {
                    await saveMealData(row);
                }
            }

            // Recalculate all totals
            calculateMacroStats();

            // Show success message
            this.showMessage(
                `Meal pasted to Meal ${targetMealId}! (${this.copiedMeal.items.length} items)`, 
                'success'
            );

            console.log('Meal pasted to:', targetMealId);

        } catch (error) {
            console.error('Error pasting meal:', error);
            this.showMessage('Error pasting meal', 'error');
        }
    }

    mealHasItems(mealSection) {
        const tbody = mealSection.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        return Array.from(rows).some(row => {
            const foodInput = row.querySelector('.food-search-input');
            return foodInput && foodInput.value.trim();
        });
    }

    async clearMeal(mealSection) {
        const tbody = mealSection.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        // Delete existing database entries for this meal
        const mealId = mealSection.dataset.mealId;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        // Use the global currentDate from diary-core.js
        const dayName = days[window.currentDate ? window.currentDate.getDay() : new Date().getDay()];
        
        console.log(`Clearing meal ${mealId} for day ${dayName} (current date: ${window.currentDate})`);
        
        // Delete ALL items for this meal from database (regardless of itemId in UI)
        try {
            // Get the meal time to identify which items to delete
            const timeInput = mealSection.querySelector('.meal-time');
            const mealTime = timeInput ? timeInput.value : null;
            
            if (mealTime) {
                // Delete all items at this meal time for this meal_id
                const result = await API.meals.deleteAllMealItems(dayName, mealId);
                console.log(`Deleted all items from meal ${mealId} at ${mealTime}`);
            }
        } catch (error) {
            console.error(`Error deleting items from meal ${mealId}:`, error);
        }
        
        // Clear all existing rows in UI
        rows.forEach(row => {
            const foodInput = row.querySelector('.food-search-input');
            const amountInput = row.querySelector('.amount-input');
            const nutritionalValues = row.querySelectorAll('.nutritional-value');
            
            if (foodInput) foodInput.value = '';
            if (amountInput) {
                amountInput.value = '';
                amountInput.removeAttribute('data-base-amount');
            }
            
            nutritionalValues.forEach(div => {
                div.textContent = '';
                div.removeAttribute('data-base-value');
            });
            
            // Remove item ID if it exists
            row.removeAttribute('data-item-id');
        });
    }

    async populateMeal(mealSection, copiedMealData) {
        const tbody = mealSection.querySelector('tbody');
        const existingRows = tbody.querySelectorAll('tr');
        
        // Ensure we have enough rows
        const neededRows = Math.max(6, copiedMealData.items.length);
        const currentRows = existingRows.length;
        
        // Add more rows if needed
        for (let i = currentRows; i < neededRows; i++) {
            const newRow = createFoodItemRow({});
            tbody.insertAdjacentHTML('beforeend', newRow);
            const newRowElement = tbody.lastElementChild;
            setupRowEventListeners(newRowElement.querySelector('.food-search-input'));
            setupAmountInputEventListener(newRowElement.querySelector('input[type="number"]'));
        }

        // Get all rows (including newly created ones)
        const allRows = tbody.querySelectorAll('tr');

        // Populate rows with copied data
        copiedMealData.items.forEach((item, index) => {
            if (index < allRows.length) {
                const row = allRows[index];
                this.populateRow(row, item);
            }
        });

        // Update the meal time if it was copied
        const timeInput = mealSection.querySelector('.meal-time');
        if (timeInput && copiedMealData.time) {
            // Don't copy the exact time, but you could implement time offset logic here
            // For now, we'll keep the original time of the target meal
        }
    }

    populateRow(row, itemData) {
        const foodInput = row.querySelector('.food-search-input');
        const amountInput = row.querySelector('.amount-input');
        const nutritionalValues = row.querySelectorAll('.nutritional-value');

        // Set food name
        if (foodInput) {
            foodInput.value = itemData.name;
        }

        // Set amount and base amount
        if (amountInput) {
            amountInput.value = itemData.amount;
            if (itemData.baseAmount) {
                amountInput.setAttribute('data-base-amount', itemData.baseAmount);
            }
        }

        // Set nutritional values and their base values
        const nutritionalData = [
            { value: itemData.calories, baseValue: itemData.baseCalories },
            { value: itemData.carbs, baseValue: itemData.baseCarbs },
            { value: itemData.protein, baseValue: itemData.baseProtein },
            { value: itemData.fat, baseValue: itemData.baseFat },
            { value: itemData.proteinG, baseValue: itemData.baseProteinG }
        ];

        nutritionalValues.forEach((div, index) => {
            if (nutritionalData[index]) {
                div.textContent = nutritionalData[index].value;
                if (nutritionalData[index].baseValue) {
                    div.setAttribute('data-base-value', nutritionalData[index].baseValue);
                }
            }
        });
    }

    updatePasteButtons() {
        const pasteButtons = document.querySelectorAll('.paste-meal-btn');
        const hasData = !!this.copiedMeal;
        
        pasteButtons.forEach(button => {
            button.disabled = !hasData;
            if (hasData) {
                button.title = `Paste copied meal (${this.copiedMeal.items.length} items)`;
            } else {
                button.title = 'No meal copied yet';
            }
        });
    }

    showMessage(message, type = 'info') {
        // Create or get existing message container
        let messageContainer = document.getElementById('meal-copy-paste-messages');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'meal-copy-paste-messages';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        messageElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to container
        messageContainer.appendChild(messageElement);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 4000);
    }

    addCopiedMealIndicator(mealSection) {
        // Remove any existing copied indicators
        document.querySelectorAll('.copied-meal-indicator').forEach(indicator => {
            indicator.remove();
        });

        // Add visual indicator to the copied meal
        const indicator = document.createElement('div');
        indicator.className = 'copied-meal-indicator';
        indicator.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Copied!';
        indicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(25, 135, 84, 0.1);
            color: #198754;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            z-index: 10;
            border: 1px solid rgba(25, 135, 84, 0.2);
        `;

        // Make meal section relative positioned if it isn't already
        const currentPosition = getComputedStyle(mealSection).position;
        if (currentPosition === 'static') {
            mealSection.style.position = 'relative';
        }

        // Add the indicator
        mealSection.appendChild(indicator);

        // Remove the indicator after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }

    // Get copied meal info (for debugging or UI display)
    getCopiedMealInfo() {
        return this.copiedMeal ? {
            mealId: this.copiedMeal.mealId,
            itemCount: this.copiedMeal.items.length,
            time: this.copiedMeal.time
        } : null;
    }
}

// Initialize the meal copy/paste functionality
const mealCopyPaste = new MealCopyPaste();

// Export for use in other files
window.mealCopyPaste = mealCopyPaste;
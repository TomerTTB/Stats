class FoodSearch {
    constructor() {
        this.foods = [];
        this.searchResults = new Map(); // Cache for search results
        this.loadFoods();
    }

    async loadFoods() {
        try {
            const response = await API.foods.getAll();
            const data = await response.json();
            this.foods = Array.isArray(data) ? data : (data.foods || []);
        } catch (error) {
            console.error('Error loading foods:', error);
        }
    }

    setupSearchInput(input) {
        // Create container for search results if it doesn't exist
        let container = input.closest('.food-search-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'food-search-container';
            input.parentNode.insertBefore(container, input);
            container.appendChild(input);
        }

        let resultsDiv = container.querySelector('.food-search-results');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.className = 'food-search-results';
            container.appendChild(resultsDiv);
        }

        // Set input attributes
        input.setAttribute('autocomplete', 'off');

        // Handle input events
        input.addEventListener('input', (e) => this.handleSearch(e, resultsDiv));
        input.addEventListener('focus', () => this.handleSearch({ target: input }, resultsDiv));

        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                resultsDiv.classList.remove('show');
            }
        });

        // Handle keyboard navigation
        input.addEventListener('keydown', (e) => {
            const items = resultsDiv.querySelectorAll('.food-search-item');
            const selected = resultsDiv.querySelector('.selected');
            let index = -1;

            if (selected) {
                index = Array.from(items).indexOf(selected);
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (index < items.length - 1) {
                        if (selected) selected.classList.remove('selected');
                        items[index + 1].classList.add('selected');
                        items[index + 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (index > 0) {
                        if (selected) selected.classList.remove('selected');
                        items[index - 1].classList.add('selected');
                        items[index - 1].scrollIntoView({ block: 'nearest' });
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selected) {
                        const foodData = JSON.parse(selected.getAttribute('data-food'));
                        this.handleFoodSelection(foodData, resultsDiv.previousElementSibling);
                        resultsDiv.classList.remove('show');
                    }
                    break;
                case 'Escape':
                    resultsDiv.classList.remove('show');
                    break;
            }
        });
    }

    handleSearch(event, resultsDiv) {
        const searchTerm = event.target.value.toLowerCase();
        
        if (!searchTerm) {
            resultsDiv.classList.remove('show');
            return;
        }

        // Filter foods
        const filteredFoods = this.foods.filter(food => 
            food.item.toLowerCase().includes(searchTerm)
        );

        // Display results
        this.displayResults(filteredFoods, resultsDiv);
    }

    displayResults(foods, resultsDiv) {
        resultsDiv.innerHTML = '';
        
        if (foods.length === 0) {
            resultsDiv.classList.remove('show');
            return;
        }

        foods.forEach(food => {
            const div = document.createElement('div');
            div.className = 'food-search-item';
            div.textContent = food.item;
            div.setAttribute('data-food', JSON.stringify(food));
            
            div.addEventListener('click', () => {
                this.handleFoodSelection(food, resultsDiv.previousElementSibling);
                resultsDiv.classList.remove('show');
            });
            
            resultsDiv.appendChild(div);
        });

        resultsDiv.classList.add('show');
    }

    handleFoodSelection(food, input) {
        // Find the row that contains this input
        const row = input.closest('tr');
        if (!row) return;

        // Store the food data for later calculations
        input.setAttribute('data-food', JSON.stringify(food));

        // Set the food name in the input
        input.value = food.item;

        // Set the amount if it exists
        const amountInput = row.querySelector('input[type="number"]');
        if (amountInput) {
            amountInput.value = food.amount || '';
            // Store the base amount
            amountInput.setAttribute('data-base-amount', food.amount || '');
        }

        // Update the nutritional values in the divs
        const nutritionalDivs = row.querySelectorAll('.nutritional-value');
        if (nutritionalDivs.length >= 5) {
            nutritionalDivs[0].textContent = food.calories || '';
            nutritionalDivs[1].textContent = food.carbs || '';
            nutritionalDivs[2].textContent = food.protein || '';
            nutritionalDivs[3].textContent = food.fat || '';
            nutritionalDivs[4].textContent = food.proteinGeneral || '';

            // Store base values
            nutritionalDivs.forEach((div, index) => {
                const values = [food.calories, food.carbs, food.protein, food.fat, food.proteinGeneral];
                div.setAttribute('data-base-value', values[index] || '');
            });
        }

        // Trigger change event on amount input to recalculate totals
        if (amountInput) {
            const event = new Event('change');
            amountInput.dispatchEvent(event);
        }

        // Save the meal data immediately after food selection
        // This ensures the complete food data is saved to the database
        if (typeof saveMealData === 'function') {
            setTimeout(() => {
                saveMealData(row);
            }, 100); // Small delay to ensure all DOM updates are complete
        }
    }
}

// Export the class
window.FoodSearch = FoodSearch; 
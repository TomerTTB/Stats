// Main diary.js - Event handlers and initialization

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the page
    initializePage();

    // Add event listeners for day buttons
    document.querySelectorAll('.days-of-week button').forEach(button => {
        button.addEventListener('click', () => {
            const dayIndex = parseInt(button.dataset.day);
            currentDate = getDateForDayOfWeek(dayIndex);
            window.currentDate = currentDate; // Update global reference
            updateActiveDayButton(dayIndex);
            loadMeals();
        });
    });

    // Add event listeners for date navigation
    document.getElementById('prevDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        window.currentDate = currentDate; // Update global reference
        updateActiveDayButton(currentDate.getDay());
        loadMeals();
    });

    document.getElementById('nextDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        window.currentDate = currentDate; // Update global reference
        updateActiveDayButton(currentDate.getDay());
        loadMeals();
    });

    // Add event listeners for meal actions
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-success') && e.target.closest('.add-item-row')) {
            handleAddItem(e.target);
        } else if (e.target.classList.contains('btn-outline-primary') && !e.target.closest('.days-of-week')) {
            handleEditItem(e.target);
        } else if (e.target.classList.contains('btn-outline-danger')) {
            handleDeleteItem(e.target);
        }
    });

    // Add protein and fat level input event listeners
    const proteinLevelInput = document.getElementById('proteinLevelInput');
    const fatLevelInput = document.getElementById('fatLevelInput');
    proteinLevelInput.addEventListener('input', () => {
        calculateMacroStats();
        saveMacroSettings();
    });
    fatLevelInput.addEventListener('input', () => {
        calculateMacroStats();
        saveMacroSettings();
    });

    // Add calorie adjustment input event listener
    const calorieAdjustmentInput = document.getElementById('calorieAdjustmentInput');
    calorieAdjustmentInput.addEventListener('input', () => {
        applyCalorieAdjustment();
        calculateMacroStats();
        saveMacroSettings();
    });
});
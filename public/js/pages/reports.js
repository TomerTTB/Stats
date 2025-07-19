// Nutrition Reports Manager
class NutritionReports {
    constructor() {
        this.settings = null;
        this.weeklyData = {};
        this.charts = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadSettings();
            await this.loadWeeklyData();
            this.generateWeeklyReport();
            this.initialized = true;
        } catch (error) {
            console.error('NutritionReports: Initialization failed:', error);
        }
    }

    async loadSettings() {
        try {
            const response = await API.settings.get();
            this.settings = await response.json();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadWeeklyData() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        for (const day of days) {
            try {
                const response = await API.meals.get(day);
                this.weeklyData[day] = await response.json();
            } catch (error) {
                console.error(`Error loading ${day} data:`, error);
                this.weeklyData[day] = { meals: [] };
            }
        }
    }

    calculateDayTotals(dayData) {
        let totals = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            proteinG: 0
        };

        if (!dayData.meals) return totals;

        dayData.meals.forEach(meal => {
            if (meal.items) {
                meal.items.forEach(item => {
                    totals.calories += parseFloat(item.calories) || 0;
                    totals.carbs += parseFloat(item.carbs) || 0;
                    totals.protein += parseFloat(item.protein) || 0;
                    totals.fat += parseFloat(item.fat) || 0;
                    totals.proteinG += parseFloat(item.proteinG) || 0;
                });
            }
        });

        return totals;
    }

    generateWeeklyReport() {
        const weeklyTotals = this.calculateWeeklyTotals();
        this.updateAchievementStats(weeklyTotals);
        this.createWeeklyCaloriesChart(weeklyTotals);
        this.updateWeeklyMacroTable(weeklyTotals);
    }

    calculateWeeklyTotals() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return days.map((day, index) => {
            const totals = this.calculateDayTotals(this.weeklyData[day]);
            const goalCalories = this.settings?.totalCalories || 2700;
            const proteinTarget = (this.settings?.weight || 70) * 1.9;
            
            const calorieAchievement = goalCalories > 0 ? (totals.calories / goalCalories) * 100 : 0;
            
            let status = 'needs-improvement';
            if (calorieAchievement >= 95 && calorieAchievement <= 105) {
                status = 'excellent';
            } else if (calorieAchievement >= 85 && calorieAchievement <= 115) {
                status = 'good';
            }

            return {
                day: dayNames[index],
                dayKey: day,
                ...totals,
                goalCalories,
                proteinTarget,
                calorieAchievement,
                status
            };
        });
    }

    updateAchievementStats(weeklyTotals) {
        const totalCalories = weeklyTotals.reduce((sum, day) => sum + day.calories, 0);
        const avgDailyCalories = totalCalories / 7;
        const goalCalories = this.settings?.totalCalories || 2700;
        const goalAchievement = goalCalories > 0 ? (avgDailyCalories / goalCalories) * 100 : 0;
        
        const proteinTarget = (this.settings?.weight || 70) * 1.9;
        const avgProtein = weeklyTotals.reduce((sum, day) => sum + day.protein + day.proteinG, 0) / 7;
        const proteinAchievement = proteinTarget > 0 ? (avgProtein / proteinTarget) * 100 : 0;
        
        const daysOnTrack = weeklyTotals.filter(day => 
            day.calorieAchievement >= 95 && day.calorieAchievement <= 105
        ).length;

        document.getElementById('avgDailyCalories').textContent = `${Math.round(avgDailyCalories)} kcal`;
        document.getElementById('goalAchievement').textContent = `${goalAchievement.toFixed(1)}%`;
        document.getElementById('proteinAchievement').textContent = `${proteinAchievement.toFixed(1)}%`;
        document.getElementById('daysOnTrack').textContent = `${daysOnTrack}/7 days`;
    }

    createWeeklyCaloriesChart(weeklyTotals) {
        const ctx = document.getElementById('weeklyCaloriesChart');
        if (!ctx) return;

        if (this.charts.weeklyCalories) {
            this.charts.weeklyCalories.destroy();
        }

        const goalCalories = this.settings?.totalCalories || 2700;
        
        this.charts.weeklyCalories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyTotals.map(day => day.day.slice(0, 3)),
                datasets: [
                    {
                        label: 'Actual Calories',
                        data: weeklyTotals.map(day => day.calories),
                        backgroundColor: weeklyTotals.map(day => {
                            if (day.status === 'excellent') return 'rgba(40, 167, 69, 0.8)';
                            if (day.status === 'good') return 'rgba(255, 193, 7, 0.8)';
                            return 'rgba(220, 53, 69, 0.8)';
                        }),
                        borderColor: weeklyTotals.map(day => {
                            if (day.status === 'excellent') return 'rgba(40, 167, 69, 1)';
                            if (day.status === 'good') return 'rgba(255, 193, 7, 1)';
                            return 'rgba(220, 53, 69, 1)';
                        }),
                        borderWidth: 2
                    },
                    {
                        label: 'Goal',
                        data: new Array(7).fill(goalCalories),
                        type: 'line',
                        borderColor: 'rgba(26, 115, 232, 1)',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(26, 115, 232, 1)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Calories' }
                    }
                }
            }
        });
    }

    updateWeeklyMacroTable(weeklyTotals) {
        const tbody = document.querySelector('#weeklyMacroTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        weeklyTotals.forEach(day => {
            const statusText = {
                'excellent': 'Excellent',
                'good': 'Good',
                'needs-improvement': 'Needs Improvement'
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${day.day}</strong></td>
                <td>${Math.round(day.calories)}</td>
                <td>${(day.protein + day.proteinG).toFixed(1)}</td>
                <td>${day.fat.toFixed(1)}</td>
                <td>${day.carbs.toFixed(1)}</td>
                <td><span class="status-badge status-${day.status}">${statusText[day.status]}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Weight Tracker Manager
class WeightTracker {
    constructor() {
        this.weightData = [];
        this.settings = null;
        this.chart = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadSettings();
            await this.loadWeightData();
            this.setupEventListeners();
            this.updateWeightStatistics();
            this.createWeightChart();
            this.updateWeightTable();
            this.initialized = true;
        } catch (error) {
            console.error('WeightTracker: Initialization failed:', error);
        }
    }

    async loadSettings() {
        try {
            const response = await API.settings.get();
            this.settings = await response.json();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadWeightData() {
        try {
            const response = await API.weight.getAll();
            const data = await response.json();
            this.weightData = data.entries || [];
        } catch (error) {
            console.error('Error loading weight data:', error);
            this.weightData = [];
        }
    }

    setupEventListeners() {
        const weightForm = document.getElementById('weightForm');
        const weightDate = document.getElementById('weightDate');

        // Set today's date as default
        if (weightDate) {
            weightDate.value = new Date().toISOString().split('T')[0];
        }

        // Handle form submission
        if (weightForm) {
            weightForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleWeightSubmit();
            });
        }
    }

    async handleWeightSubmit() {
        const date = document.getElementById('weightDate').value;
        const weight = document.getElementById('weightValue').value;
        const note = document.getElementById('weightNote').value;

        if (!date || !weight) {
            alert('Please fill in date and weight');
            return;
        }

        try {
            const entry = { date, weight: parseFloat(weight), note };
            await API.weight.add(entry);
            await this.refreshWeightData();
            this.resetForm();
        } catch (error) {
            console.error('Error saving weight entry:', error);
            alert('Error saving weight entry');
        }
    }

    async refreshWeightData() {
        await this.loadWeightData();
        this.updateWeightStatistics();
        this.updateWeightChart();
        this.updateWeightTable();
    }

    resetForm() {
        document.getElementById('weightForm').reset();
        document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
    }

    updateWeightStatistics() {
        const currentWeight = this.weightData.length > 0 ? this.weightData[0].weight : 0;
        const latestWeightChange = this.calculateLatestWeightChange();
        const weightChange = this.calculateWeightChange();
        const avgWeightChange = this.calculateAvgWeightChange();
        const trend = this.calculateTrend();

        document.getElementById('currentWeight').textContent = currentWeight ? `${currentWeight.toFixed(1)} kg` : 'No data';
        document.getElementById('latestWeightChange').textContent = latestWeightChange !== null ? `${latestWeightChange > 0 ? '+' : ''}${latestWeightChange.toFixed(1)} kg` : 'No data';
        document.getElementById('weightChange').textContent = weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'No change';
        document.getElementById('avgWeightChange').textContent = avgWeightChange ? `${avgWeightChange > 0 ? '+' : ''}${avgWeightChange.toFixed(2)} kg` : 'No data';
        document.getElementById('weightTrend').textContent = trend;
    }

    calculateLatestWeightChange() {
        if (this.weightData.length < 2) return null;
        return this.weightData[0].weight - this.weightData[1].weight;
    }

    calculateWeightChange() {
        if (this.weightData.length < 2) return 0;
        return this.weightData[0].weight - this.weightData[this.weightData.length - 1].weight;
    }

    calculateAvgWeightChange() {
        if (this.weightData.length < 2) return 0;
        
        let totalChange = 0;
        let changeCount = 0;
        
        for (let i = 0; i < this.weightData.length - 1; i++) {
            const change = this.weightData[i].weight - this.weightData[i + 1].weight;
            totalChange += change;
            changeCount++;
        }
        
        return changeCount > 0 ? totalChange / changeCount : 0;
    }

    calculateTrend() {
        if (this.weightData.length < 3) return 'Insufficient data';
        
        const recent = this.weightData.slice(0, 3);
        const total = recent.reduce((sum, entry) => sum + entry.weight, 0);
        const average = total / recent.length;
        const latest = recent[0].weight;
        
        if (latest > average + 0.5) return '↗️ Increasing';
        if (latest < average - 0.5) return '↘️ Decreasing';
        return '↔️ Stable';
    }

    createWeightChart() {
        const ctx = document.getElementById('weightChart');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const chartData = this.weightData.slice().reverse();
        const labels = chartData.map(entry => new Date(entry.date).toLocaleDateString());
        const weights = chartData.map(entry => entry.weight);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight',
                    data: weights,
                    borderColor: 'rgba(26, 115, 232, 1)',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(26, 115, 232, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Weight (kg)' }
                    },
                    x: {
                        title: { display: true, text: 'Date' },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }

    updateWeightChart() {
        if (!this.chart) return;

        const chartData = this.weightData.slice().reverse();
        const labels = chartData.map(entry => new Date(entry.date).toLocaleDateString());
        const weights = chartData.map(entry => entry.weight);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = weights;
        this.chart.update();
    }

    updateWeightTable() {
        const tbody = document.querySelector('#weightEntriesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.weightData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No weight entries yet. Add your first entry above.</td></tr>';
            return;
        }

        this.weightData.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-entry-id', entry.id);
            
            const change = index < this.weightData.length - 1 ? 
                entry.weight - this.weightData[index + 1].weight : 0;

            const changeText = change !== 0 ? 
                `${change > 0 ? '+' : ''}${change.toFixed(1)} kg` : '-';

            const changeClass = change > 0 ? 'text-danger' : change < 0 ? 'text-success' : '';

            row.innerHTML = `
                <td>
                    <span class="weight-value">${new Date(entry.date).toLocaleDateString()}</span>
                    <input type="date" class="form-control weight-edit d-none" value="${entry.date}">
                </td>
                <td>
                    <span class="weight-value">${entry.weight.toFixed(1)} kg</span>
                    <div class="input-group weight-edit d-none">
                        <input type="number" class="form-control weight-edit" value="${entry.weight}" step="0.1" min="0">
                        <span class="input-group-text">kg</span>
                    </div>
                </td>
                <td class="${changeClass}">${changeText}</td>
                <td>
                    <span class="weight-value">${entry.note || '-'}</span>
                    <input type="text" class="form-control weight-edit d-none" value="${entry.note || ''}" placeholder="Note">
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary edit-btn">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-success save-btn d-none">
                            <i class="bi bi-check"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary cancel-btn d-none">
                            <i class="bi bi-x"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-btn">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);

            // Add event listeners for this row
            const editBtn = row.querySelector('.edit-btn');
            const saveBtn = row.querySelector('.save-btn');
            const cancelBtn = row.querySelector('.cancel-btn');
            const deleteBtn = row.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => this.handleEditInline(row));
            saveBtn.addEventListener('click', () => this.handleSaveInline(row));
            cancelBtn.addEventListener('click', () => this.handleCancelInline(row));
            deleteBtn.addEventListener('click', () => this.deleteEntry(entry.id));
        });
    }

    // Handle inline editing
    handleEditInline(row) {
        // Hide all other edit forms if any are open
        document.querySelectorAll('tr.editing').forEach(editingRow => {
            if (editingRow !== row) {
                this.handleCancelInline(editingRow);
            }
        });

        // Show edit form
        row.classList.add('editing');
        row.querySelectorAll('.weight-value').forEach(span => span.classList.add('d-none'));
        row.querySelectorAll('.weight-edit').forEach(input => input.classList.remove('d-none'));
        row.querySelector('.edit-btn').classList.add('d-none');
        row.querySelector('.save-btn').classList.remove('d-none');
        row.querySelector('.cancel-btn').classList.remove('d-none');
    }

    // Handle saving inline edit
    async handleSaveInline(row) {
        const entryId = row.getAttribute('data-entry-id');
        
        // Select inputs by their type for more reliability
        const dateInput = row.querySelector('input[type="date"]');
        const weightInput = row.querySelector('input[type="number"]');
        const noteInput = row.querySelector('input[type="text"]');
        
        const updatedEntry = {
            date: dateInput.value,
            weight: parseFloat(weightInput.value),
            note: noteInput.value
        };

        // Validate data
        if (!updatedEntry.date || !updatedEntry.weight || updatedEntry.weight <= 0) {
            alert('Please enter valid date and weight values');
            return;
        }

        try {
            await API.weight.update(entryId, updatedEntry);
            await this.refreshWeightData();
        } catch (error) {
            console.error('Error updating weight entry:', error);
            alert('Error updating weight entry. Please try again.');
            this.handleCancelInline(row);
        }
    }

    // Handle canceling inline edit
    handleCancelInline(row) {
        row.classList.remove('editing');
        row.querySelectorAll('.weight-value').forEach(span => span.classList.remove('d-none'));
        row.querySelectorAll('.weight-edit').forEach(input => input.classList.add('d-none'));
        row.querySelector('.edit-btn').classList.remove('d-none');
        row.querySelector('.save-btn').classList.add('d-none');
        row.querySelector('.cancel-btn').classList.add('d-none');
    }

    async deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this weight entry?')) return;

        // Find the row being deleted for immediate feedback
        const row = document.querySelector(`tr[data-entry-id="${id}"]`);
        if (row) {
            row.style.opacity = '0.5';
            row.style.pointerEvents = 'none';
        }

        try {
            await API.weight.delete(id);
            
            // Immediate UI update - remove the row
            if (row) {
                row.remove();
            }
            
            // Update local data
            this.weightData = this.weightData.filter(entry => entry.id !== id);
            
            // Update statistics and chart with existing data
            this.updateWeightStatistics();
            this.updateWeightChart();
            
            // Show empty state if no entries left
            if (this.weightData.length === 0) {
                const tbody = document.querySelector('#weightEntriesTable tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No weight entries yet. Add your first entry above.</td></tr>';
                }
            }
            
        } catch (error) {
            console.error('Error deleting weight entry:', error);
            alert('Error deleting weight entry');
            
            // Restore the row if delete failed
            if (row) {
                row.style.opacity = '1';
                row.style.pointerEvents = 'auto';
            }
        }
    }
}

// Application Manager
class ReportsApp {
    constructor() {
        this.nutritionReports = new NutritionReports();
        this.weightTracker = new WeightTracker();
        this.init();
    }

    init() {
        // Set up tab switching first
        this.setupTabSwitching();
        
        // Apply tab styling with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.ensureNutritionTabActive();
        }, 100);
        
        // Initialize nutrition reports immediately (default tab)
        this.nutritionReports.init();
        
        // Make weight tracker globally accessible
        window.weightTracker = this.weightTracker;
    }

    ensureNutritionTabActive() {
        // Ensure nutrition tab is active by default
        const nutritionTab = document.getElementById('nutrition-tab');
        const nutritionPanel = document.getElementById('nutrition-panel');
        const weightTab = document.getElementById('weight-tab');
        const weightPanel = document.getElementById('weight-panel');
        
        if (nutritionTab && nutritionPanel && weightTab && weightPanel) {
            // Set nutrition tab as active
            nutritionTab.classList.add('active');
            nutritionTab.setAttribute('aria-selected', 'true');
            
            // Set nutrition panel as active
            nutritionPanel.classList.add('active', 'show');
            
            // Ensure weight tab is inactive
            weightTab.classList.remove('active');
            weightTab.setAttribute('aria-selected', 'false');
            
            // Ensure weight panel is inactive
            weightPanel.classList.remove('active', 'show');
            
            // Apply inline styles as fallback
            nutritionTab.style.cssText = `
                color: #1a73e8 !important;
                border-bottom: 2px solid #1a73e8 !important;
                background: transparent !important;
            `;
            
            weightTab.style.cssText = `
                color: #666 !important;
                border-bottom: 2px solid transparent !important;
                background: transparent !important;
            `;
        }
    }

    setupTabSwitching() {
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');
        
        if (nutritionTab && weightTab) {
            // Handle nutrition tab activation
            nutritionTab.addEventListener('shown.bs.tab', () => {
                this.applyActiveStyles(nutritionTab, weightTab);
            });
            
            // Handle weight tab activation
            weightTab.addEventListener('shown.bs.tab', () => {
                this.applyActiveStyles(weightTab, nutritionTab);
                this.weightTracker.init();
            });
            
            // Also handle click events as fallback
            nutritionTab.addEventListener('click', () => {
                setTimeout(() => this.applyActiveStyles(nutritionTab, weightTab), 50);
            });
            
            weightTab.addEventListener('click', () => {
                setTimeout(() => this.applyActiveStyles(weightTab, nutritionTab), 50);
            });
        }
    }
    
    applyActiveStyles(activeTab, inactiveTab) {
        // Apply active styles
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        activeTab.style.cssText = `
            color: #1a73e8 !important;
            border-bottom: 2px solid #1a73e8 !important;
            background: transparent !important;
        `;
        
        // Apply inactive styles
        inactiveTab.classList.remove('active');
        inactiveTab.setAttribute('aria-selected', 'false');
        inactiveTab.style.cssText = `
            color: #666 !important;
            border-bottom: 2px solid transparent !important;
            background: transparent !important;
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ReportsApp();
}); 
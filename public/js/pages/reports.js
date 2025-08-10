// Nutrition Reports Manager
class NutritionReports {
    constructor() {
        this.settings = null;
        this.weeklyData = {};
        this.charts = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            console.log('NutritionReports already initialized, skipping');
            return;
        }

        try {
            console.log('Initializing NutritionReports...');
            await this.loadSettings();
            await this.loadWeeklyData();
            this.generateWeeklyReport();
            this.initialized = true;
            console.log('NutritionReports initialized successfully');
        } catch (error) {
            console.error('NutritionReports: Initialization failed:', error);
            this.initialized = false; // Reset on failure
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

            // Get daily macro settings for this day
            const dayData = this.weeklyData[day];
            const baseGoalCalories = this.settings?.totalCalories || 2700;
            const dailyAdjustment = dayData.calorieAdjustment || 0;
            const goalCalories = baseGoalCalories + dailyAdjustment;

            // Get daily protein level for this day
            const dailyProteinLevel = dayData.proteinLevel || 0;
            const proteinTarget = (this.settings?.weight || 70) * dailyProteinLevel;

            const calorieAchievement = goalCalories > 0 ? (totals.calories / goalCalories) * 100 : 0;

            let status = 'needs-improvement';
            if (calorieAchievement >= 95 && calorieAchievement <= 105) {
                status = 'excellent';
            } else if (calorieAchievement >= 90 && calorieAchievement <= 110) {
                status = 'good';
            }

            return {
                day: dayNames[index],
                dayKey: day,
                ...totals,
                goalCalories,
                proteinTarget,
                calorieAchievement,
                status,
                dailyAdjustment
            };
        });
    }

    updateAchievementStats(weeklyTotals) {
        const totalCalories = weeklyTotals.reduce((sum, day) => sum + day.calories, 0);
        const avgDailyCalories = totalCalories / 7;

        // Calculate average goal based on daily goals
        const totalGoalCalories = weeklyTotals.reduce((sum, day) => sum + day.goalCalories, 0);
        const avgGoalCalories = totalGoalCalories / 7;
        const goalAchievement = avgGoalCalories > 0 ? (avgDailyCalories / avgGoalCalories) * 100 : 0;

        // Calculate average protein target based on daily protein levels
        const totalProteinTarget = weeklyTotals.reduce((sum, day) => sum + day.proteinTarget, 0);
        const avgProteinTarget = totalProteinTarget / 7;
        const avgProtein = weeklyTotals.reduce((sum, day) => sum + day.protein + day.proteinG, 0) / 7;
        const proteinAchievement = avgProteinTarget > 0 ? (avgProtein / avgProteinTarget) * 100 : 0;

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
                        label: 'Daily Goals',
                        data: weeklyTotals.map(day => day.goalCalories),
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
                maintainAspectRatio: false,
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

        // Add resize listener for proper chart resizing
        this.setupResizeListener();
    }

    setupResizeListener() {
        // Debounce resize events to avoid excessive calls
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.charts.weeklyCalories) {
                    this.charts.weeklyCalories.resize();
                }
            }, 250);
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

            // Calculate macro achievement percentages
            const totalProtein = day.protein + day.proteinG;
            const proteinAchievement = day.proteinTarget > 0 ? (totalProtein / day.proteinTarget) * 100 : 0;

            // For fat and carbs, we need to calculate targets based on daily macro settings
            // Get the daily macro data to calculate fat and carb targets
            const dayData = this.weeklyData[day.dayKey] || {};
            const userWeight = this.settings?.weight || 70;
            const dailyFatLevel = dayData.fatLevel || 0;
            const fatTarget = userWeight * dailyFatLevel;
            const fatAchievement = fatTarget > 0 ? (day.fat / fatTarget) * 100 : 0;

            // For carbs, calculate remaining calories after protein and fat
            const proteinCalories = totalProtein * 4;
            const fatCalories = day.fat * 9;
            const remainingCalories = Math.max(0, day.goalCalories - proteinCalories - fatCalories);
            const carbTarget = remainingCalories / 4;
            const carbAchievement = carbTarget > 0 ? (day.carbs / carbTarget) * 100 : 0;

            // Helper function to get status class based on achievement percentage
            const getStatusClass = (achievement) => {
                if (achievement >= 95 && achievement <= 105) return 'status-excellent';
                if (achievement >= 90 && achievement <= 110) return 'status-good';
                return 'status-needs-improvement';
            };

            // Helper function to get background color for cells
            const getBackgroundColor = (achievement) => {
                if (achievement >= 95 && achievement <= 105) return '#d4edda'; // Green
                if (achievement >= 90 && achievement <= 110) return '#fff3cd'; // Yellow
                return '#f8d7da'; // Red
            };

            // Calculate calorie achievement percentage
            const calorieAchievement = day.goalCalories > 0 ? (day.calories / day.goalCalories) * 100 : 0;

            // Calculate overall status based on all macro achievements
            const macroAchievements = [
                { name: 'calories', value: calorieAchievement, hasTarget: day.goalCalories > 0 },
                { name: 'protein', value: proteinAchievement, hasTarget: day.proteinTarget > 0 },
                { name: 'fat', value: fatAchievement, hasTarget: fatTarget > 0 },
                { name: 'carbs', value: carbAchievement, hasTarget: carbTarget > 0 }
            ];

            // Only consider macros that have targets set
            const macrosWithTargets = macroAchievements.filter(macro => macro.hasTarget);

            let overallStatus = 'needs-improvement';
            if (macrosWithTargets.length > 0) {
                const excellentCount = macrosWithTargets.filter(macro =>
                    macro.value >= 95 && macro.value <= 105
                ).length;

                const goodCount = macrosWithTargets.filter(macro =>
                    macro.value >= 90 && macro.value <= 110
                ).length;

                const redCount = macrosWithTargets.filter(macro =>
                    macro.value < 90 || macro.value > 110
                ).length;

                // Determine overall status
                if (excellentCount === macrosWithTargets.length) {
                    overallStatus = 'excellent'; // All macros are excellent
                } else if (redCount === 0 && goodCount >= macrosWithTargets.length * 0.7) {
                    overallStatus = 'good'; // No red macros and at least 70% are good/excellent
                } else {
                    overallStatus = 'needs-improvement'; // Has red macros or too many yellows
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${day.day}</strong></td>
                <td>
                    ${day.calories > 0 ? 
                        `<span class="status-badge ${getStatusClass(calorieAchievement)}">${Math.round(day.calories)} / ${Math.round(day.goalCalories)} (${calorieAchievement.toFixed(0)}%)${day.dailyAdjustment !== 0 ? ` (${day.dailyAdjustment > 0 ? '+' : ''}${day.dailyAdjustment})` : ''}</span>` :
                        `${Math.round(day.calories)} / ${Math.round(day.goalCalories)}${day.dailyAdjustment !== 0 ? ` (${day.dailyAdjustment > 0 ? '+' : ''}${day.dailyAdjustment})` : ''}`
                    }
                </td>
                <td>
                    ${totalProtein > 0 && day.proteinTarget > 0 ? 
                        `<span class="status-badge ${getStatusClass(proteinAchievement)}">${totalProtein.toFixed(1)} / ${Math.round(day.proteinTarget)} (${proteinAchievement.toFixed(0)}%)</span>` :
                        `${totalProtein.toFixed(1)} / ${Math.round(day.proteinTarget)}`
                    }
                </td>
                <td>
                    ${fatTarget > 0 && day.fat > 0 ?
                        `<span class="status-badge ${getStatusClass(fatAchievement)}">${day.fat.toFixed(1)} / ${fatTarget.toFixed(1)} (${fatAchievement.toFixed(0)}%)</span>` :
                        fatTarget > 0 ? `${day.fat.toFixed(1)} / ${fatTarget.toFixed(1)}` : `${day.fat.toFixed(1)}`
                    }
                </td>
                <td>
                    ${carbTarget > 0 && day.carbs > 0 ?
                        `<span class="status-badge ${getStatusClass(carbAchievement)}">${day.carbs.toFixed(1)} / ${carbTarget.toFixed(1)} (${carbAchievement.toFixed(0)}%)</span>` :
                        carbTarget > 0 ? `${day.carbs.toFixed(1)} / ${carbTarget.toFixed(1)}` : `${day.carbs.toFixed(1)}`
                    }
                </td>
                <td><span class="status-badge status-${overallStatus}">${statusText[overallStatus]}</span></td>
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
        if (this.initialized) {
            console.log('WeightTracker already initialized, skipping');
            return;
        }

        try {
            console.log('Initializing WeightTracker...');
            await this.loadSettings();
            await this.loadWeightData();
            this.setupEventListeners();
            this.updateWeightStatistics();
            this.createWeightChart();
            this.updateWeightTable();
            this.initialized = true;
            console.log('WeightTracker initialized successfully');
        } catch (error) {
            console.error('WeightTracker: Initialization failed:', error);
            this.initialized = false; // Reset on failure
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
        document.getElementById('avgWeightChange').textContent = avgWeightChange ? `${avgWeightChange > 0 ? '+' : ''}${avgWeightChange.toFixed(1)} kg/week` : 'No data';
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

    calculateTotalWeightChange() {
        if (this.weightData.length < 2) return 0;
        // Calculate difference between current weight (first entry) and starting weight (last entry)
        const currentWeight = this.weightData[0].weight;
        const startingWeight = this.weightData[this.weightData.length - 1].weight;
        return currentWeight - startingWeight;
    }

    calculateAvgWeightChange() {
        if (this.weightData.length < 2) return 0;

        // Calculate actual days between first and last entry
        const firstEntry = this.weightData[this.weightData.length - 1]; // Oldest entry
        const lastEntry = this.weightData[0]; // Most recent entry
        
        const firstDate = new Date(firstEntry.date);
        const lastDate = new Date(lastEntry.date);
        const totalDays = Math.abs((lastDate - firstDate) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        
        if (totalDays === 0) return 0; // Same day entries
        
        const totalChange = this.calculateTotalWeightChange();

        // Calculate average change per week (7 days)
        const avgPerDay = totalChange / totalDays;
        return avgPerDay * 7; // Weekly average
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

        // Add resize listener for proper chart resizing
        this.setupWeightChartResizeListener();
    }

    setupWeightChartResizeListener() {
        // Debounce resize events to avoid excessive calls
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.chart) {
                    this.chart.resize();
                }
            }, 250);
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
        // Set global reference immediately to prevent double initialization
        window.reportsApp = this;

        this.nutritionReports = new NutritionReports();
        this.weightTracker = new WeightTracker();
        this.currentTab = 'nutrition';
        this.isInitialized = false;
        this.pendingTabSwitch = null;

        console.log('ReportsApp constructor called');
        this.init();
    }

    async init() {
        // Wait for DOM to be fully ready
        await this.waitForDOM();

        // Ensure proper initial state
        this.ensureInitialTabState();

        // Set up tab switching
        this.setupTabSwitching();

        // Initialize nutrition reports (default tab)
        await this.nutritionReports.init();

        // Mark as initialized
        this.isInitialized = true;

        // Process any pending tab switch
        if (this.pendingTabSwitch) {
            this.switchToTab(this.pendingTabSwitch);
            this.pendingTabSwitch = null;
        }

        // Make weight tracker globally accessible
        window.weightTracker = this.weightTracker;

        // Make app instance globally accessible
        window.reportsApp = this;

        // Set up comprehensive chart resize handling
        this.setupGlobalResizeHandler();
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                const checkReady = () => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkReady, 10);
                    }
                };
                checkReady();
            }
        });
    }

    ensureInitialTabState() {
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');
        const nutritionSection = document.getElementById('nutrition-section');
        const weightSection = document.getElementById('weight-section');

        if (nutritionTab && weightTab && nutritionSection && weightSection) {
            console.log('Setting initial tab state');

            // Deactivate all tabs
            nutritionTab.classList.remove('active');
            weightTab.classList.remove('active');

            // Hide all sections
            nutritionSection.classList.remove('active');
            weightSection.classList.remove('active');

            // Activate nutrition tab (default)
            nutritionTab.classList.add('active');
            nutritionSection.classList.add('active');

            console.log('Initial tab state set to nutrition');
        } else {
            console.error('Initial tab elements not found:', {
                nutritionTab: !!nutritionTab,
                weightTab: !!weightTab,
                nutritionSection: !!nutritionSection,
                weightSection: !!weightSection
            });
        }
    }

    setupTabSwitching() {
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');

        if (!nutritionTab || !weightTab) {
            console.error('Tab buttons not found');
            return;
        }

        console.log('Setting up custom tab switching');

        // Handle nutrition tab click
        nutritionTab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Nutrition tab clicked');
            this.switchToTab('nutrition');
        });

        // Handle weight tab click
        weightTab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Weight tab clicked');
            this.switchToTab('weight');
        });
    }

    switchToTab(tabName) {
        // If not initialized yet, queue the tab switch
        if (!this.isInitialized) {
            this.pendingTabSwitch = tabName;
            console.log(`Queuing tab switch to: ${tabName}`);
            return;
        }

        // Prevent switching if already on the same tab
        if (this.currentTab === tabName) {
            console.log(`Already on ${tabName} tab, skipping`);
            return;
        }

        console.log(`Switching from ${this.currentTab} to ${tabName}`);

        // Get tab buttons
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');

        // Get report sections
        const nutritionSection = document.getElementById('nutrition-section');
        const weightSection = document.getElementById('weight-section');

        // Validate elements exist
        if (!nutritionTab || !weightTab || !nutritionSection || !weightSection) {
            console.error('Required elements not found:', {
                nutritionTab: !!nutritionTab,
                weightTab: !!weightTab,
                nutritionSection: !!nutritionSection,
                weightSection: !!weightSection
            });
            return;
        }

        // Update current tab
        this.currentTab = tabName;

        // STEP 1: Deactivate all tab buttons
        nutritionTab.classList.remove('active');
        weightTab.classList.remove('active');

        // STEP 2: Hide all sections
        nutritionSection.classList.remove('active');
        weightSection.classList.remove('active');

        // STEP 3: Activate the selected tab and section
        if (tabName === 'nutrition') {
            nutritionTab.classList.add('active');
            nutritionSection.classList.add('active');
            console.log('Nutrition section activated');

        } else if (tabName === 'weight') {
            weightTab.classList.add('active');
            weightSection.classList.add('active');
            console.log('Weight section activated');

            // Initialize weight tracker if not already done
            this.weightTracker.init();
        }

        console.log(`Successfully switched to ${tabName} tab`);
    }

    setupGlobalResizeHandler() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('Window resized, updating charts...');

                // Resize nutrition chart if it exists and is visible
                if (this.nutritionReports.charts.weeklyCalories && this.currentTab === 'nutrition') {
                    this.nutritionReports.charts.weeklyCalories.resize();
                    console.log('Nutrition chart resized');
                }

                // Resize weight chart if it exists and is visible
                if (this.weightTracker.chart && this.currentTab === 'weight') {
                    this.weightTracker.chart.resize();
                    console.log('Weight chart resized');
                }

                // Force resize both charts regardless of current tab (for better reliability)
                setTimeout(() => {
                    if (this.nutritionReports.charts.weeklyCalories) {
                        this.nutritionReports.charts.weeklyCalories.resize();
                    }
                    if (this.weightTracker.chart) {
                        this.weightTracker.chart.resize();
                    }
                }, 100);

            }, 300); // Slightly longer debounce for better performance
        });
    }


}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.reportsApp) {
        console.log('Creating ReportsApp instance');
        window.reportsApp = new ReportsApp();
    } else {
        console.log('ReportsApp already exists, skipping initialization');
    }
});

// Also initialize on window load as backup for slow connections
window.addEventListener('load', () => {
    // Only initialize if not already done
    if (!window.reportsApp) {
        console.log('Creating ReportsApp instance on window load');
        window.reportsApp = new ReportsApp();
    } else {
        console.log('ReportsApp already exists on window load, skipping');
    }
}); 
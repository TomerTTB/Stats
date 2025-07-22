# Stats - Personal Nutrition Tracker.

A comprehensive web-based nutrition tracking application that helps you monitor daily food intake, calculate macronutrients, and manage meal planning.

## Features

### 🍽️ Daily Meal Tracking
- Track up to 6 meals per day across 7 days of the week
- Real-time nutritional calculations (calories, carbs, protein, fat)
- Interactive food search with autocomplete
- Automatic meal totals calculation
- Time-based meal scheduling

### 📊 Nutrition Analytics
- Macro breakdown with customizable protein and fat levels
- Calorie adjustment system
- Visual stat cards with color-coded sections
- Real-time percentage calculations
- Goal tracking and progress monitoring

### 🥗 Food Database Management
- Comprehensive food database with nutritional information
- Add, edit, and delete food items
- Search and filter functionality
- Inline editing capabilities
- CSV data import support

### ⚙️ Settings & Customization
- Unit system selection (metric/imperial)
- Personalized macro targets
- Adjustable calorie goals
- Persistent settings storage

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Stats
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Getting Started
1. Open the application in your browser
2. Navigate to **Settings** to configure your preferences
3. Use the **Foods** page to manage your food database
4. Track your meals on the **Diary** page

### Daily Tracking
- Select a day using the navigation buttons
- Click on any meal section to add food items
- Use the search function to find foods from your database
- Adjust portions using the amount input
- View real-time calculations in the totals section

### Food Management
- Add new foods with complete nutritional information
- Edit existing entries with inline editing
- Search through your food database
- Delete items you no longer need

## Project Structure

```
Stats/
├── public/                 # Frontend files
│   ├── components/        # Reusable HTML components
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   └── *.html            # Main pages
├── src/                   # Backend source code
│   ├── data/             # Data storage
│   └── routes/           # API routes
├── server.js             # Express server
└── package.json          # Dependencies
```

## Technologies Used

### Frontend
- **HTML5** - Structure and markup
- **CSS3** - Styling and layout
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap** - UI components and responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JSON** - Data storage format

### Features
- **Real-time calculations** - Instant nutritional updates
- **Responsive design** - Works on desktop and mobile
- **Local storage** - Persistent data without external database
- **Modular architecture** - Organized code structure

## API Endpoints

- `GET /api/foods` - Retrieve all foods
- `POST /api/foods` - Add new food item
- `PUT /api/foods/:id` - Update food item
- `DELETE /api/foods/:id` - Delete food item
- `GET /api/daily-meals/:day` - Get meals for specific day
- `POST /api/daily-meals/:day` - Save meals for specific day
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use. Feel free to modify and adapt to your needs.

## Support

For issues or questions, please create an issue in the repository or contact the maintainer.

---

**Happy tracking! 🎯** 

# Stats - Personal Nutrition Tracker

A comprehensive web-based nutrition tracking application that helps you monitor daily food intake, track weight changes, analyze nutritional data, and manage meal planning with SQLite database backend.

## Features

### 🍽️ Daily Meal Tracking
- Track up to 6 meals per day across 7 days of the week
- Real-time nutritional calculations (calories, carbs, protein, fat)
- Interactive food search with autocomplete
- Automatic meal totals calculation
- Time-based meal scheduling
- Persistent data storage with SQLite database

### 📊 Nutrition Analytics & Reports
- Comprehensive reports with visual charts and statistics
- Macro breakdown with customizable protein and fat levels
- Calorie adjustment system
- Visual stat cards with color-coded sections
- Real-time percentage calculations
- Goal tracking and progress monitoring
- Weekly and monthly nutrition trends

### ⚖️ Weight Tracking
- Log daily weight measurements
- **Today's Weight** - Current weight display
- **Last Change** - Recent weight change tracking
- **Overall Change** - Total progress since start
- **Average Change** - Typical rate of change
- Visual weight progression charts
- Weight history management

### 🥗 Food Database Management
- Comprehensive food database with nutritional information
- Add, edit, and delete food items
- Search and filter functionality
- Inline editing capabilities
- Persistent SQLite storage

### ⚙️ Settings & Customization
- Unit system selection (metric/imperial)
- Personalized macro targets
- Adjustable calorie goals
- User authentication system
- Persistent settings storage

### 🔐 Security & Authentication
- JWT-based stateless authentication
- Bcrypt password hashing with salt rounds
- Rate limiting for login attempts
- Input validation and sanitization
- Protected API endpoints
- Secure token management

### 📚 Documentation Site
- Comprehensive user documentation
- Getting started guides
- Feature explanations
- How-to tutorials
- Responsive design with sidebar navigation

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

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your secure values
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Security Configuration

### Environment Variables
Create a `.env` file with the following secure configurations:

```env
# JWT Configuration (REQUIRED for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production-make-it-different
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./src/data/nutrition_app.db

# Server Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15
```

### Security Features
- **JWT Authentication**: Stateless token-based authentication
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Protection**: Parameterized queries
- **Token Verification**: Database-backed token validation

### Production Security Checklist
- [ ] Change all default secrets in `.env`
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Monitor authentication logs
- [ ] Implement proper logging

## Usage

### Getting Started
1. Open the application in your browser
2. Create an account or log in
3. Navigate to **Settings** to configure your preferences
4. Use the **Foods DB** page to manage your food database
5. Track your meals on the **Diary** page
6. Monitor progress on the **Reports** page
7. Log weight changes in the **Weight** section

### Daily Tracking
- Select a day using the navigation buttons
- Click on any meal section to add food items
- Use the search function to find foods from your database
- Adjust portions using the amount input
- View real-time calculations in the totals section

### Weight Management
- Navigate to the Weight Tracking section
- Enter your current weight
- View statistics including latest change, total change, and averages
- Track progress over time with visual charts

### Food Management
- Add new foods with complete nutritional information
- Edit existing entries with inline editing
- Search through your food database
- Delete items you no longer need

### Reports & Analytics
- View comprehensive nutrition reports
- Analyze daily and weekly patterns
- Monitor macro distribution
- Track progress towards goals

## Project Structure

```
Stats/
├── public/                 # Frontend files
│   ├── components/        # Reusable HTML components
│   ├── css/              # Stylesheets
│   │   ├── common.css    # Shared styles
│   │   ├── components/   # Component-specific styles
│   │   └── pages/        # Page-specific styles
│   ├── js/               # JavaScript modules
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page-specific logic
│   │   └── utils/        # Utility functions
│   ├── docs/             # Documentation site
│   │   ├── features/     # Feature documentation
│   │   ├── guides/       # How-to guides
│   │   └── getting-started/ # Setup guides
│   └── *.html            # Main pages
├── src/                   # Backend source code
│   ├── database/         # Database services and models
│   │   ├── userService.js
│   │   ├── weightService.js
│   │   ├── settingsService.js
│   │   ├── foodService.js
│   │   └── mealService.js
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── dailyMealsRoutes.js
│   │   ├── foodsRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── weightRoutes.js
│   ├── middleware/       # Express middleware
│   │   └── auth.js
│   └── data/            # SQLite database storage
├── scripts/              # Utility scripts
├── server.js             # Express server
└── package.json          # Dependencies
```

## Technologies Used

### Frontend
- **HTML5** - Structure and markup
- **CSS3** - Styling and layout
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap 5** - UI components and responsive design
- **Chart.js** - Data visualization (for future chart implementations)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database for persistent data storage
- **bcryptjs** - Password hashing for authentication
- **express-session** - Session management

### Features
- **Real-time calculations** - Instant nutritional updates
- **Responsive design** - Works on desktop and mobile
- **SQLite database** - Reliable persistent data storage
- **User authentication** - Secure user sessions
- **Modular architecture** - Organized code structure
- **Comprehensive documentation** - Built-in help system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (protected)
- `GET /api/auth/profile` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `GET /api/auth/verify` - Verify JWT token validity
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/change-password` - Change user password (protected)

### Foods
- `GET /api/foods` - Retrieve all foods for user
- `POST /api/foods` - Add new food item
- `PUT /api/foods/:id` - Update food item
- `DELETE /api/foods/:id` - Delete food item

### Meals
- `GET /api/daily-meals/:day` - Get meals for specific day
- `POST /api/daily-meals/:day` - Save meals for specific day

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

### Weight Tracking
- `GET /api/weight` - Get all weight entries for user
- `POST /api/weight` - Add new weight entry
- `PUT /api/weight/:id` - Update weight entry
- `DELETE /api/weight/:id` - Delete weight entry

## Database Schema

The application uses SQLite with the following main tables:
- **users** - User accounts and authentication
- **foods** - Food database with nutritional information
- **meals** - Daily meal tracking data
- **weight_entries** - Weight tracking records
- **settings** - User preferences and configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Documentation

Visit `/docs` in the application for comprehensive documentation including:
- Quick start guide
- Feature explanations
- How-to tutorials
- Best practices

## License

This project is for personal use. Feel free to modify and adapt to your needs.

## Support

For issues or questions, please create an issue in the repository or contact the maintainer.

---

**Happy tracking! 🎯** 
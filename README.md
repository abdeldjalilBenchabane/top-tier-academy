# TTH - SchoolHouse Course Management System

A comprehensive React + Vite + Tailwind CSS application with Express.js backend and PostgreSQL database for managing educational courses and user authentication.

## 🚀 Features

### Frontend (React + Vite)
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Authentication System**: Complete login/registration with JWT tokens
- **User Avatar System**: Dynamic user avatars with dropdown menus
- **Role-Based Access**: Admin, Professor, and Student dashboards
- **Arabic RTL Support**: Full right-to-left language support
- **Real-time Updates**: Immediate UI updates without page refresh

### Backend (Express.js + PostgreSQL)
- **RESTful API**: Complete CRUD operations for users and courses
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for user passwords
- **Database Integration**: PostgreSQL with connection pooling
- **CORS Support**: Cross-origin resource sharing enabled

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd TTH_Lastone

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run init-db

# Start the backend server
npm run dev
```

The backend API will be available at `http://localhost:5001`

## 🗄️ Database Setup

### PostgreSQL Configuration
1. Create a PostgreSQL database
2. Update the `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   ```

### Database Initialization
```bash
cd backend
npm run init-db
```

This will:
- Create the necessary tables (users, courses, etc.)
- Insert sample data
- Set up proper permissions

## 🔐 Authentication System

### User Roles
- **Admin**: Full system access and user management
- **Professor**: Course creation and management
- **Student**: Course enrollment and learning

### Authentication Flow
1. **Registration**: Users can register with email, password, and role
2. **Login**: JWT token-based authentication
3. **Token Management**: Automatic token storage and validation
4. **Logout**: Secure token removal and session cleanup

### API Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
POST /api/auth/verify - Verify JWT token
```

## 🎨 User Interface Features

### Navigation System
- **Dynamic NavBar**: Shows login/register buttons when not authenticated
- **User Avatar**: Displays user's first name initial in a circle when logged in
- **Dropdown Menu**: Profile, settings, and logout options
- **Responsive Design**: Works on desktop and mobile devices

### Key Components
- **TTHHome**: Main landing page with Arabic RTL support
- **TTHLogin**: Arabic login interface
- **TTHStudentDashboard**: Student-specific dashboard
- **Admin/Professor Dashboards**: Role-specific interfaces

## 🛠️ Development

### Project Structure
```
TTH_Lastone/
├── src/
│   ├── components/
│   │   ├── NavBar.jsx          # Arabic navigation with user avatar
│   │   └── navigation/
│   │       └── Navbar.tsx      # English navigation
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── Pages/
│   │   ├── TTHHome.jsx         # Arabic home page
│   │   ├── TTHLogin.jsx        # Arabic login page
│   │   └── ...
│   └── services/
│       └── api.js              # API service functions
├── backend/
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management routes
│   │   └── courses.js          # Course management routes
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   └── db.js                   # Database connection
└── DATABASE_SETUP.md           # Database setup instructions
```

### Available Scripts
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run dev          # Start backend server
npm run init-db      # Initialize database
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tth_database
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
PORT=5001
```

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:8080` (Frontend development)
- `http://localhost:3000` (Alternative frontend port)

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
# Set NODE_ENV=production
npm start
# Deploy to your server (Heroku, DigitalOcean, etc.)
```

## 📝 Recent Updates

### Latest Features (v1.2.0)
- ✅ **User Avatar System**: Dynamic avatars with first name initials
- ✅ **Dropdown Navigation**: Profile menu with logout functionality
- ✅ **Immediate UI Updates**: No page refresh needed after login
- ✅ **Arabic RTL Support**: Full right-to-left language support
- ✅ **Responsive Design**: Mobile-friendly navigation
- ✅ **Authentication Fix**: Proper AuthContext integration

### Previous Features
- ✅ **JWT Authentication**: Secure token-based login system
- ✅ **PostgreSQL Integration**: Robust database backend
- ✅ **Role-Based Access**: Admin, Professor, Student roles
- ✅ **Course Management**: Full CRUD operations for courses
- ✅ **User Management**: Complete user administration system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the `DATABASE_SETUP.md` file for database issues
- Review the authentication flow in `AuthContext.tsx`
- Examine the API endpoints in the backend routes

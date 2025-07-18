# TTH - SchoolHouse Course Management System

A comprehensive React + Vite + Tailwind CSS application with Express.js backend and PostgreSQL database for managing educational courses, user authentication, and dynamic homepage slides.

## 🚀 Features

### Frontend (React + Vite)
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Authentication System**: Complete login/registration with JWT tokens
- **User Avatar System**: Dynamic user avatars with dropdown menus
- **Role-Based Access**: Admin, Professor, and Student dashboards
- **Arabic RTL Support**: Full right-to-left language support
- **Real-time Updates**: Immediate UI updates without page refresh
- **Dynamic Slides System**: Admin-managed homepage slides with hero-style layout
- **File Upload**: Image and video upload for slides

### Backend (Express.js + PostgreSQL)
- **RESTful API**: Complete CRUD operations for users, courses, and slides
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for user passwords
- **Database Integration**: PostgreSQL with connection pooling
- **CORS Support**: Cross-origin resource sharing enabled
- **File Upload System**: Multer-based file uploads for slides
- **Slides Analytics**: View and click tracking for slides

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

# ⚠️ IMPORTANT: Run the slides migration script first
node migrate-slides.js

# ⚠️ IMPORTANT: Run the languages migration script
node migrate-languages.js

# Initialize database
npm run init-db

# Start the backend server
npm run dev
```

The backend API will be available at `http://localhost:5001`

## 🗄️ Database Setup

### ⚠️ **IMPORTANT: Database Schema Updates**

**For team members:** The database schema has been updated with new slides functionality. You **MUST** run the migration script before starting the application.

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

### Database Initialization (Updated Process)
   ```bash
   cd backend

# 1. First, run the slides migration script
node migrate-slides.js

# 2. Run the languages migration script
node migrate-languages.js

# 3. Run the language course prices migration script
node create_language_course_prices_table.js

# 4. Then initialize the database
npm run init-db
```

This will:
- Create the enhanced slides tables and relationships
- Set up slides analytics and target audience tables
- Create the language and language level tables
- Create the language course prices table for course pricing
- Create the necessary tables (users, courses, etc.)
- Insert sample data
- Set up proper permissions

### New Database Tables
The following new tables have been added:
- `enhanced_slides` - Main slides table
- `slide_target_audience` - Target audience relationships
- `slide_analytics` - View and click tracking
- `languages` - Language management table
- `language_levels` - Language proficiency levels (A1, B2, C1, etc.)

## 🎠 Slides System

### Admin Slides Feature Dependencies
If you are working on the admin slides management interface, make sure you have the following packages installed in your frontend project:

```bash
npm install recharts lucide-react
```

### Admin Slides Management
- **Location**: `/admin/enhanced-slides`
- **Features**:
  - Upload images and videos
  - Set slide titles, descriptions, and CTAs
  - Configure target audience
  - Track views and clicks
  - Enable/disable slides

### Homepage Slides Display
- **Dynamic Content**: Slides automatically display on the homepage
- **Hero Style**: Matches the original hero design with Arabic RTL support
- **Auto-rotation**: Slides change every 5 seconds
- **Navigation**: Arrow controls and dot indicators
- **Responsive**: Works on all device sizes

### File Upload
- **Supported Formats**: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
- **Storage**: Files saved in `backend/uploads/slides/`
- **Access**: Files served via `/uploads/slides/` endpoint

## 🌍 Language Structure System

### Language Management
- **Location**: `/admin/structure` (Languages section)
- **Features**:
  - Add and manage languages (English, Arabic, French, etc.)
  - Set language codes (ISO 639-1 format)
  - Upload flag images for visual identification
  - Enable/disable languages

### Language Levels Management
- **CEFR Levels**: A1, A2, B1, B2, C1, C2 proficiency levels
- **Custom Levels**: Support for custom level names (e.g., Arabic: مبتدئ, متوسط, متقدم)
- **Ordering**: Sort levels by difficulty/progression
- **Descriptions**: Detailed descriptions for each level
- **Active/Inactive**: Enable or disable specific levels

### Sample Data
The system comes with pre-configured languages and levels:
- **English**: A1-C2 CEFR levels
- **Arabic**: مبتدئ, متوسط, متقدم levels
- **French**: A1-C2 CEFR levels
- **Spanish**: Available for configuration
- **German**: Available for configuration

### API Endpoints
```
# Language Management
GET /api/languages - Get all languages
POST /api/languages - Create new language
PUT /api/languages/:id - Update language
DELETE /api/languages/:id - Delete language

# Language Levels Management
GET /api/language-levels - Get all language levels
GET /api/languages/:languageId/levels - Get levels for specific language
POST /api/language-levels - Create new language level
PUT /api/language-levels/:id - Update language level
DELETE /api/language-levels/:id - Delete language level
```

## 💰 Language Course Pricing System

### Course Pricing Management
- **Location**: `/professor/create` (Language courses section)
- **Features**:
  - Set prices for language courses by level
  - Dynamic pricing based on language and proficiency level
  - Price validation and storage
  - Integration with course approval workflow

### Database Structure
- **Table**: `language_course_prices`
- **Columns**: `course_id`, `language_level_id`, `price`
- **Relationships**: Links courses to language levels with pricing

### API Endpoints
```
# Language Course Pricing
GET /api/courses/language-course-prices - Get all language course prices
POST /api/courses/language-course-price - Set price for language course
```

### Migration
To add the language course prices table, run:
```bash
node create_language_course_prices_table.js
```

## 🔐 Authentication System

### User Roles
- **Admin**: Full system access, user management, and slides management
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

# New Slides Endpoints
GET /api/slides - Get all slides (admin)
GET /api/slides/active - Get active slides (public)
POST /api/slides - Create new slide (admin)
PUT /api/slides/:id - Update slide (admin)
DELETE /api/slides/:id - Delete slide (admin)
POST /api/slides/:id/view - Track slide view
POST /api/slides/:id/click - Track slide click
```

## 🎨 User Interface Features

### Navigation System
- **Dynamic NavBar**: Shows login/register buttons when not authenticated
- **User Avatar**: Displays user's first name initial in a circle when logged in
- **Dropdown Menu**: Profile, settings, and logout options
- **Responsive Design**: Works on desktop and mobile devices

### Key Components
- **TTHHome**: Main landing page with dynamic slides (replaces static hero)
- **TTHSlides**: Dynamic slides component with hero-style layout
- **TTHLogin**: Arabic login interface
- **TTHStudentDashboard**: Student-specific dashboard
- **Admin/Professor Dashboards**: Role-specific interfaces
- **EnhancedHomepageSlides**: Admin slides management interface

## 🛠️ Development

### Project Structure
```
TTH_Lastone/
├── src/
│   ├── components/
│   │   ├── NavBar.jsx                    # Arabic navigation with user avatar
│   │   ├── TTHSlides.jsx                 # Dynamic slides component
│   │   ├── TTHFanCard.jsx                # Fixed DOM nesting issues
│   │   └── navigation/
│   │       └── Navbar.tsx                # English navigation
│   │   
│   ├── components/forms/
│   │   ├── LevelForm.tsx                 # Educational level form
│   │   ├── YearForm.tsx                  # Year form
│   │   ├── SpecialityForm.tsx            # Speciality form
│   │   ├── MaterialForm.tsx              # Material form
│   │   ├── LanguageForm.tsx              # Language form
│   │   └── LanguageLevelForm.tsx         # Language level form
│   ├── components/admin/
│   │   └── EnhancedHomepageSlides.tsx    # Admin slides management
│   ├── contexts/
│   │   └── AuthContext.tsx               # Authentication state management
│   ├── Pages/
│   │   ├── TTHHome.jsx                   # Arabic home page with slides
│   │   ├── TTHLogin.jsx                  # Arabic login page
│   │   └── ...
│   └── services/
│       └── api.js                        # API service functions
├── backend/
│   ├── routes/
│   │   ├── auth.js                       # Authentication routes
│   │   ├── users.js                      # User management routes
│   │   ├── courses.js                    # Course management routes
│   │   └── slides.js                     # Slides management routes
│   ├── middleware/
│   │   └── auth.js                       # JWT verification middleware
│   ├── uploads/slides/                   # Uploaded slide files
│   ├── migrate-slides.js                 # Database migration script
│   └── db.js                             # Database connection
└── DATABASE_SETUP.md                     # Database setup instructions
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
node migrate-slides.js # Run slides migration (IMPORTANT!)
node migrate-languages.js # Run languages migration (IMPORTANT!)
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

### Latest Changes (v2.1)
- ✅ **Added Dynamic Slides System**: Admin-managed homepage slides
- ✅ **File Upload Functionality**: Image and video uploads for slides
- ✅ **Slides Analytics**: View and click tracking
- ✅ **Database Schema Updates**: New tables for slides and analytics
- ✅ **Fixed DOM Nesting Issues**: Resolved React warnings in FanCard
- ✅ **Enhanced Admin Interface**: Complete slides management UI
- ✅ **Hero-Style Layout**: Slides match original hero design
- ✅ **Arabic RTL Support**: Full right-to-left support for slides
- ✅ **Added Language Structure System**: Complete language and level management
- ✅ **CEFR Level Support**: A1-C2 proficiency levels with custom naming
- ✅ **Multi-language Support**: English, Arabic, French, Spanish, German
- ✅ **Flag Integration**: Visual language identification with flag images
- ✅ **Enhanced Course Management**: Speciality-based suggestions and improved filtering
- ✅ **Language Course Pricing**: Dynamic pricing system for language courses
- ✅ **Role-Based Navigation**: Different navbar interfaces for students, professors, and admins
- ✅ **Interactive Course Content**: Video, image, and PDF navigation in course details
- ✅ **Improved Course Suggestions**: Better filtering and price display for related courses
- ✅ **Admin Path Assignment**: Admins can assign paths to approved courses without paths
- ✅ **File Upload Improvements**: Removed size limits and added warnings
- ✅ **Course Status Management**: Enhanced workflow for course approval and status updates

### For Team Members
⚠️ **IMPORTANT**: After pulling the latest changes, you must run:
   ```bash
cd backend
node migrate-slides.js
node migrate-languages.js
node create_language_course_prices_table.js
npm run init-db
```

This ensures your database has the new slides, language tables, and language course prices table with proper relationships.

## 🆕 Course Approval & Path Assignment Workflow (2024 Update)

### Database Changes
- Added `language_level_id` column to the `courses` table (migration required).
- Courses now support both material-based and language-based paths.
- Backend `/api/courses` endpoint supports filtering by `status` and `created_by`.

### Professor Flow
- Professors can assign a path (material or language level) to their course.
- Professors use a cascading PathSelector to choose Level → Year → Speciality → Material or Language → Level.
- Professors submit courses for approval; only pending courses are sent to admin.

### Admin Flow
- Admins see real pending courses at `/admin/pending`.
- Admins can approve or reject courses (with reason) but cannot assign paths.
- Approved courses appear in `/admin/courses`.
- The admin UI uses styled Approve/Reject buttons and robust error handling.

### New/Updated Endpoints
- `PUT /api/courses/:id/path` (professor assigns material path)
- `PUT /api/courses/:id/language-path` (professor assigns language path)
- `PUT /api/courses/:id/approve` (admin approves course)
- `PUT /api/courses/:id/reject` (admin rejects course)
- `GET /api/courses?status=pending` (admin fetches pending courses)
- `GET /api/courses?status=approved` (admin fetches approved courses)

### Frontend Improvements
- PathSelector uses cascading selects and fetches only relevant children.
- All API calls include Authorization headers for proper role-based access.
- Admin and professor flows are fully separated in the UI.
- Improved error handling and accessibility for all course management pages.

### Migration
To add the new `language_level_id` column, run the migration script:
```bash
node add_language_level_id_to_courses.js
```
To add the `course_covers` table (for course cover images), run:
```bash
node add_course_cover_table.js
```

## Database: Course Comments and Threaded Replies Setup

### Course Comments Table
To create the `course_comments` table (used for all course comments and professor replies), run the following script:

```sh
node backend/create-course-comments-table.js
```

### Threaded Replies Table
To create the `comment_replies` table (used for threaded conversations between students and professors), run the following script:

```sh
node backend/create-comment-replies-table.js
```

These tables work together to provide a complete commenting system:
- `course_comments`: Stores the main comments from students
- `comment_replies`: Stores threaded replies allowing back-and-forth conversations

Make sure your database connection settings are correct in your environment variables before running the scripts.

---

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

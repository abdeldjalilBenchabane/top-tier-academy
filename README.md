# TTH - SchoolHouse Course Management System

A comprehensive React + Vite + Tailwind CSS application with Express.js backend and PostgreSQL database for managing educational courses, user authentication, and dynamic homepage slides.

## 🚀 Features

### Frontend (React + Vite)
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Authentication System**: Complete login/registration with JWT tokens
- **Password Reset System**: Forgot password functionality with email verification
- **User Avatar System**: Dynamic user avatars with dropdown menus
- **Role-Based Access**: Admin, Professor, and Student dashboards
- **Arabic RTL Support**: Full right-to-left language support
- **Real-time Updates**: Immediate UI updates without page refresh
- **Dynamic Slides System**: Admin-managed homepage slides with hero-style layout
- **File Upload**: Image and video upload for slides

### 🎥 Live Streaming System (You + Me)
- **Agora RTC Integration**: Real-time video/audio streaming
- **Live Session Management**: Professors can create and manage live sessions
- **Purchase System**: Students can buy live sessions with points
- **File Upload Support**: Cover images for live sessions
- **Real-time Chat**: Socket.IO chat during live sessions
- **Professor Controls**: Mute/unmute all students, individual student mic control
- **Access Control**: Purchase verification before joining sessions
- **Student Dashboard**: Shows purchased upcoming live sessions count
- **Dynamic Role Switching**: Students can be promoted to host role to speak

### 🎯 Student Dashboard Enhancements (You + Me)
- **Live Sessions Count**: Shows purchased upcoming live sessions
- **Clickable Cards**: Navigate to live classes from dashboard
- **Real-time Stats**: Dynamic updates of session counts
- **Purchase Integration**: Seamless integration with points system

### 💰 Points System Integration (You + Me)
- **Live Session Purchases**: Students buy sessions with points
- **Double Purchase Prevention**: Prevents duplicate purchases
- **Transaction History**: Complete audit trail of point transactions
- **Database Triggers**: Automatic point balance updates
- **Purchase Verification**: Backend validation of purchases

### Backend (Express.js + PostgreSQL)
- **RESTful API**: Complete CRUD operations for users, courses, and slides
- **JWT Authentication**: Secure token-based authentication
- **Password Reset System**: Secure token-based password reset with email verification
- **Email Service**: Nodemailer integration for password reset emails
- **Password Hashing**: Bcrypt encryption for user passwords
- **Database Integration**: PostgreSQL with connection pooling
- **CORS Support**: Cross-origin resource sharing enabled
- **File Upload System**: Multer-based file uploads for slides
- **Slides Analytics**: View and click tracking for slides

### 🗄️ Database Enhancements (You + Me)
- **Live Sessions Table**: Enhanced with description, cover images, professor names
- **File Upload Support**: Express-fileupload middleware for live session covers
- **Performance Indexes**: Optimized queries for live sessions and purchases
- **Purchase System**: Complete transaction tracking with point deductions
- **Student Dashboard**: Real-time statistics and session counting
- **Socket.IO Integration**: Real-time communication for live streaming

## 🔧 Technical Implementation Details (You + Me)

### Live Streaming Architecture
- **Agora RTC SDK**: Real-time video/audio streaming
- **Socket.IO Server**: Real-time chat and control events
- **Dynamic Role Management**: Students can switch between audience and host roles
- **File Upload System**: Express-fileupload for cover images
- **Purchase Verification**: Backend validation before session access

### Database Schema Changes
```sql
-- Live Sessions Table Enhancements
ALTER TABLE live_sessions ADD COLUMN description TEXT;
ALTER TABLE live_sessions ADD COLUMN cover_image_url VARCHAR(500);
ALTER TABLE live_sessions ADD COLUMN professor_name VARCHAR(255);
ALTER TABLE live_sessions ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE live_sessions ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
ALTER TABLE live_sessions ADD COLUMN meeting_url VARCHAR(500);

-- Performance Indexes
CREATE INDEX idx_live_sessions_professor_id ON live_sessions(professor_id);
CREATE INDEX idx_live_sessions_start_time ON live_sessions(start_time);
CREATE INDEX idx_live_sessions_is_approved ON live_sessions(is_approved);
CREATE INDEX idx_purchases_session_id ON purchases(session_id);
CREATE INDEX idx_purchases_student_id ON purchases(student_id);
```

### Key Features Implemented
1. **Live Session Creation**: Professors can create sessions with cover images
2. **Purchase System**: Students buy sessions with points
3. **Access Control**: Verification before joining sessions
4. **Real-time Chat**: Socket.IO chat during sessions
5. **Professor Controls**: Mute/unmute functionality
6. **Student Dashboard**: Real-time session counting
7. **File Upload**: Cover image support for sessions

### API Endpoints Added
- `POST /api/professors/:id/live-sessions` - Create live session
- `POST /api/live-sessions/:id/purchase` - Purchase session
- `GET /api/live-sessions/:id/access` - Check access
- `GET /api/users/student/overview` - Student dashboard stats

## 📧 Password Reset System

### Features
- **Forgot Password**: Users can request password reset via email
- **Secure Tokens**: Time-limited reset tokens (1 hour expiration)
- **Email Verification**: Password reset links sent to user's email
- **Dual Platform Support**: Separate flows for TTH and SchoolHouse platforms
- **Security**: Tokens are single-use and expire automatically
- **User-Friendly**: Clear success/error messages and automatic redirects

### Email Configuration
The system supports multiple email providers:

#### Option 1: Gmail (Recommended for Production)
1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password**: Google Account → Security → 2-Step Verification → App passwords
3. **Use App Password**: 16-character password (no spaces) in `.env`
4. **Update `.env`**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your16characterapppassword
   LOG_EMAILS=false
   ```

#### Option 2: Mailtrap (For Testing)
1. Create free account at [Mailtrap.io](https://mailtrap.io/)
2. Get SMTP credentials from your inbox
3. **Update `.env`**:
   ```env
   USE_MAILTRAP=true
   MAILTRAP_USER=your_mailtrap_username
   MAILTRAP_PASS=your_mailtrap_password
   ```

#### Option 3: Development Mode (Console Logging)
For frontend testing without sending emails:
```env
LOG_EMAILS=true
```

### ⚠️ Important Email Notes
- **Check Spam Folder**: Password reset emails may go to spam/junk folder
- **Gmail App Password**: Regular Gmail password won't work - must use App Password
- **Token Expiration**: Reset links expire after 1 hour for security
- **Single Use**: Each reset token can only be used once

### Password Reset Flow
1. User clicks "Forgot Password" on login page
2. Enters email address
3. System sends reset link to email (or logs to console in dev mode)
4. User clicks link in email
5. User sets new password
6. Success message shown and redirect to login

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager
- Email service (Gmail, Mailtrap, or other SMTP provider)

### Database Setup

#### 1. Initial Database Setup
```bash
# Run the main schema
psql -U your_username -d your_database -f schema.sql
```

#### 2. Apply Our Changes Migration (You + Me)
```bash
cd backend
node apply-our-changes-migration.js
```

This migration adds the following columns to `live_sessions` table:
- `description TEXT` - Session description
- `cover_image_url VARCHAR(500)` - Cover image URL
- `professor_name VARCHAR(255)` - Professor's name
- `is_approved BOOLEAN DEFAULT FALSE` - Approval status
- `status VARCHAR(50)` - Session status (scheduled, live, ended, etc.)
- `meeting_url VARCHAR(500)` - Meeting URL

#### 3. Apply Friend's Changes Migration
```bash
cd backend
node create-homepage-materials-table.js
node create-footer-content-table.js
node update-materials-speciality-nullable.js
node add-material-id-to-years.js
node fix-education-structure.js
node remove-path-type-column.js
```

#### 4. Install Additional Dependencies
```bash
npm install express-fileupload
```

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
cp ../env-template.txt .env
# Edit .env with your database and email credentials

# ⚠️ IMPORTANT: Run the password reset migration script first
node add-password-reset-table.js

# ⚠️ IMPORTANT: Run the slides migration script
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

**For team members:** The database schema has been updated with password reset functionality and slides system. You **MUST** run the migration scripts before starting the application.

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

# 1. First, run the password reset migration script
node add-password-reset-table.js

# 2. Run the slides migration script
node migrate-slides.js

# 3. Run the languages migration script
node migrate-languages.js

# 4. Run the language course prices migration script
node create_language_course_prices_table.js

# 5. Then initialize the database
npm run init-db
```

This will:
- Create the password reset tokens table
- Create the enhanced slides tables and relationships
- Set up slides analytics and target audience tables
- Create the language and language level tables
- Create the language course prices table for course pricing
- Create the necessary tables (users, courses, etc.)
- Insert sample data
- Set up proper permissions

### New Database Tables
The following new tables have been added:
- `password_reset_tokens` - Secure password reset tokens with expiration
- `enhanced_slides` - Main slides table
- `slide_target_audience` - Target audience relationships
- `slide_analytics` - View and click tracking
- `languages` - Language management table
- `language_levels` - Language proficiency levels (A1, B2, C1, etc.)

## 🔧 Environment Variables

### Required Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tth_database
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=replace_me_with_a_long_random_string

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
FRONTEND_URL=http://localhost:5173

# Optional: Development mode (logs emails to console)
LOG_EMAILS=true

# Optional: Mailtrap for testing
USE_MAILTRAP=false
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

## 📝 Changelog

### 2025-07-13 02:26 AM - Password Reset System Implementation

#### ✅ Added Features
- **Complete Password Reset System**: Forgot password functionality for both TTH and SchoolHouse platforms
- **Email Service Integration**: Nodemailer with Gmail and Mailtrap support
- **Secure Token System**: Time-limited, single-use password reset tokens
- **Database Migration**: Added `password_reset_tokens` table with proper indexing
- **Frontend Pages**: 
  - `/forgot-password` - TTH forgot password page (Arabic)
  - `/schoolhouse/forgot-password` - SchoolHouse forgot password page (English)
  - `/reset-password` - TTH password reset page (Arabic)
  - `/schoolhouse/reset-password` - SchoolHouse password reset page (English)
- **Backend API Endpoints**:
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/verify-reset-token` - Verify reset token
  - `POST /api/auth/reset-password` - Set new password
- **Email Templates**: Beautiful HTML emails for both platforms
- **Development Mode**: Console logging for testing without email sending
- **Error Handling**: Comprehensive error messages and validation

#### 🔧 Technical Improvements
- **Environment Configuration**: Updated `.env` template with email settings
- **Email Service**: Modular email service with multiple provider support
- **Security**: Token expiration, single-use tokens, password validation
- **UI/UX**: Responsive design, loading states, success/error messages
- **RTL Support**: Proper Arabic layout with left-positioned eye icons
- **Testing**: Email configuration test scripts

#### 📁 Files Added/Modified
- **New Files**:
  - `backend/migrations/add-password-reset-table.js`
  - `backend/services/emailService.js`
  - `src/Pages/TTHForgotPassword.jsx`
  - `src/Pages/TTHResetPassword.jsx`
  - `src/Pages/ForgotPassword.tsx`
  - `src/Pages/ResetPassword.tsx`
  - `test-email-config.js`
  - `test-forgot-password-api.js`
  - `env-template.txt` (updated)

- **Modified Files**:
  - `backend/routes/auth.js` - Added password reset endpoints
  - `src/services/api.js` - Added password reset API calls
  - `src/App.tsx` - Added new routes
  - `README.md` - Updated with password reset documentation

#### 🚀 How to Use
1. **Set up email configuration** in `.env` file
2. **Run database migration**: `node add-password-reset-table.js`
3. **Restart backend server** to load new environment variables
4. **Test the flow**: Use forgot password on login pages
5. **Check email** (or console logs in dev mode) for reset links

#### ⚠️ Important Notes
- **Email Configuration**: Must set up Gmail App Password or use Mailtrap
- **Spam Folder**: Check spam/junk folder for password reset emails
- **Token Expiration**: Reset links expire after 1 hour
- **Development Mode**: Use `LOG_EMAILS=true` for testing without sending emails

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
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
FRONTEND_URL=http://localhost:8080
LOG_EMAILS=false
# Agora Configuration (for live sessions)
AGORA_APP_ID=e8a09e60ab1548d4b0f18a0cd440f8b7
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Chargily Configuration (for payments)
VITE_SUCCESS_URL=http://localhost:5173/payments/success
VITE_CHARGILY_API_KEY=test_sk_YcXA8HSxOJi6VrbwKPcophmvfIWzCpyqH25mmJx8
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

## 🆕 Private Classes Request System (2024)

### Student Features
- Students can request private classes with a real teacher by selecting a teacher, date, and filling out a request form.
- All requests (except rejected) appear in the "طلباتك" section, showing their current status (pending or confirmed).
- When a teacher accepts a request, the card remains visible and the status changes to "مؤكد" (confirmed).
- If a request is rejected, it disappears from the student's list.

### Professor Features
- Professors have a new dashboard sidebar item: **الحصص الخاصة** (Private Classes).
- Professors see all requests addressed to them, with the student's name and request details.
- Professors can **accept** (choose a time slot) or **refuse** each request directly from the card.
- Accepted requests remain visible with a green confirmation message; refused requests are hidden from the professor's view.

### Backend/API
- New table: `private_class_requests` for storing all requests.
- New endpoints:
  - `POST /api/private-class-requests` — Create a new request
  - `GET /api/private-class-requests/student/:id` — Get a student's requests
  - `GET /api/private-class-requests/teacher/:teacherName` — Get all requests for a teacher
  - `PATCH /api/private-class-requests/:id/status` — Accept/refuse a request (and set time)

### UI/UX
- All request cards use the same modern card design as the rest of the app.
- Status and actions update in real time for both students and professors.
- Section titles and logic updated to reflect the new workflow.

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

## Database Migration for Private Classes Live Feature

If you encounter errors related to missing columns (such as `scheduled_at` or `agora_channel`) in the `private_class_requests` table, run the following SQL in your PostgreSQL database:

```sql
ALTER TABLE private_class_requests
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS agora_channel VARCHAR(100);
```

This will ensure your database is compatible with the private classes live session feature.

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

## 📊 Tables pour Dashboard Étudiant

### student_courses
- Suit la progression de chaque étudiant dans chaque cours.
- Champs : `student_id`, `course_id`, `completed`, `progress`, `hours_spent`, `last_accessed`

### activities
- Historique des actions de l’étudiant (cours terminés, sessions suivies, commentaires, etc.)
- Champs : `student_id`, `type`, `title`, `time`, `related_id`, `extra`

### live_sessions
- Sessions en direct programmées par les professeurs.
- Champs : `professor_id`, `course_id`, `title`, `start_time`, `duration`, `price`, `is_approved`, `is_rejected`, `status`, `meeting_url`

### purchases
- Achats de sessions live par les étudiants.
- Champs : `session_id`, `student_id`, `amount_paid`, `purchased_at`

### Utilisation
- Ces tables permettent d’alimenter dynamiquement le dashboard étudiant : stats, progression, activités récentes, etc.
- Les endpoints créés : `/api/users/student/overview`, `/api/users/student/activities`, `/api/users/student/profile`, `/api/users/student/live-sessions`

## 🎯 Dashboard Étudiant Dynamique

### Fonctionnalités
- **Statistiques en temps réel** : cours totaux, complétés, en cours, heures passées
- **Profil dynamique** : nom, avatar, informations utilisateur réelles
- **Activités récentes** : historique des actions de l'étudiant
- **Sessions live** : sessions achetées et publiques avec pagination
- **Calendrier interactif** : visualisation des sessions par date

### Endpoints Backend
```
GET /api/users/student/overview - Statistiques du dashboard
GET /api/users/student/activities - Activités récentes
GET /api/users/student/profile - Informations du profil
GET /api/users/student/live-sessions - Sessions live avec filtres
```

### Migration Base de Données
Pour créer les tables nécessaires au dashboard étudiant :
```bash
cd backend
node migrate-student-dashboard.js
```

### Structure des Données
- **Overview** : `totalCourses`, `completedCourses`, `inProgressCourses`, `totalHours`, `upcomingLives`
- **Activities** : `type`, `title`, `time`, `related_id`, `extra`
- **Live Sessions** : sessions avec statut, type d'accès, prix, professeur
- **Profile** : informations utilisateur avec avatar

### Interface Utilisateur
- **Cartes compactes** pour les sessions live
- **Pagination** pour gérer beaucoup de sessions
- **Filtres** : recherche, type de session, statut
- **Calendrier** avec indicateurs visuels des sessions
- **Responsive design** pour tous les appareils

## Updating the Points System Trigger (PostgreSQL)

To ensure points are only added when a transaction is marked as 'completed', update your database trigger and function as follows:

```sql
CREATE OR REPLACE FUNCTION update_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add points if status is 'completed' and it was not completed before
    IF (TG_OP = 'INSERT' AND (NEW.transaction_type = 'purchase' OR NEW.transaction_type = 'bonus') AND NEW.status = 'completed')
    OR (TG_OP = 'UPDATE' AND (NEW.transaction_type = 'purchase' OR NEW.transaction_type = 'bonus') AND NEW.status = 'completed' AND OLD.status <> 'completed') THEN
        INSERT INTO user_points (user_id, balance, updated_at)
        VALUES (NEW.user_id, 
                COALESCE((SELECT balance FROM user_points WHERE user_id = NEW.user_id), 0) + NEW.points,
                CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            balance = user_points.balance + NEW.points,
            updated_at = CURRENT_TIMESTAMP;
    ELSIF NEW.transaction_type = 'spend' THEN
        INSERT INTO user_points (user_id, balance, updated_at)
        VALUES (NEW.user_id, 
                COALESCE((SELECT balance FROM user_points WHERE user_id = NEW.user_id), 0) - NEW.points,
                CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            balance = user_points.balance - NEW.points,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_points_balance ON point_transactions;

CREATE TRIGGER trigger_update_user_points_balance
    AFTER INSERT OR UPDATE ON point_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_balance();
```

**Run this SQL in your PostgreSQL database after deploying or updating the backend to ensure correct points logic.**

## 🗄️ Database Migrations & Changes

### For New Team Members / Friends

When you clone this repository or when database changes are made, you need to run the migration scripts to update your database schema.

#### Quick Setup for New Team Members:

1. **Clone the repository** and navigate to the project directory
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (copy from `.env.example`)
4. **Run database migrations** automatically:

```bash
# Navigate to backend folder
cd backend

# Run today's database changes (RECOMMENDED)
node todays-migrations.js
```

**OR** run migrations manually in order:

```bash
# Run all migration files in order
node add_language_level_id_to_courses.js
node create_language_course_prices_table.js
node update-materials-year-null.js
node fix-education-structure.js
node remove-path-type-column.js
```

#### When Database Changes Are Made:

1. **Check the `DATABASE_MIGRATIONS.md` file** for new migration scripts
2. **Run new migration files** in chronological order
3. **Test the application** to ensure everything works
4. **Update the migration documentation** if you add new migrations

#### Important Notes:

- **Always backup your database** before running migrations
- **Run migrations in order** as listed in `DATABASE_MIGRATIONS.md`
- **Test thoroughly** after each migration
- **Check for errors** in the console output
- **Contact the team** if you encounter issues

#### Migration Scripts Location:

All migration scripts are located in the `backend/` folder and follow the naming convention:
- `add_*.js` - Adding new columns/tables
- `create_*.js` - Creating new tables
- `update_*.js` - Updating existing data
- `remove_*.js` - Removing columns/tables
- `fix_*.js` - Fixing data inconsistencies

#### Current Database Schema:

**Key Tables:**
- `courses` - Main courses table with language and material support
- `languages` - Available languages
- `language_levels` - Language proficiency levels
- `language_course_prices` - Pricing for language courses
- `materials` - Educational materials
- `levels` - Educational levels (primary, secondary, etc.)
- `years` - Academic years
- `specialities` - Subject specializations
- `users` - User accounts and profiles

**Important Columns:**
- `courses.language_level_id` - Links to language_levels table
- `courses.material_id` - Links to materials table
- `materials.year_id` - Direct link to years (can be null)
- `materials.speciality_id` - Link to specialities (can be null)

For detailed migration information, see `DATABASE_MIGRATIONS.md`.


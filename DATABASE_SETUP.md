# PostgreSQL Database Setup Guide

## Prerequisites

1. **Install PostgreSQL** on your system:
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from https://www.postgresql.org/download/windows/

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql`
   - **Ubuntu/Debian**: `sudo systemctl start postgresql`
   - **Windows**: PostgreSQL service should start automatically

## Database Setup Steps

### 1. Create Database and User

Connect to PostgreSQL as the postgres user:

```bash
# macOS
psql postgres

# Ubuntu/Debian
sudo -u postgres psql

# Windows
psql -U postgres
```

Create the database and user:

```sql
CREATE DATABASE tth_database;
CREATE USER tth_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tth_database TO tth_user;
\q
```

### 2. Configure Environment Variables

Update the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tth_database
DB_USER=tth_user
DB_PASSWORD=your_secure_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=***REMOVED***
```

### 3. Initialize Database

Run the database initialization script:

```bash
npm run db:init
```

This will:
- Create all tables from `schema.sql`
- Insert sample data (levels, years, specialities, materials, slides)

### 4. Start the Server

Start the development server:

```bash
npm run server:dev
```

Or start the production server:

```bash
npm run server
```

## API Endpoints

### Health Checks
- `GET /api/health` - Server health check
- `GET /api/db-health` - Database connection check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify JWT token (protected)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID with sections and blocks
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/materials/list` - Get materials list

## Authentication Flow

### Login Process
1. User submits email and password
2. Server validates credentials against database
3. If valid, server generates JWT token
4. Token is returned to client and stored in localStorage
5. Client includes token in subsequent requests

### Registration Process
1. User submits registration form
2. Server validates input data
3. Password is hashed using bcrypt
4. User is created in database
5. JWT token is generated and returned
6. User is automatically logged in

### Protected Routes
- Include `Authorization: Bearer <token>` header
- Server validates token on each request
- Invalid/expired tokens return 401/403 errors

## Database Schema Overview

The database includes the following main tables:

- **users** - User accounts and authentication
- **levels** - Academic levels (Bachelor, Master, PhD)
- **years** - Academic years within levels
- **specialities** - Academic specialities within years
- **materials** - Course materials with pricing
- **courses** - Course information and metadata
- **course_sections** - Course content sections
- **section_blocks** - Individual content blocks within sections
- **quizzes** - Quiz information and metadata
- **quiz_questions** - Quiz questions
- **quiz_answers** - Quiz answer options
- **live_sessions** - Live session scheduling
- **slides** - Homepage slides and content

## Frontend Integration

### API Service
The frontend uses a centralized API service (`src/services/api.js`) that:
- Handles authentication tokens automatically
- Provides consistent error handling
- Manages API base URL configuration

### Authentication Context
The app uses React Context (`src/contexts/AuthContext.tsx`) to:
- Manage user state globally
- Provide login/logout functions
- Handle token persistence
- Redirect users based on roles

### Login Pages
- `/login` - SchoolHouse login (English)
- `/schoolhouse/login` - TTH login (Arabic)
- `/register` - User registration

## Troubleshooting

### Common Issues

1. **Connection refused**: Make sure PostgreSQL is running
2. **Authentication failed**: Check username/password in `.env`
3. **Database does not exist**: Run the database creation commands
4. **Permission denied**: Ensure the user has proper privileges
5. **JWT token errors**: Check JWT_SECRET in `.env`
6. **CORS errors**: Ensure frontend URL is allowed in backend CORS config

### Useful Commands

```bash
# Check PostgreSQL status (macOS)
brew services list | grep postgresql

# Connect to database
psql -h localhost -U tth_user -d tth_database

# List all tables
\dt

# View table structure
\d table_name

# Reset database (WARNING: This will delete all data)
DROP DATABASE tth_database;
CREATE DATABASE tth_database;
npm run db:init

# Test authentication endpoints
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"student"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Development Workflow

1. Start PostgreSQL service
2. Ensure `.env` is configured correctly
3. Run `npm run db:init` (only needed once or after schema changes)
4. Run `npm run server:dev` for development
5. Frontend can be started with `npm run dev`

## Production Deployment

For production deployment:

1. Use a production PostgreSQL instance
2. Set `NODE_ENV=production` in environment variables
3. Use strong passwords and secure JWT secrets
4. Configure proper firewall rules
5. Set up database backups
6. Use connection pooling (already configured in `db.js`)
7. Enable HTTPS for secure token transmission
8. Implement rate limiting for authentication endpoints 
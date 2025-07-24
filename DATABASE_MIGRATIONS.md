# Database Migrations & Changes

This document tracks all database schema changes and migrations that have been applied to the TTH application.

## Recent Database Changes

### 1. Language Course Structure
- **Date**: July 2024
- **Changes**: Added language course support
- **Files**: 
  - `backend/add_language_level_id_to_courses.js`
  - `backend/create_language_course_prices_table.js`

### 2. Education Structure Updates
- **Date**: July 2024
- **Changes**: Modified materials table to support direct year assignment
- **Files**:
  - `backend/update-materials-year-null.js`
  - `backend/fix-education-structure.js`

### 3. Path Type Column Removal
- **Date**: July 2024
- **Changes**: Removed path_type column from courses table
- **Files**:
  - `backend/remove-path-type-column.js`

## How to Apply Database Changes

### For New Team Members / Friends:

1. **Clone the repository** and navigate to the project directory
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (copy from `.env.example`)
4. **Run database migrations** in order:

```bash
# Run all migration files in the backend folder
node backend/add_language_level_id_to_courses.js
node backend/create_language_course_prices_table.js
node backend/update-materials-year-null.js
node backend/fix-education-structure.js
node backend/remove-path-type-column.js
```

### When New Database Changes Are Made:

1. **Check this file** for new migration scripts
2. **Run new migration files** in chronological order
3. **Test the application** to ensure everything works
4. **Update this document** if you add new migrations

## Migration Scripts Location

All migration scripts are located in the `backend/` folder and follow the naming convention:
- `add_*.js` - Adding new columns/tables
- `create_*.js` - Creating new tables
- `update_*.js` - Updating existing data
- `remove_*.js` - Removing columns/tables
- `fix_*.js` - Fixing data inconsistencies

## Important Notes

- **Always backup your database** before running migrations
- **Run migrations in order** as listed in this document
- **Test thoroughly** after each migration
- **Check for errors** in the console output
- **Contact the team** if you encounter issues

## Current Database Schema

### Key Tables:
- `courses` - Main courses table with language and material support
- `languages` - Available languages
- `language_levels` - Language proficiency levels
- `language_course_prices` - Pricing for language courses
- `materials` - Educational materials
- `levels` - Educational levels (primary, secondary, etc.)
- `years` - Academic years
- `specialities` - Subject specializations
- `users` - User accounts and profiles

### Important Columns:
- `courses.language_level_id` - Links to language_levels table
- `courses.material_id` - Links to materials table
- `materials.year_id` - Direct link to years (can be null)
- `materials.speciality_id` - Link to specialities (can be null) 
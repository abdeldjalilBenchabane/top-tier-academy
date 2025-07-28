# Slides Tables Migration

## 📋 Overview

This migration creates all the slides-related tables for the enhanced slides system. Your friend's database doesn't have any slides tables, so this will create the complete system from scratch.

## 🎯 What Gets Created

### 1. **enhanced_slides** (Main slides table)
The main table that stores all slide information with 22 columns:

```sql
CREATE TABLE enhanced_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    media_type VARCHAR(20) DEFAULT 'image',
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    duration INTEGER,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience TEXT[],
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    overlay_color VARCHAR(7) DEFAULT '#000000',
    overlay_opacity DECIMAL(3,2) DEFAULT 0.3,
    transition VARCHAR(20) DEFAULT 'fade',
    alt_text VARCHAR(255),
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **slide_analytics** (Analytics tracking)
Tracks views and clicks on slides:

```sql
CREATE TABLE slide_analytics (
    id SERIAL PRIMARY KEY,
    slide_id INTEGER REFERENCES enhanced_slides(id),
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(20) CHECK (action_type IN ('view', 'click')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **slide_target_audience** (Target audience mapping)
Maps slides to specific user roles:

```sql
CREATE TABLE slide_target_audience (
    slide_id INTEGER REFERENCES enhanced_slides(id),
    audience_role VARCHAR(20) CHECK (audience_role IN ('student', 'professor', 'admin')),
    PRIMARY KEY (slide_id, audience_role)
);
```

## 🚀 Migration Options

### Option 1: Run JavaScript Migration Script (Recommended)
```bash
# Make sure you're in the backend directory
cd backend

# Run the migration script
node create-slides-tables.js
```

### Option 2: Run SQL Script Directly
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the SQL script
\i create-slides-tables.sql
```

### Option 3: Manual SQL Commands
If you prefer to run commands manually, copy and paste these into your database:

```sql
-- 1. Create enhanced_slides table
CREATE TABLE enhanced_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    duration INTEGER,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience TEXT[],
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    overlay_color VARCHAR(7) DEFAULT '#000000',
    overlay_opacity DECIMAL(3,2) DEFAULT 0.3,
    transition VARCHAR(20) DEFAULT 'fade',
    alt_text VARCHAR(255),
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create slide_analytics table
CREATE TABLE slide_analytics (
    id SERIAL PRIMARY KEY,
    slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'click')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create slide_target_audience table
CREATE TABLE slide_target_audience (
    slide_id INTEGER REFERENCES enhanced_slides(id) ON DELETE CASCADE,
    audience_role VARCHAR(20) NOT NULL CHECK (audience_role IN ('student', 'professor', 'admin')),
    PRIMARY KEY (slide_id, audience_role)
);

-- 4. Create indexes
CREATE INDEX idx_enhanced_slides_active ON enhanced_slides(is_active);
CREATE INDEX idx_enhanced_slides_order ON enhanced_slides("order");
CREATE INDEX idx_enhanced_slides_created_at ON enhanced_slides(created_at);
CREATE INDEX idx_slide_analytics_slide_id ON slide_analytics(slide_id);
CREATE INDEX idx_slide_analytics_created_at ON slide_analytics(created_at);
CREATE INDEX idx_slide_target_audience_slide_id ON slide_target_audience(slide_id);

-- 5. Create update function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enhanced_slides_updated_at 
    BEFORE UPDATE ON enhanced_slides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## 📊 What Each Table Does

### **enhanced_slides**
- **Main slides storage** - All slide content and metadata
- **Media support** - Images and videos with URLs
- **Scheduling** - Start/end dates for time-based display
- **Targeting** - Audience roles (student, professor, admin)
- **Analytics** - Built-in view and click counters
- **Styling** - Overlay colors, opacity, transitions
- **CTAs** - Call-to-action buttons and links

### **slide_analytics**
- **View tracking** - Records when slides are viewed
- **Click tracking** - Records when CTAs are clicked
- **User identification** - Links actions to specific users
- **IP tracking** - Stores visitor IP addresses
- **User agent** - Browser/device information

### **slide_target_audience**
- **Role-based targeting** - Shows slides only to specific user types
- **Many-to-many relationship** - One slide can target multiple roles
- **Flexible permissions** - Easy to add/remove target audiences

## ✅ Verification

After running the migration, verify it worked by checking:

```sql
-- Check all tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('enhanced_slides', 'slide_analytics', 'slide_target_audience')
ORDER BY table_name;

-- Check enhanced_slides columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enhanced_slides' 
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('enhanced_slides', 'slide_analytics', 'slide_target_audience')
ORDER BY tablename, indexname;
```

## 🔧 Additional Setup Required

### 1. Create Uploads Directory
After running the migration, create the uploads directory:

```bash
# In your backend directory
mkdir -p uploads/slides
```

### 2. Install Frontend Dependencies
If using the admin slides interface, install these packages:

```bash
npm install recharts lucide-react
```

### 3. Add Routes to Backend
Make sure your backend has the slides routes:

```javascript
// In your main server file
import slidesRoutes from './routes/slides.js';
app.use('/api/slides', slidesRoutes);
```

## 🔧 Troubleshooting

### Error: "Table already exists"
- This is normal if you've already run the migration
- The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### Error: "Permission denied"
- Make sure your database user has CREATE TABLE permissions
- You may need to run as a database superuser

### Error: "users table does not exist"
- The slides tables reference the users table
- Make sure you have a users table before running this migration

### Error: "Function already exists"
- The update function gets replaced automatically
- This is normal and expected

## 🎉 After Migration

Once the migration is complete, your database will support:

- ✅ **Complete slides system** with 3 tables
- ✅ **Media uploads** (images and videos)
- ✅ **Analytics tracking** (views and clicks)
- ✅ **Target audience** (role-based display)
- ✅ **Scheduling** (start/end dates)
- ✅ **Styling options** (overlays, transitions)
- ✅ **Performance optimization** (indexes)
- ✅ **Automatic timestamps** (created_at, updated_at)

## 📞 Support

If you encounter any issues, check:
1. Database connection settings
2. User permissions (CREATE TABLE, CREATE INDEX)
3. PostgreSQL version compatibility (9.5+ for JSONB)
4. Users table existence (required for foreign keys)

---

**Created:** 2025-01-27  
**Purpose:** Create complete slides system with analytics and target audience 
// Database Schema Documentation for TTH Live Sessions System
// This file documents all tables, columns, and relationships

const databaseSchema = {
  // ===== CORE TABLES =====
  
  // Users table - stores all users (students, professors, admins)
  users: {
    tableName: 'users',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique user ID' },
      name: { type: 'VARCHAR(255)', description: 'Full name of user' },
      email: { type: 'VARCHAR(255) UNIQUE', description: 'User email address' },
      password: { type: 'VARCHAR(255)', description: 'Hashed password' },
      role: { type: 'ENUM(admin, professor, student)', description: 'User role' },
      points_balance: { type: 'INTEGER DEFAULT 0', description: 'Available points for purchases' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Account creation date' },
      updated_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Last update date' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Account status' },
      avatar_url: { type: 'VARCHAR(500)', description: 'Profile picture URL' },
      phone: { type: 'VARCHAR(20)', description: 'Phone number' },
      agora_uid: { type: 'VARCHAR(100)', description: 'Agora user ID for video calls' },
      agora_rtm_token: { type: 'TEXT', description: 'Agora RTM token' }
    },
    indexes: ['email', 'role', 'is_active'],
    relationships: {
      live_sessions: 'professor_id -> users.id',
      private_class_requests: 'student_id -> users.id',
      private_class_requests: 'teacher_id -> users.id',
      point_transactions: 'user_id -> users.id'
    }
  },

  // Live Sessions table - stores all live session information
  live_sessions: {
    tableName: 'live_sessions',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique session ID' },
      title: { type: 'VARCHAR(255)', description: 'Session title' },
      description: { type: 'TEXT', description: 'Session description' },
      professor_id: { type: 'INTEGER REFERENCES users(id)', description: 'Professor who created the session' },
      material_id: { type: 'INTEGER REFERENCES materials(id)', description: 'Associated material' },
      scheduled_at: { type: 'TIMESTAMP', description: 'When the session is scheduled to start' },
      duration: { type: 'INTEGER', description: 'Session duration in minutes' },
      meeting_url: { type: 'VARCHAR(500)', description: 'Video meeting URL (Agora/Zoom)' },
      status: { type: 'ENUM(scheduled, live, ended, cancelled, starting, paused, technical_issues)', description: 'Current session status' },
      attendees_count: { type: 'INTEGER DEFAULT 0', description: 'Number of current attendees' },
      max_attendees: { type: 'INTEGER DEFAULT 100', description: 'Maximum allowed attendees' },
      recording_url: { type: 'VARCHAR(500)', description: 'Recording file URL' },
      is_recorded: { type: 'BOOLEAN DEFAULT FALSE', description: 'Whether session is being recorded' },
      is_approved: { type: 'BOOLEAN DEFAULT FALSE', description: 'Admin approval status' },
      approved_by: { type: 'INTEGER REFERENCES users(id)', description: 'Admin who approved the session' },
      approved_at: { type: 'TIMESTAMP', description: 'When session was approved' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Session creation date' },
      updated_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Last update date' },
      tags: { type: 'TEXT[]', description: 'Array of tags for categorization' },
      price: { type: 'DECIMAL(10,2) DEFAULT 0', description: 'Session price in points' },
      agora_channel: { type: 'VARCHAR(100)', description: 'Agora channel name' },
      agora_token: { type: 'TEXT', description: 'Agora token for the session' }
    },
    indexes: ['professor_id', 'status', 'scheduled_at', 'is_approved', 'material_id'],
    relationships: {
      users: 'professor_id -> users.id',
      materials: 'material_id -> materials.id',
      live_session_attendees: 'id -> live_session_attendees.session_id'
    }
  },

  // Live Session Attendees - tracks who attended each session
  live_session_attendees: {
    tableName: 'live_session_attendees',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique attendance record ID' },
      session_id: { type: 'INTEGER REFERENCES live_sessions(id)', description: 'Session being attended' },
      student_id: { type: 'INTEGER REFERENCES users(id)', description: 'Student attending' },
      joined_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'When student joined' },
      left_at: { type: 'TIMESTAMP', description: 'When student left (NULL if still in session)' },
      duration_attended: { type: 'INTEGER', description: 'Minutes attended' },
      points_spent: { type: 'INTEGER DEFAULT 0', description: 'Points spent to attend' },
      payment_status: { type: 'ENUM(pending, completed, failed, refunded)', description: 'Payment status' }
    },
    indexes: ['session_id', 'student_id', 'joined_at'],
    relationships: {
      live_sessions: 'session_id -> live_sessions.id',
      users: 'student_id -> users.id'
    }
  },

  // ===== HIERARCHY TABLES =====
  
  // Levels (e.g., Primary School, High School)
  levels: {
    tableName: 'levels',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique level ID' },
      name: { type: 'VARCHAR(100)', description: 'Level name (e.g., Primary School)' },
      description: { type: 'TEXT', description: 'Level description' },
      order: { type: 'INTEGER', description: 'Display order' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether level is active' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['name', 'order', 'is_active'],
    relationships: {
      years: 'id -> years.level_id'
    }
  },

  // Years (e.g., First Year, Second Year)
  years: {
    tableName: 'years',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique year ID' },
      name: { type: 'VARCHAR(100)', description: 'Year name (e.g., First Year)' },
      level_id: { type: 'INTEGER REFERENCES levels(id)', description: 'Parent level' },
      description: { type: 'TEXT', description: 'Year description' },
      order: { type: 'INTEGER', description: 'Display order within level' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether year is active' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['level_id', 'name', 'order', 'is_active'],
    relationships: {
      levels: 'level_id -> levels.id',
      specialities: 'id -> specialities.year_id',
      materials: 'id -> materials.year_id'
    }
  },

  // Specialities (e.g., Mathematics, Science) - for 4-path hierarchy
  specialities: {
    tableName: 'specialities',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique speciality ID' },
      name: { type: 'VARCHAR(100)', description: 'Speciality name (e.g., Mathematics)' },
      year_id: { type: 'INTEGER REFERENCES years(id)', description: 'Parent year' },
      description: { type: 'TEXT', description: 'Speciality description' },
      order: { type: 'INTEGER', description: 'Display order within year' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether speciality is active' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['year_id', 'name', 'order', 'is_active'],
    relationships: {
      years: 'year_id -> years.id',
      materials: 'id -> materials.speciality_id'
    }
  },

  // Materials (e.g., Algebra, Physics) - can be 3-path or 4-path
  materials: {
    tableName: 'materials',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique material ID' },
      name: { type: 'VARCHAR(100)', description: 'Material name (e.g., Algebra)' },
      speciality_id: { type: 'INTEGER REFERENCES specialities(id)', description: 'Parent speciality (4-path)' },
      year_id: { type: 'INTEGER REFERENCES years(id)', description: 'Parent year (3-path)' },
      description: { type: 'TEXT', description: 'Material description' },
      price: { type: 'DECIMAL(10,2) DEFAULT 0', description: 'Material price in points' },
      order: { type: 'INTEGER', description: 'Display order' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether material is active' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['speciality_id', 'year_id', 'name', 'order', 'is_active'],
    relationships: {
      specialities: 'speciality_id -> specialities.id',
      years: 'year_id -> years.id',
      live_sessions: 'id -> live_sessions.material_id',
      courses: 'id -> courses.material_id'
    }
  },

  // ===== COURSE SYSTEM =====
  
  // Courses table
  courses: {
    tableName: 'courses',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique course ID' },
      title: { type: 'VARCHAR(255)', description: 'Course title' },
      description: { type: 'TEXT', description: 'Course description' },
      material_id: { type: 'INTEGER REFERENCES materials(id)', description: 'Associated material' },
      created_by: { type: 'INTEGER REFERENCES users(id)', description: 'Professor who created the course' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' },
      approved_at: { type: 'TIMESTAMP', description: 'When course was approved' },
      price: { type: 'DECIMAL(10,2) DEFAULT 0', description: 'Course price in points' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether course is active' }
    },
    indexes: ['material_id', 'created_by', 'approved_at', 'is_active'],
    relationships: {
      materials: 'material_id -> materials.id',
      users: 'created_by -> users.id'
    }
  },

  // ===== PRIVATE CLASSES =====
  
  // Private Class Requests
  private_class_requests: {
    tableName: 'private_class_requests',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique request ID' },
      title: { type: 'VARCHAR(255)', description: 'Request title' },
      description: { type: 'TEXT', description: 'Request description' },
      student_id: { type: 'INTEGER REFERENCES users(id)', description: 'Student making request' },
      teacher_id: { type: 'INTEGER REFERENCES users(id)', description: 'Teacher assigned' },
      material_id: { type: 'INTEGER REFERENCES materials(id)', description: 'Associated material' },
      sessions_count: { type: 'INTEGER DEFAULT 1', description: 'Number of sessions requested' },
      status: { type: 'ENUM(pending, approved, rejected, completed)', description: 'Request status' },
      scheduled_at: { type: 'TIMESTAMP', description: 'When sessions are scheduled' },
      price_per_session: { type: 'DECIMAL(10,2)', description: 'Price per session in points' },
      total_price: { type: 'DECIMAL(10,2)', description: 'Total price for all sessions' },
      payment_status: { type: 'ENUM(pending, completed, failed)', description: 'Payment status' },
      payment_date: { type: 'TIMESTAMP', description: 'When payment was made' },
      points_used: { type: 'INTEGER', description: 'Points spent on this request' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Request creation date' },
      updated_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Last update date' },
      agora_channel: { type: 'VARCHAR(100)', description: 'Agora channel for sessions' }
    },
    indexes: ['student_id', 'teacher_id', 'status', 'payment_status', 'material_id'],
    relationships: {
      users: 'student_id -> users.id',
      users: 'teacher_id -> users.id',
      materials: 'material_id -> materials.id'
    }
  },

  // ===== POINTS SYSTEM =====
  
  // Point Transactions
  point_transactions: {
    tableName: 'point_transactions',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique transaction ID' },
      user_id: { type: 'INTEGER REFERENCES users(id)', description: 'User involved in transaction' },
      transaction_type: { type: 'ENUM(purchase, spend, refund, bonus)', description: 'Type of transaction' },
      points: { type: 'INTEGER', description: 'Number of points involved' },
      amount: { type: 'DECIMAL(10,2)', description: 'Monetary amount if applicable' },
      currency: { type: 'VARCHAR(3) DEFAULT USD', description: 'Currency code' },
      status: { type: 'ENUM(pending, completed, failed, cancelled)', description: 'Transaction status' },
      payment_reference: { type: 'VARCHAR(255)', description: 'External payment reference' },
      metadata: { type: 'JSONB', description: 'Additional transaction data' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Transaction date' }
    },
    indexes: ['user_id', 'transaction_type', 'status', 'created_at'],
    relationships: {
      users: 'user_id -> users.id'
    }
  },

  // Point Codes (for redemption)
  point_codes: {
    tableName: 'point_codes',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique code ID' },
      code: { type: 'VARCHAR(50) UNIQUE', description: 'Redemption code' },
      points: { type: 'INTEGER', description: 'Points awarded when redeemed' },
      max_uses: { type: 'INTEGER DEFAULT 1', description: 'Maximum number of uses' },
      used_count: { type: 'INTEGER DEFAULT 0', description: 'Number of times used' },
      is_active: { type: 'BOOLEAN DEFAULT TRUE', description: 'Whether code is active' },
      expires_at: { type: 'TIMESTAMP', description: 'Expiration date' },
      created_by: { type: 'INTEGER REFERENCES users(id)', description: 'Admin who created the code' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['code', 'is_active', 'expires_at'],
    relationships: {
      users: 'created_by -> users.id'
    }
  },

  // ===== NOTIFICATIONS =====
  
  // Notifications table
  notifications: {
    tableName: 'notifications',
    columns: {
      id: { type: 'SERIAL PRIMARY KEY', description: 'Unique notification ID' },
      user_id: { type: 'INTEGER REFERENCES users(id)', description: 'User to notify' },
      type: { type: 'VARCHAR(50)', description: 'Notification type' },
      title: { type: 'VARCHAR(255)', description: 'Notification title' },
      message: { type: 'TEXT', description: 'Notification message' },
      is_read: { type: 'BOOLEAN DEFAULT FALSE', description: 'Whether notification is read' },
      metadata: { type: 'JSONB', description: 'Additional notification data' },
      created_at: { type: 'TIMESTAMP DEFAULT NOW()', description: 'Creation date' }
    },
    indexes: ['user_id', 'type', 'is_read', 'created_at'],
    relationships: {
      users: 'user_id -> users.id'
    }
  }
};

// ===== HELPER FUNCTIONS =====

// Get table information
function getTableInfo(tableName) {
  return databaseSchema[tableName];
}

// Get all tables
function getAllTables() {
  return Object.keys(databaseSchema);
}

// Get columns for a table
function getTableColumns(tableName) {
  const table = databaseSchema[tableName];
  return table ? Object.keys(table.columns) : [];
}

// Get relationships for a table
function getTableRelationships(tableName) {
  const table = databaseSchema[tableName];
  return table ? table.relationships : {};
}

// Get foreign key relationships
function getForeignKeyRelationships() {
  const relationships = {};
  Object.keys(databaseSchema).forEach(tableName => {
    const table = databaseSchema[tableName];
    if (table.relationships) {
      relationships[tableName] = table.relationships;
    }
  });
  return relationships;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    databaseSchema,
    getTableInfo,
    getAllTables,
    getTableColumns,
    getTableRelationships,
    getForeignKeyRelationships
  };
}

// Log schema information
console.log('📊 Database Schema Loaded');
console.log('📋 Available Tables:', getAllTables());
console.log('🔗 Foreign Key Relationships:', getForeignKeyRelationships()); 
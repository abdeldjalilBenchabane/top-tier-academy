CREATE TABLE IF NOT EXISTS point_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  package_id INTEGER REFERENCES point_packages(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_by INTEGER REFERENCES users(id),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_codes_code ON point_codes(code);
CREATE INDEX idx_point_codes_used_by ON point_codes(used_by);
CREATE INDEX idx_point_codes_package_id ON point_codes(package_id);
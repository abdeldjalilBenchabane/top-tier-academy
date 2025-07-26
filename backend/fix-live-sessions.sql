-- Add updated_at column to live_sessions table
ALTER TABLE live_sessions 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = created_at
UPDATE live_sessions 
SET updated_at = created_at 
WHERE updated_at IS NULL; 
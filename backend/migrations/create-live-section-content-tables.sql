-- Create tables for live section content (sections and blocks)
-- Similar to course_sections and section_blocks but for live sections

-- Create live_section_sections table (container for blocks)
CREATE TABLE IF NOT EXISTS live_section_sections (
    id SERIAL PRIMARY KEY,
    live_section_id INTEGER NOT NULL REFERENCES live_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create live_section_blocks table (actual content: video, image, pdf, text)
CREATE TABLE IF NOT EXISTS live_section_blocks (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES live_section_sections(id) ON DELETE CASCADE,
    live_section_id INTEGER NOT NULL REFERENCES live_sections(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'video', 'image', 'pdf')),
    title VARCHAR(255),
    content TEXT,
    "order" INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create live_section_files table (for storing uploaded files)
CREATE TABLE IF NOT EXISTS live_section_files (
    id SERIAL PRIMARY KEY,
    live_section_id INTEGER NOT NULL REFERENCES live_sections(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES live_section_sections(id) ON DELETE CASCADE,
    block_id INTEGER REFERENCES live_section_blocks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    original_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_section_sections_live_section_id 
ON live_section_sections(live_section_id);

CREATE INDEX IF NOT EXISTS idx_live_section_sections_order 
ON live_section_sections("order");

CREATE INDEX IF NOT EXISTS idx_live_section_blocks_section_id 
ON live_section_blocks(section_id);

CREATE INDEX IF NOT EXISTS idx_live_section_blocks_live_section_id 
ON live_section_blocks(live_section_id);

CREATE INDEX IF NOT EXISTS idx_live_section_blocks_order 
ON live_section_blocks("order");

CREATE INDEX IF NOT EXISTS idx_live_section_files_block_id 
ON live_section_files(block_id);

CREATE INDEX IF NOT EXISTS idx_live_section_files_section_id 
ON live_section_files(section_id);

CREATE INDEX IF NOT EXISTS idx_live_section_files_live_section_id 
ON live_section_files(live_section_id);


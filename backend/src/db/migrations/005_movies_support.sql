-- Migration 005: Movies Support
-- Adds support for movie management with STRM file generation

-- Movies table: simplified schema for movie tracking
CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    tvg_name TEXT UNIQUE NOT NULL,  -- Matching key (unique)
    tvg_logo TEXT,
    url TEXT NOT NULL,
    folder_path TEXT,               -- Full path to movie folder
    strm_file_path TEXT,            -- Full path to .strm file
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Last time seen in import feed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_movies_tvg_name ON movies(tvg_name);
CREATE INDEX IF NOT EXISTS idx_movies_last_seen ON movies(last_seen_at);

-- Add movies directory path to config table (if not exists)
INSERT OR IGNORE INTO epg_config (key, value, updated_at)
VALUES ('movies_directory', '/app/data/movies', datetime('now'));

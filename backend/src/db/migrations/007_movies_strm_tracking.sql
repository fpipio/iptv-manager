-- Migration 007: Movies STRM Tracking
-- Adds strm_enabled field to track which movies have STRM files generated

-- Add strm_enabled column (tracks if STRM file should be generated for this movie)
ALTER TABLE movies ADD COLUMN strm_enabled INTEGER DEFAULT 0;

-- Index for quick filtering of enabled movies
CREATE INDEX IF NOT EXISTS idx_movies_strm_enabled ON movies(strm_enabled);

-- Migration 009: Add original_tvg_id column to track renamed duplicates
-- This allows us to keep track of channels that had their tvg_id auto-renamed
-- due to duplicates within the same M3U file

ALTER TABLE channels ADD COLUMN original_tvg_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_channels_original_tvg_id ON channels(original_tvg_id);

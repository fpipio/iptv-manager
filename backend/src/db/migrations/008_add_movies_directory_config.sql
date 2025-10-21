-- Add movies_directory to epg_config if not exists
-- This ensures the configuration key exists with a default value

INSERT OR IGNORE INTO epg_config (key, value, updated_at)
VALUES ('movies_directory', '/app/data/movies', datetime('now'));

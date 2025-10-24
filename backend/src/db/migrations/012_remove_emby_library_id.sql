-- Migration 012: Remove Emby Library ID column (no longer needed)
-- Using global Emby refresh endpoint instead of per-library refresh

-- SQLite doesn't support DROP COLUMN directly, need to recreate table
-- But since we just added it, we can simply drop the column if it exists

-- Create new table without emby_library_id
CREATE TABLE IF NOT EXISTS year_libraries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  year_from INTEGER,
  year_to INTEGER,
  directory TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy data from old table (excluding emby_library_id)
INSERT INTO year_libraries_new (id, name, year_from, year_to, directory, sort_order, enabled, created_at, updated_at)
SELECT id, name, year_from, year_to, directory, sort_order, enabled, created_at, updated_at
FROM year_libraries;

-- Drop old table
DROP TABLE year_libraries;

-- Rename new table
ALTER TABLE year_libraries_new RENAME TO year_libraries;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_year_libraries_enabled ON year_libraries(enabled);
CREATE INDEX IF NOT EXISTS idx_year_libraries_sort ON year_libraries(sort_order);

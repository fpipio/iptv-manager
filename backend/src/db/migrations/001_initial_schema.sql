-- Create group_titles table
CREATE TABLE IF NOT EXISTS group_titles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL,
  is_exported INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,

  -- Unique identifier for matching across imports
  tvg_id TEXT NOT NULL UNIQUE,

  -- Original values from last import
  imported_tvg_name TEXT,
  imported_tvg_logo TEXT,
  imported_group_title TEXT,
  imported_url TEXT NOT NULL,

  -- Custom values (user overrides)
  custom_tvg_name TEXT,
  custom_tvg_logo TEXT,
  custom_group_id TEXT,

  -- Override flags
  is_name_overridden INTEGER DEFAULT 0,
  is_logo_overridden INTEGER DEFAULT 0,
  is_group_overridden INTEGER DEFAULT 0,

  -- Ordering within group
  sort_order INTEGER,

  -- Export flag
  is_exported INTEGER DEFAULT 1,

  -- Metadata
  channel_type TEXT DEFAULT 'tv',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_import_date TEXT NOT NULL,

  FOREIGN KEY (custom_group_id) REFERENCES group_titles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channels_tvg_id ON channels(tvg_id);
CREATE INDEX IF NOT EXISTS idx_channels_group ON channels(custom_group_id);
CREATE INDEX IF NOT EXISTS idx_channels_sort ON channels(custom_group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_groups_sort ON group_titles(sort_order);

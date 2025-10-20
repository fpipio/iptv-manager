-- EPG Sources Table
-- Stores configured EPG sources (sites to grab from)
CREATE TABLE IF NOT EXISTS epg_sources (
  id TEXT PRIMARY KEY,
  site_name TEXT UNIQUE NOT NULL,
  site_url TEXT,
  enabled INTEGER DEFAULT 1,
  last_grab_at TEXT,
  last_grab_status TEXT, -- 'success', 'error', 'running', 'pending'
  error_log TEXT,
  channels_count INTEGER DEFAULT 0,
  programs_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- EPG Grab Logs Table
-- Stores history of EPG grabs for monitoring
CREATE TABLE IF NOT EXISTS epg_grab_logs (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  status TEXT NOT NULL, -- 'success', 'error'
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  channels_grabbed INTEGER DEFAULT 0,
  programs_grabbed INTEGER DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (source_id) REFERENCES epg_sources(id) ON DELETE CASCADE
);

-- EPG Configuration Table
-- Stores global EPG settings
CREATE TABLE IF NOT EXISTS epg_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Insert default EPG configuration
INSERT OR IGNORE INTO epg_config (key, value, updated_at) VALUES
  ('auto_grab_enabled', '0', datetime('now')),
  ('auto_grab_schedule', '0 */6 * * *', datetime('now')), -- Every 6 hours
  ('grab_days', '3', datetime('now')), -- Days of EPG data to grab
  ('max_connections', '1', datetime('now')),
  ('timeout_ms', '60000', datetime('now')),
  ('output_path', '/app/data/epg/guide.xml', datetime('now'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_epg_sources_enabled ON epg_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_epg_grab_logs_source ON epg_grab_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_epg_grab_logs_status ON epg_grab_logs(status);

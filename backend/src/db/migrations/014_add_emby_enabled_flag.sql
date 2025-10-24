-- Migration 014: Add emby_enabled flag to epg_config
-- Allows users to enable/disable Emby integration without clearing credentials
-- Default value is 1 (enabled) if emby_server_url exists, 0 otherwise

INSERT INTO epg_config (key, value, updated_at)
SELECT 'emby_enabled',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM epg_config
      WHERE key = 'emby_server_url'
      AND value IS NOT NULL
      AND value != ''
    ) THEN '1'
    ELSE '0'
  END,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM epg_config WHERE key = 'emby_enabled');

-- Migration 013: Remove emby_library_id from epg_config
-- Using global Emby refresh endpoint instead of per-library refresh
-- This migration removes the obsolete emby_library_id configuration value

DELETE FROM epg_config WHERE key = 'emby_library_id';

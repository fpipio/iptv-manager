-- Migration 004: EPG Multi-Source Mapping System
-- Adds tables for intelligent channel-to-EPG source matching

-- Table: epg_source_channels
-- Stores all available channels from each EPG source (parsed from .channels.xml files)
CREATE TABLE IF NOT EXISTS epg_source_channels (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  epg_source_id TEXT NOT NULL,
  site TEXT NOT NULL,              -- e.g., "raiplay.it"
  lang TEXT,                        -- e.g., "it"
  xmltv_id TEXT,                    -- e.g., "Rai1.it" (key field for matching)
  site_id TEXT NOT NULL,            -- e.g., "rai-1" (internal site ID)
  display_name TEXT,                -- e.g., "RAI 1"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (epg_source_id) REFERENCES epg_sources(id) ON DELETE CASCADE
);

-- Table: channel_epg_mappings
-- Maps M3U channels to EPG source channels (with priority and match quality)
CREATE TABLE IF NOT EXISTS channel_epg_mappings (
  channel_id TEXT NOT NULL,
  epg_source_channel_id TEXT NOT NULL,
  priority INTEGER DEFAULT 1,           -- Source priority (1 = highest)
  is_manual INTEGER DEFAULT 0,          -- 0 = auto-matched, 1 = manual override
  match_quality TEXT DEFAULT 'exact',   -- "exact", "fuzzy", "manual"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (channel_id, epg_source_channel_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (epg_source_channel_id) REFERENCES epg_source_channels(id) ON DELETE CASCADE
);

-- Add priority column to epg_sources if not exists
-- (for ordering sources by preference)
ALTER TABLE epg_sources ADD COLUMN priority INTEGER DEFAULT 999;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_epg_source_channels_xmltv ON epg_source_channels(xmltv_id);
CREATE INDEX IF NOT EXISTS idx_epg_source_channels_source ON epg_source_channels(epg_source_id);
CREATE INDEX IF NOT EXISTS idx_epg_source_channels_site ON epg_source_channels(site);
CREATE INDEX IF NOT EXISTS idx_channel_epg_mappings_channel ON channel_epg_mappings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_epg_mappings_epg ON channel_epg_mappings(epg_source_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_epg_mappings_priority ON channel_epg_mappings(priority);

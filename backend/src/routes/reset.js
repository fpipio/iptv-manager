const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * POST /api/reset/all
 * Reset everything: channels, groups, and EPG mappings
 * Keeps: Unassigned group, EPG sources, EPG source channels
 */
router.post('/all', (req, res) => {
  try {
    const UNASSIGNED_GROUP_ID = '00000000-0000-0000-0000-000000000000';

    // 1. Delete all EPG mappings
    const mappingsResult = db.prepare('DELETE FROM channel_epg_mappings').run();

    // 2. Delete all channels
    const channelsResult = db.prepare('DELETE FROM channels').run();

    // 3. Delete all groups except Unassigned
    const groupsResult = db.prepare('DELETE FROM group_titles WHERE is_special = 0').run();

    res.json({
      success: true,
      deleted: {
        epgMappings: mappingsResult.changes,
        channels: channelsResult.changes,
        groups: groupsResult.changes
      },
      message: `Database reset completed. Deleted ${channelsResult.changes} channels, ${groupsResult.changes} groups, and ${mappingsResult.changes} EPG mappings.`
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reset/epg-mappings
 * Reset only EPG mappings (keep channels and groups)
 */
router.post('/epg-mappings', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM channel_epg_mappings').run();

    res.json({
      success: true,
      deletedCount: result.changes,
      message: `Successfully deleted ${result.changes} EPG mappings.`
    });
  } catch (error) {
    console.error('Error resetting EPG mappings:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

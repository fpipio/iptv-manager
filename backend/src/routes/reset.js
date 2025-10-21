const express = require('express');
const router = express.Router();
const db = require('../db/database');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/reset/all
 * Reset everything: channels, groups, movies, EPG mappings, and STRM files
 * Keeps: Unassigned group, EPG sources, EPG source channels, EPG config
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

    // 4. Delete all movies (NEW!)
    const moviesResult = db.prepare('DELETE FROM movies').run();

    // 5. Delete all STRM files from filesystem (NEW!)
    let strmFilesDeleted = 0;
    try {
      // Get movies directory from config
      const configRow = db.prepare('SELECT value FROM epg_config WHERE key = ?').get('movies_directory');
      const moviesDir = configRow?.value || '/app/data/movies';

      if (fs.existsSync(moviesDir)) {
        const folders = fs.readdirSync(moviesDir);
        for (const folder of folders) {
          const folderPath = path.join(moviesDir, folder);
          if (fs.statSync(folderPath).isDirectory()) {
            // Delete entire movie folder (contains .strm file)
            fs.rmSync(folderPath, { recursive: true, force: true });
            strmFilesDeleted++;
          }
        }
        console.log(`🗑️ Deleted ${strmFilesDeleted} movie folders with STRM files from ${moviesDir}`);
      }
    } catch (fsError) {
      console.error('Error deleting STRM files:', fsError);
      // Don't fail the entire reset if filesystem cleanup fails
    }

    res.json({
      success: true,
      deleted: {
        epgMappings: mappingsResult.changes,
        channels: channelsResult.changes,
        groups: groupsResult.changes,
        movies: moviesResult.changes,
        strmFiles: strmFilesDeleted
      },
      message: `Database reset completed. Deleted ${channelsResult.changes} channels, ${groupsResult.changes} groups, ${moviesResult.changes} movies, ${strmFilesDeleted} STRM folders, and ${mappingsResult.changes} EPG mappings.`
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

/**
 * POST /api/reset/tv-all
 * Reset all TV data: channels, groups, and EPG mappings
 * Does NOT touch movies/STRM files
 */
router.post('/tv-all', (req, res) => {
  try {
    const UNASSIGNED_GROUP_ID = '00000000-0000-0000-0000-000000000000';

    // 1. Delete all EPG mappings
    const mappingsResult = db.prepare('DELETE FROM channel_epg_mappings').run();

    // 2. Delete all channels
    const channelsResult = db.prepare('DELETE FROM channels').run();

    // 3. Delete all groups except Unassigned
    const groupsResult = db.prepare('DELETE FROM group_titles WHERE is_special = 0').run();

    // NOTE: Movies are NOT deleted (separate domain)

    res.json({
      success: true,
      deleted: {
        epgMappings: mappingsResult.changes,
        channels: channelsResult.changes,
        groups: groupsResult.changes
      },
      message: `TV data reset completed. Deleted ${channelsResult.changes} channels, ${groupsResult.changes} groups, and ${mappingsResult.changes} EPG mappings. Movies were not affected.`
    });
  } catch (error) {
    console.error('Error resetting TV data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

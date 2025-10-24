const express = require('express');
const router = express.Router();
const db = require('../db/database');
const exportService = require('../services/exportService');

// GET all channels (optionally filtered by group)
router.get('/', (req, res) => {
  try {
    const { groupId } = req.query;

    let query = `
      SELECT c.*, g.name as group_name
      FROM channels c
      LEFT JOIN group_titles g ON c.custom_group_id = g.id
    `;

    if (groupId) {
      query += ' WHERE c.custom_group_id = ?';
      const channels = db.prepare(query + ' ORDER BY c.sort_order ASC').all(groupId);
      return res.json(channels);
    }

    const channels = db.prepare(query + ' ORDER BY c.sort_order ASC').all();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single channel
router.get('/:id', (req, res) => {
  try {
    const channel = db.prepare(`
      SELECT c.*, g.name as group_name
      FROM channels c
      LEFT JOIN group_titles g ON c.custom_group_id = g.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update channel
router.put('/:id', (req, res) => {
  try {
    const {
      custom_tvg_name,
      custom_tvg_logo,
      custom_group_id,
      is_exported
    } = req.body;

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    // Handle custom name
    if (custom_tvg_name !== undefined) {
      updates.push('custom_tvg_name = ?', 'is_name_overridden = ?');
      values.push(custom_tvg_name, custom_tvg_name ? 1 : 0);
    }

    // Handle custom logo
    if (custom_tvg_logo !== undefined) {
      updates.push('custom_tvg_logo = ?', 'is_logo_overridden = ?');
      values.push(custom_tvg_logo, custom_tvg_logo ? 1 : 0);
    }

    // Handle custom group
    if (custom_group_id !== undefined) {
      updates.push('custom_group_id = ?', 'is_group_overridden = ?');
      values.push(custom_group_id, custom_group_id ? 1 : 0);
    }

    // Handle export flag
    if (is_exported !== undefined) {
      updates.push('is_exported = ?');
      values.push(is_exported ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(req.params.id);

    db.prepare(`
      UPDATE channels
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const channel = db.prepare(`
      SELECT c.*, g.name as group_name
      FROM channels c
      LEFT JOIN group_titles g ON c.custom_group_id = g.id
      WHERE c.id = ?
    `).get(req.params.id);

    // Auto-regenerate playlist after channel update
    exportService.autoRegeneratePlaylist();

    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT reorder channels within a group
router.put('/reorder/group', (req, res) => {
  try {
    const { channelIds } = req.body; // Array of channel IDs in new order

    if (!Array.isArray(channelIds)) {
      return res.status(400).json({ error: 'channelIds must be an array' });
    }

    const stmt = db.prepare('UPDATE channels SET sort_order = ? WHERE id = ?');
    const updateMany = db.transaction((ids) => {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
    });

    updateMany(channelIds);

    // Auto-regenerate playlist after channel reorder
    exportService.autoRegeneratePlaylist();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE channel
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);

    // Auto-regenerate playlist after channel deletion
    exportService.autoRegeneratePlaylist();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all channels (reset database)
router.post('/reset/all', (req, res) => {
  try {
    // Delete all EPG mappings first (foreign key constraint)
    db.prepare('DELETE FROM channel_epg_mappings').run();

    // Delete all channels
    const result = db.prepare('DELETE FROM channels').run();

    // Auto-regenerate playlist after reset
    exportService.autoRegeneratePlaylist();

    res.json({
      success: true,
      deletedCount: result.changes,
      message: `Successfully deleted ${result.changes} channels and all EPG mappings`
    });
  } catch (error) {
    console.error('Error resetting channels:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

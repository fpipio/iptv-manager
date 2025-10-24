const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const exportService = require('../services/exportService');

// GET all groups
router.get('/', (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT * FROM group_titles
      ORDER BY sort_order ASC
    `).all();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single group
router.get('/:id', (req, res) => {
  try {
    const group = db.prepare('SELECT * FROM group_titles WHERE id = ?').get(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new group
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if group with same name already exists
    const existing = db.prepare('SELECT id FROM group_titles WHERE name = ?').get(name);
    if (existing) {
      return res.status(409).json({ error: 'A group with this name already exists' });
    }

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM group_titles').get();
    const sortOrder = (maxOrder.max || 0) + 1;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO group_titles (id, name, sort_order, is_exported, is_special, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, sortOrder, 1, 0, now, now);

    const group = db.prepare('SELECT * FROM group_titles WHERE id = ?').get(id);

    // Auto-regenerate playlist after group creation
    exportService.autoRegeneratePlaylist();

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update group
router.put('/:id', (req, res) => {
  try {
    const { name, is_exported } = req.body;
    const now = new Date().toISOString();

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
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
      UPDATE group_titles
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    // If is_exported was changed, sync all channels in this group
    if (is_exported !== undefined) {
      db.prepare(`
        UPDATE channels
        SET is_exported = ?,
            updated_at = ?
        WHERE custom_group_id = ?
      `).run(is_exported ? 1 : 0, now, req.params.id);

      console.log(`[Groups] Synced is_exported=${is_exported} to all channels in group ${req.params.id}`);
    }

    const group = db.prepare('SELECT * FROM group_titles WHERE id = ?').get(req.params.id);

    // Auto-regenerate playlist after group update
    exportService.autoRegeneratePlaylist();

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT reorder groups
router.put('/reorder/all', (req, res) => {
  try {
    const { groupIds } = req.body; // Array of group IDs in new order

    if (!Array.isArray(groupIds)) {
      return res.status(400).json({ error: 'groupIds must be an array' });
    }

    const stmt = db.prepare('UPDATE group_titles SET sort_order = ? WHERE id = ?');
    const updateMany = db.transaction((ids) => {
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
    });

    updateMany(groupIds);

    // Auto-regenerate playlist after group reorder
    exportService.autoRegeneratePlaylist();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE group
router.delete('/:id', (req, res) => {
  try {
    const UNASSIGNED_GROUP_ID = '00000000-0000-0000-0000-000000000000';

    // Prevent deletion of special Unassigned group
    if (req.params.id === UNASSIGNED_GROUP_ID) {
      return res.status(400).json({ error: 'Cannot delete the Unassigned Channels group' });
    }

    // Move channels to Unassigned group instead of NULL
    db.prepare('UPDATE channels SET custom_group_id = ? WHERE custom_group_id = ?')
      .run(UNASSIGNED_GROUP_ID, req.params.id);

    db.prepare('DELETE FROM group_titles WHERE id = ?').run(req.params.id);

    // Auto-regenerate playlist after group deletion
    exportService.autoRegeneratePlaylist();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all groups except Unassigned (reset)
router.post('/reset/all', (req, res) => {
  try {
    const UNASSIGNED_GROUP_ID = '00000000-0000-0000-0000-000000000000';

    // Move all channels to Unassigned group
    db.prepare('UPDATE channels SET custom_group_id = ?')
      .run(UNASSIGNED_GROUP_ID);

    // Delete all groups except Unassigned (is_special = 1)
    const result = db.prepare('DELETE FROM group_titles WHERE is_special = 0').run();

    // Auto-regenerate playlist after group reset
    exportService.autoRegeneratePlaylist();

    res.json({
      success: true,
      deletedCount: result.changes,
      message: `Successfully deleted ${result.changes} groups. All channels moved to Unassigned.`
    });
  } catch (error) {
    console.error('Error resetting groups:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const yearLibraryService = require('../services/yearLibraryService');

/**
 * GET /api/year-libraries
 * Get all year libraries with sort order
 */
router.get('/', (req, res) => {
  try {
    console.log('[API] GET /api/year-libraries');
    const libraries = db.prepare(`
      SELECT id, name, year_from, year_to, directory, sort_order, enabled
      FROM year_libraries
      ORDER BY sort_order ASC
    `).all();

    res.json({
      success: true,
      total: libraries.length,
      libraries
    });
  } catch (error) {
    console.error('[API] Error getting year libraries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/year-libraries/config
 * Get year organization configuration (enabled/disabled)
 */
router.get('/config', (req, res) => {
  try {
    console.log('[API] GET /api/year-libraries/config');

    const result = db.prepare(`
      SELECT value FROM epg_config WHERE key = 'year_organization_enabled'
    `).get();

    const enabled = result?.value === '1' || result?.value === 'true';

    res.json({
      success: true,
      enabled
    });
  } catch (error) {
    console.error('[API] Error getting year organization config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/year-libraries/config
 * Update year organization configuration
 * Body: { enabled: boolean }
 */
router.put('/config', (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    console.log(`[API] PUT /api/year-libraries/config - enabled: ${enabled}`);

    db.prepare(`
      INSERT OR REPLACE INTO epg_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `).run('year_organization_enabled', enabled ? '1' : '0');

    res.json({
      success: true,
      enabled,
      message: `Year organization ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('[API] Error updating year organization config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/year-libraries
 * Create new year library
 * Body: { name: string, year_from: number|null, year_to: number|null, directory: string }
 */
router.post('/', (req, res) => {
  try {
    const { name, year_from, year_to, directory } = req.body;

    if (!name || !directory) {
      return res.status(400).json({
        success: false,
        error: 'name and directory are required'
      });
    }

    // Validate year range
    if (year_from && year_to && year_from > year_to) {
      return res.status(400).json({
        success: false,
        error: 'year_from cannot be greater than year_to'
      });
    }

    // Check for overlapping ranges
    const overlapping = db.prepare(`
      SELECT id, name FROM year_libraries
      WHERE enabled = 1
        AND (
          (? IS NOT NULL AND year_from IS NOT NULL AND ? >= year_from AND (year_to IS NULL OR ? <= year_to))
          OR (? IS NOT NULL AND year_to IS NOT NULL AND ? >= year_from AND ? <= year_to)
          OR (? IS NULL AND ? IS NULL AND year_from IS NULL AND year_to IS NULL)
        )
    `).get(year_from, year_from, year_from, year_to, year_to, year_from, year_to, year_from, year_to);

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: `Year range overlaps with existing library: "${overlapping.name}"`
      });
    }

    console.log(`[API] POST /api/year-libraries - ${name}: ${year_from || 'NULL'}-${year_to || 'NULL'}`);

    // Get max sort_order
    const maxOrder = db.prepare(`SELECT MAX(sort_order) as max FROM year_libraries`).get();
    const sortOrder = (maxOrder?.max || 0) + 1;

    const result = db.prepare(`
      INSERT INTO year_libraries (name, year_from, year_to, directory, sort_order, enabled)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, year_from, year_to, directory, sortOrder);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Year library created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating year library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/year-libraries/:id
 * Update year library
 * Body: { name: string, year_from: number|null, year_to: number|null, directory: string }
 */
router.put('/:id', (req, res) => {
  try {
    const libraryId = parseInt(req.params.id, 10);
    const { name, year_from, year_to, directory } = req.body;

    if (isNaN(libraryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid library ID'
      });
    }

    if (!name || !directory) {
      return res.status(400).json({
        success: false,
        error: 'name and directory are required'
      });
    }

    // Validate year range
    if (year_from && year_to && year_from > year_to) {
      return res.status(400).json({
        success: false,
        error: 'year_from cannot be greater than year_to'
      });
    }

    console.log(`[API] PUT /api/year-libraries/${libraryId}`);

    db.prepare(`
      UPDATE year_libraries
      SET name = ?, year_from = ?, year_to = ?, directory = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, year_from, year_to, directory, libraryId);

    res.json({
      success: true,
      message: 'Year library updated successfully'
    });
  } catch (error) {
    console.error('[API] Error updating year library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/year-libraries/:id
 * Delete year library
 */
router.delete('/:id', (req, res) => {
  try {
    const libraryId = parseInt(req.params.id, 10);

    if (isNaN(libraryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid library ID'
      });
    }

    console.log(`[API] DELETE /api/year-libraries/${libraryId}`);

    db.prepare(`DELETE FROM year_libraries WHERE id = ?`).run(libraryId);

    res.json({
      success: true,
      message: 'Year library deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting year library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/year-libraries/:id/toggle
 * Toggle library enabled state
 * Body: { enabled: boolean }
 */
router.put('/:id/toggle', (req, res) => {
  try {
    const libraryId = parseInt(req.params.id, 10);
    const { enabled } = req.body;

    if (isNaN(libraryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid library ID'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    console.log(`[API] PUT /api/year-libraries/${libraryId}/toggle - ${enabled}`);

    db.prepare(`
      UPDATE year_libraries
      SET enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(enabled ? 1 : 0, libraryId);

    res.json({
      success: true,
      message: `Library ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('[API] Error toggling library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/year-libraries/reorder
 * Reorder year libraries
 * Body: { libraryIds: [id1, id2, id3, ...] }
 */
router.put('/reorder', (req, res) => {
  try {
    const { libraryIds } = req.body;

    if (!Array.isArray(libraryIds) || libraryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'libraryIds array is required'
      });
    }

    console.log(`[API] PUT /api/year-libraries/reorder - ${libraryIds.length} libraries`);

    const updateStmt = db.prepare(`
      UPDATE year_libraries
      SET sort_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const transaction = db.transaction((ids) => {
      ids.forEach((id, index) => {
        updateStmt.run(index, id);
      });
    });

    transaction(libraryIds);

    res.json({
      success: true,
      message: 'Libraries reordered successfully'
    });
  } catch (error) {
    console.error('[API] Error reordering libraries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/year-libraries/stats
 * Get year distribution statistics for all movies
 */
router.get('/stats', (req, res) => {
  try {
    console.log('[API] GET /api/year-libraries/stats');
    const stats = yearLibraryService.getYearDistributionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[API] Error getting year distribution stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

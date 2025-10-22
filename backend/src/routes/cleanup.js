const express = require('express');
const router = express.Router();
const cleanupService = require('../services/cleanupService');

/**
 * GET /api/cleanup/analyze
 * Analyze all movies and return cleanup suggestions
 */
router.get('/analyze', async (req, res) => {
  try {
    console.log('[API] GET /api/cleanup/analyze');
    const suggestions = await cleanupService.analyzeMovies();

    res.json({
      success: true,
      total: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('[API] Error analyzing movies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/apply
 * Apply cleanup to selected movies
 * Body: { movieIds: ['id1', 'id2', ...] }
 */
router.post('/apply', async (req, res) => {
  try {
    const { movieIds } = req.body;

    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'movieIds array is required'
      });
    }

    console.log(`[API] POST /api/cleanup/apply - ${movieIds.length} movies`);
    const result = await cleanupService.applyCleanup(movieIds);

    res.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      message: `Successfully cleaned ${result.updated} movie names`
    });
  } catch (error) {
    console.error('[API] Error applying cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/patterns
 * Get all cleanup patterns (for UI management - includes enabled and disabled)
 */
router.get('/patterns', (req, res) => {
  try {
    console.log('[API] GET /api/cleanup/patterns');
    const patterns = cleanupService.getAllCleanupPatterns();

    res.json({
      success: true,
      total: patterns.length,
      patterns
    });
  } catch (error) {
    console.error('[API] Error getting patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/patterns
 * Add custom cleanup pattern
 * Body: { type: 'actor'|'custom_regex', value: string, description?: string }
 */
router.post('/patterns', (req, res) => {
  try {
    const { type, value, description } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'type and value are required'
      });
    }

    if (!['actor', 'custom_regex'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be "actor" or "custom_regex"'
      });
    }

    console.log(`[API] POST /api/cleanup/patterns - ${type}: "${value}"`);
    const result = cleanupService.addCleanupPattern(type, value, description);

    res.json({
      success: true,
      id: result.id,
      message: 'Pattern added successfully'
    });
  } catch (error) {
    console.error('[API] Error adding pattern:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/cleanup/patterns/:id
 * Delete custom cleanup pattern (only user-added, not defaults)
 */
router.delete('/patterns/:id', (req, res) => {
  try {
    const patternId = parseInt(req.params.id, 10);

    if (isNaN(patternId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pattern ID'
      });
    }

    console.log(`[API] DELETE /api/cleanup/patterns/${patternId}`);
    cleanupService.deleteCleanupPattern(patternId);

    res.json({
      success: true,
      message: 'Pattern deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting pattern:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/cleanup/patterns/:id/toggle
 * Toggle pattern enabled state
 * Body: { enabled: boolean }
 */
router.put('/patterns/:id/toggle', (req, res) => {
  try {
    const patternId = parseInt(req.params.id, 10);
    const { enabled } = req.body;

    if (isNaN(patternId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pattern ID'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    console.log(`[API] PUT /api/cleanup/patterns/${patternId}/toggle - ${enabled}`);
    cleanupService.togglePattern(patternId, enabled);

    res.json({
      success: true,
      message: `Pattern ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('[API] Error toggling pattern:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/stats
 * Get cleanup statistics
 */
router.get('/stats', (req, res) => {
  try {
    console.log('[API] GET /api/cleanup/stats');
    const stats = cleanupService.getCleanupStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[API] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/history/:movieId
 * Get cleanup history for a movie
 */
router.get('/history/:movieId', (req, res) => {
  try {
    const { movieId } = req.params;

    console.log(`[API] GET /api/cleanup/history/${movieId}`);
    const history = cleanupService.getCleanupHistory(movieId);

    res.json({
      success: true,
      total: history.length,
      history
    });
  } catch (error) {
    console.error('[API] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

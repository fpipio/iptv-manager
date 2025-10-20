const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');

// POST generate M3U export
router.post('/', async (req, res) => {
  try {
    const result = await exportService.generateM3U();
    res.json(result);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET preview export (without writing file)
router.get('/preview', async (req, res) => {
  try {
    const content = await exportService.previewM3U();
    res.json({ content });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

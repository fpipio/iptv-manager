const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const importService = require('../services/importService');
const jobQueue = require('../services/jobQueue');
const { parseM3U } = require('../services/m3uParser');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ========== CHANNELS IMPORT ==========

// POST analyze channels from file upload (pre-import analysis)
router.post('/channels/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf8');
    const result = await importService.analyzeM3uContent(content);

    res.json(result);
  } catch (error) {
    console.error('Channels analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST analyze channels from URL (pre-import analysis)
router.post('/channels/analyze-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch M3U content from URL
    const response = await axios.get(url, {
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

    const result = await importService.analyzeM3uContent(response.data);
    res.json(result);
  } catch (error) {
    console.error('Channels analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST import channels from file upload
router.post('/channels/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf8');
    const duplicateStrategy = req.body.duplicateStrategy || 'replace';

    // Quick parse to get total count
    const parsed = parseM3U(content);
    const totalChannels = parsed.channels.length;

    // Create job for progress tracking
    const jobId = jobQueue.createJob({
      type: 'import_channels',
      description: 'Importing TV channels',
      total: totalChannels
    });

    // Start import in background
    importService.importChannelsOnly(content, duplicateStrategy, jobId)
      .catch(error => {
        console.error('Background import failed:', error);
        jobQueue.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
      });

    // Return jobId immediately for progress tracking
    res.json({
      success: true,
      jobId,
      total: totalChannels,
      message: 'Import started'
    });
  } catch (error) {
    console.error('Channels import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST import channels from URL
router.post('/channels/url', async (req, res) => {
  try {
    const { url, duplicateStrategy } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch M3U content from URL
    const response = await axios.get(url, {
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

    const content = response.data;

    // Quick parse to get total count
    const parsed = parseM3U(content);
    const totalChannels = parsed.channels.length;

    // Create job for progress tracking
    const jobId = jobQueue.createJob({
      type: 'import_channels',
      description: 'Importing TV channels from URL',
      total: totalChannels
    });

    // Start import in background
    importService.importChannelsOnly(content, duplicateStrategy || 'replace', jobId)
      .catch(error => {
        console.error('Background import failed:', error);
        jobQueue.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
      });

    // Return jobId immediately for progress tracking
    res.json({
      success: true,
      jobId,
      total: totalChannels,
      message: 'Import started'
    });
  } catch (error) {
    console.error('Channels import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MOVIES IMPORT ==========

// POST import movies from file upload
router.post('/movies/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf8');

    // Quick parse to get total count
    const parsed = parseM3U(content);
    const totalMovies = parsed.movies.length;

    // Create job for progress tracking
    const jobId = jobQueue.createJob({
      type: 'import_movies',
      description: 'Importing movies',
      total: totalMovies
    });

    // Start import in background
    importService.importMoviesOnly(content, jobId)
      .catch(error => {
        console.error('Background import failed:', error);
        jobQueue.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
      });

    // Return jobId immediately for progress tracking
    const response = {
      success: true,
      jobId,
      total: totalMovies,
      message: 'Import started'
    };
    console.log('[API] Returning movie import response (upload):', response);
    res.json(response);
  } catch (error) {
    console.error('Movies import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST import movies from URL
router.post('/movies/url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch M3U content from URL
    const response = await axios.get(url, {
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

    const content = response.data;

    // Quick parse to get total count
    const parsed = parseM3U(content);
    const totalMovies = parsed.movies.length;

    // Create job for progress tracking
    const jobId = jobQueue.createJob({
      type: 'import_movies',
      description: 'Importing movies from URL',
      total: totalMovies
    });

    // Start import in background
    importService.importMoviesOnly(content, jobId)
      .catch(error => {
        console.error('Background import failed:', error);
        jobQueue.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
      });

    // Return jobId immediately for progress tracking
    const apiResponse = {
      success: true,
      jobId,
      total: totalMovies,
      message: 'Import started'
    };
    console.log('[API] Returning movie import response (url):', apiResponse);
    res.json(apiResponse);
  } catch (error) {
    console.error('Movies import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== LEGACY ENDPOINTS (deprecated) ==========

// POST import from file upload
// @deprecated Use /channels/upload or /movies/upload instead
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf8');
    const result = await importService.importM3U(content);

    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST import from URL
// @deprecated Use /channels/url or /movies/url instead
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch M3U content from URL
    const response = await axios.get(url, {
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

    const result = await importService.importM3U(response.data);
    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

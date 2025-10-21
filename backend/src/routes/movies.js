const express = require('express');
const router = express.Router();
const db = require('../db/database');
const movieService = require('../services/movieService');
const jobQueue = require('../services/jobQueue');

/**
 * GET /api/movies
 * Get all movies with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { search, limit, offset } = req.query;

    const filters = {
      search: search || null,
      limit: limit ? parseInt(limit) : 100,  // Default 100 movies per page
      offset: offset ? parseInt(offset) : 0
    };

    const movies = await movieService.getAllMovies(filters);

    // Get total count for pagination
    const db = require('../db/database');
    let totalQuery = 'SELECT COUNT(*) as total FROM movies WHERE 1=1';
    const params = [];

    if (search) {
      totalQuery += ' AND tvg_name LIKE ?';
      params.push(`%${search}%`);
    }

    const totalResult = db.prepare(totalQuery).get(...params);
    const total = totalResult?.total || 0;

    res.json({
      success: true,
      data: movies,
      count: movies.length,
      total: total,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movies',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/stats
 * Get movies statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await movieService.getMoviesStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching movie stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/config
 * Get movies configuration (directory)
 */
router.get('/config', async (req, res) => {
  try {
    const moviesDir = await movieService.getMoviesDirectory();

    res.json({
      success: true,
      data: {
        movies_directory: moviesDir
      }
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message
    });
  }
});

/**
 * PUT /api/movies/config
 * Update movies configuration (directory)
 */
router.put('/config', async (req, res) => {
  try {
    const { movies_directory } = req.body;

    if (!movies_directory) {
      return res.status(400).json({
        success: false,
        message: 'movies_directory is required'
      });
    }

    await movieService.setMoviesDirectory(movies_directory);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        movies_directory
      }
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/rescan
 * Re-scan filesystem and sync with database
 */
router.post('/rescan', async (req, res) => {
  try {
    const results = await movieService.rescanFilesystem();

    res.json({
      success: true,
      message: 'Filesystem scan completed',
      data: results
    });
  } catch (error) {
    console.error('Error rescanning filesystem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rescan filesystem',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/sync-filesystem
 * Sync filesystem from database (create/delete .strm files)
 */
router.post('/sync-filesystem', async (req, res) => {
  try {
    const { remotePath, dryRun } = req.body;

    if (!remotePath) {
      return res.status(400).json({
        success: false,
        message: 'remotePath is required'
      });
    }

    const results = await movieService.syncFilesystemFromDb(remotePath, dryRun || false);

    res.json({
      success: true,
      message: dryRun ? 'Dry run completed (no changes made)' : 'Filesystem sync completed',
      data: results
    });
  } catch (error) {
    console.error('Error syncing filesystem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync filesystem',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/toggle-strm-group
 * Toggle STRM generation for a group_title (create or delete files)
 * Returns job ID immediately, process runs in background
 */
router.post('/toggle-strm-group', async (req, res) => {
  try {
    const { groupTitle, enabled, outputDir } = req.body;

    if (!groupTitle) {
      return res.status(400).json({
        success: false,
        message: 'groupTitle is required'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean'
      });
    }

    if (!outputDir) {
      return res.status(400).json({
        success: false,
        message: 'outputDir is required'
      });
    }

    const db = require('../db/database');
    const jobQueue = require('../services/jobQueue');

    // Get all movies from this group
    const movies = db.prepare(
      `SELECT * FROM movies WHERE group_title = ?`
    ).all(groupTitle);

    if (movies.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No movies found in group "${groupTitle}"`
      });
    }

    // Create job
    const jobId = jobQueue.createJob({
      type: enabled ? 'create' : 'delete',
      groupTitle,
      outputDir,
      total: movies.length
    });

    // Start job in background
    jobQueue.startJob(jobId, async (job, queue) => {
      const batchSize = 50; // Process 50 movies at a time

      for (let i = 0; i < movies.length; i += batchSize) {
        // Check if job was cancelled
        if (job.status === 'cancelled') {
          console.log(`[JobQueue] Job ${jobId} cancelled, stopping`);
          break;
        }

        const batch = movies.slice(i, i + batchSize);

        // Process batch
        for (const movie of batch) {
          try {
            if (enabled) {
              // CREATE STRM file
              const result = await movieService.createStrmFile(movie, outputDir);
              db.prepare(
                `UPDATE movies
                 SET folder_path = ?, strm_file_path = ?, strm_enabled = 1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`
              ).run(result.folder_path, result.strm_file_path, movie.id);
              job.created++;
            } else {
              // DELETE STRM file
              // Try to delete file even if paths are NULL in DB (orphaned files)
              const path = require('path');
              const movieService = require('../services/movieService');

              // If DB has paths, use them
              if (movie.folder_path && movie.strm_file_path) {
                await movieService.deleteStrmFile(movie);
              } else {
                // Try to delete orphaned file using movie name
                // Use the SAME sanitization function as movieService to match file paths
                const safeName = movieService.sanitizeFilename(movie.tvg_name);
                const orphanedFolderPath = path.join(outputDir, safeName);
                const orphanedFilePath = path.join(orphanedFolderPath, `${safeName}.strm`);

                // Create temporary movie object with reconstructed paths
                const orphanedMovie = {
                  ...movie,
                  folder_path: orphanedFolderPath,
                  strm_file_path: orphanedFilePath
                };

                try {
                  await movieService.deleteStrmFile(orphanedMovie);
                  console.log(`[JobQueue] Deleted orphaned STRM for "${movie.tvg_name}"`);
                } catch (error) {
                  // Ignore errors for orphaned files (might not exist)
                  if (error.code !== 'ENOENT') {
                    console.warn(`[JobQueue] Could not delete orphaned STRM for "${movie.tvg_name}":`, error.message);
                  }
                }
              }

              db.prepare(
                `UPDATE movies
                 SET folder_path = NULL, strm_file_path = NULL, strm_enabled = 0, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`
              ).run(movie.id);
              job.deleted++;
            }

            job.processed++;
          } catch (error) {
            console.error(`[JobQueue] Error processing "${movie.tvg_name}":`, error);
            job.errors++;
            job.errorDetails.push({
              movie: movie.tvg_name,
              error: error.message
            });
          }
        }

        // Small delay between batches to avoid overwhelming filesystem
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    // Respond immediately with job ID
    res.json({
      success: true,
      message: 'Job started',
      jobId,
      total: movies.length
    });
  } catch (error) {
    console.error('Error starting STRM job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start job',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/jobs/:jobId
 * Get job status and progress
 */
router.get('/jobs/:jobId', (req, res) => {
  try {
    const jobQueue = require('../services/jobQueue');
    const job = jobQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Calculate progress percentage
    const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;

    res.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        groupTitle: job.groupTitle,
        status: job.status,
        progress,
        total: job.total,
        processed: job.processed,
        created: job.created,
        deleted: job.deleted,
        errors: job.errors,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      }
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

/**
 * DELETE /api/movies/jobs/:jobId
 * Cancel a running job
 */
router.delete('/jobs/:jobId', (req, res) => {
  try {
    const jobQueue = require('../services/jobQueue');
    const job = jobQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job with status: ${job.status}`
      });
    }

    jobQueue.cancelJob(req.params.jobId);

    res.json({
      success: true,
      message: 'Job cancelled'
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/emby-config
 * Get Emby configuration
 */
router.get('/emby-config', async (req, res) => {
  try {
    const db = require('../db/database');
    const config = {};

    const serverUrl = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_server_url'`).get();
    const apiToken = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_api_token'`).get();
    const libraryId = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_library_id'`).get();

    config.emby_server_url = serverUrl?.value || '';
    config.emby_api_token = apiToken?.value || '';
    config.emby_library_id = libraryId?.value || '';

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching Emby config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Emby configuration',
      error: error.message
    });
  }
});

/**
 * PUT /api/movies/emby-config
 * Update Emby configuration
 */
router.put('/emby-config', async (req, res) => {
  try {
    const { emby_server_url, emby_api_token, emby_library_id } = req.body;

    if (!emby_server_url || !emby_api_token || !emby_library_id) {
      return res.status(400).json({
        success: false,
        message: 'emby_server_url, emby_api_token, and emby_library_id are required'
      });
    }

    const db = require('../db/database');
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO epg_config (key, value, updated_at)
       VALUES (?, ?, datetime('now'))`
    );

    stmt.run('emby_server_url', emby_server_url);
    stmt.run('emby_api_token', emby_api_token);
    stmt.run('emby_library_id', emby_library_id);

    res.json({
      success: true,
      message: 'Emby configuration updated successfully',
      data: {
        emby_server_url,
        emby_api_token,
        emby_library_id
      }
    });
  } catch (error) {
    console.error('Error updating Emby config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Emby configuration',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/emby-refresh
 * Trigger Emby library refresh
 */
router.post('/emby-refresh', async (req, res) => {
  try {
    const db = require('../db/database');

    // Get Emby configuration
    const serverUrl = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_server_url'`).get();
    const apiToken = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_api_token'`).get();
    const libraryId = db.prepare(`SELECT value FROM epg_config WHERE key = 'emby_library_id'`).get();

    if (!serverUrl?.value || !apiToken?.value || !libraryId?.value) {
      return res.status(400).json({
        success: false,
        message: 'Emby is not configured. Please set up Emby configuration first.'
      });
    }

    // Call Emby API to refresh library
    // Note: fetch is natively available in Node.js 18+
    const embyUrl = `${serverUrl.value}/emby/Library/Refresh?ItemId=${libraryId.value}`;

    console.log(`[Emby] Triggering library refresh: ${embyUrl}`);

    const response = await fetch(embyUrl, {
      method: 'POST',
      headers: {
        'X-Emby-Token': apiToken.value
      }
    });

    if (!response.ok) {
      throw new Error(`Emby API returned ${response.status}: ${response.statusText}`);
    }

    console.log(`[Emby] Library refresh triggered successfully`);

    res.json({
      success: true,
      message: `Emby library refresh triggered successfully (Library ID: ${libraryId.value})`
    });
  } catch (error) {
    console.error('Error triggering Emby refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger Emby library refresh',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/generate-strm
 * Generate STRM files for selected group_titles (DEPRECATED - use toggle-strm-group)
 */
router.post('/generate-strm', async (req, res) => {
  try {
    const { groupTitles, outputDir } = req.body;

    if (!groupTitles || !Array.isArray(groupTitles) || groupTitles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'groupTitles array is required and cannot be empty'
      });
    }

    if (!outputDir) {
      return res.status(400).json({
        success: false,
        message: 'outputDir is required'
      });
    }

    const db = require('../db/database');
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    };

    // Get all movies from selected groups
    const placeholders = groupTitles.map(() => '?').join(',');
    const movies = db.prepare(
      `SELECT * FROM movies WHERE group_title IN (${placeholders})`
    ).all(...groupTitles);

    stats.total = movies.length;

    // Generate STRM for each movie
    for (const movie of movies) {
      try {
        // Skip if already has STRM paths (already generated)
        if (movie.folder_path && movie.strm_file_path) {
          stats.skipped++;
          continue;
        }

        // Create STRM file
        const result = await movieService.createStrmFile(movie, outputDir);

        // Update DB with paths
        db.prepare(
          `UPDATE movies
           SET folder_path = ?, strm_file_path = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).run(result.folder_path, result.strm_file_path, movie.id);

        stats.created++;
      } catch (error) {
        console.error(`[API] Error generating STRM for "${movie.tvg_name}":`, error);
        stats.errors++;
      }
    }

    res.json({
      success: true,
      message: `Generated ${stats.created} STRM files`,
      stats
    });
  } catch (error) {
    console.error('Error generating STRM files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate STRM files',
      error: error.message
    });
  }
});

/**
 * POST /api/movies/reset/all
 * Reset all movies and delete STRM files
 */
router.post('/reset/all', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // 1. Get movies directory from config
    const configRow = db.prepare('SELECT value FROM epg_config WHERE key = ?').get('movies_directory');
    const moviesDir = configRow?.value || '/app/data/movies';

    // 2. Delete all STRM files from filesystem
    let strmFilesDeleted = 0;
    try {
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
        console.log(`🗑️ [Reset Movies] Deleted ${strmFilesDeleted} movie folders with STRM files from ${moviesDir}`);
      }
    } catch (fsError) {
      console.error('[Reset Movies] Error deleting STRM files:', fsError);
      // Continue with database deletion even if filesystem fails
    }

    // 3. Delete all movies from database
    const moviesResult = db.prepare('DELETE FROM movies').run();

    res.json({
      success: true,
      deleted: {
        movies: moviesResult.changes,
        strmFiles: strmFilesDeleted
      },
      message: `Successfully deleted ${moviesResult.changes} movies and ${strmFilesDeleted} STRM folders.`
    });
  } catch (error) {
    console.error('[Reset Movies] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset movies',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/:id
 * Get single movie by ID
 * IMPORTANT: This route MUST be at the end, after all specific routes
 */
router.get('/:id', async (req, res) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movie',
      error: error.message
    });
  }
});

/**
 * DELETE /api/movies/:id
 * Delete movie and its STRM file
 * IMPORTANT: This route MUST be at the end, after all specific routes
 */
router.delete('/:id', async (req, res) => {
  try {
    await movieService.deleteMovie(req.params.id);

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting movie:', error);

    if (error.message === 'Movie not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete movie',
      error: error.message
    });
  }
});

/**
 * GET /api/movies/jobs/:jobId
 * Get job status for progress tracking
 */
router.get('/jobs/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobQueue.getJob(jobId);

    console.log(`[API] Job status request for ${jobId}: ${job ? job.status : 'NOT FOUND'}`);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
      error: error.message
    });
  }
});

module.exports = router;

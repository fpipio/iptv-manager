const db = require('../db/database');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Movie Service
 * Handles movie management and STRM file generation
 */

/**
 * Sanitize filename to be filesystem-safe
 * @param {string} name - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // Remove illegal characters
    .replace(/\.\./g, '_')           // Prevent directory traversal
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();
}

// Export sanitizeFilename for use in other modules
module.exports.sanitizeFilename = sanitizeFilename;

/**
 * Get movies directory path from config
 * @returns {string} Movies directory path
 */
function getMoviesDirectory() {
  try {
    const result = db.prepare(
      `SELECT value FROM epg_config WHERE key = 'movies_directory'`
    ).get();

    const value = result?.value || '/app/data/movies';
    console.log(`[MovieService] getMoviesDirectory() returned: "${value}"`);
    return value;
  } catch (error) {
    console.error('[MovieService] Error reading movies_directory from DB:', error);
    return '/app/data/movies';
  }
}

/**
 * Set movies directory path in config
 * @param {string} path - New directory path
 * @returns {void}
 */
function setMoviesDirectory(dirPath) {
  try {
    // Normalize path: remove trailing slashes (both / and \)
    const normalizedPath = dirPath.replace(/[/\\]+$/, '');

    console.log(`[MovieService] setMoviesDirectory() saving: "${normalizedPath}"`);

    const result = db.prepare(
      `INSERT OR REPLACE INTO epg_config (key, value, updated_at)
       VALUES (?, ?, datetime('now'))`
    ).run('movies_directory', normalizedPath);

    console.log(`[MovieService] Database write result:`, {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    });

    // Verify write by reading back
    const verification = db.prepare(
      `SELECT value FROM epg_config WHERE key = 'movies_directory'`
    ).get();

    if (verification?.value === normalizedPath) {
      console.log(`[MovieService] ✓ Write verified successfully: "${verification.value}"`);
    } else {
      console.error(`[MovieService] ✗ Write verification FAILED! Expected "${normalizedPath}", got "${verification?.value}"`);
      throw new Error('Database write verification failed');
    }
  } catch (error) {
    console.error('[MovieService] Error setting movies_directory:', error);
    throw error;
  }
}


/**
 * Ensure movies directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Create STRM file for a movie
 * @param {Object} movie - Movie object (must have tvg_name, url)
 * @param {string} baseDir - Base movies directory
 * @returns {Promise<Object>} Object with folder_path and strm_file_path
 */
async function createStrmFile(movie, baseDir) {
  const safeName = sanitizeFilename(movie.tvg_name);

  // FLAT Structure: /{baseDir}/{movie_name}/{movie_name}.strm
  const folderPath = path.join(baseDir, safeName);
  const strmFileName = `${safeName}.strm`;
  const strmFilePath = path.join(folderPath, strmFileName);

  // Create movie folder
  await ensureDirectoryExists(folderPath);

  // Write STRM file with stream URL
  await fs.writeFile(strmFilePath, movie.url, 'utf8');

  console.log(`[MovieService] Created STRM file: ${strmFilePath}`);

  return {
    folder_path: folderPath,
    strm_file_path: strmFilePath
  };
}

/**
 * Delete STRM file and folder for a movie
 * @param {Object} movie - Movie database record
 * @returns {Promise<void>}
 */
async function deleteStrmFile(movie) {
  if (!movie.strm_file_path || !movie.folder_path) {
    console.warn(`[MovieService] No paths found for movie: ${movie.tvg_name}`);
    return;
  }

  try {
    // Delete STRM file
    try {
      await fs.unlink(movie.strm_file_path);
      console.log(`[MovieService] Deleted STRM file: ${movie.strm_file_path}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`[MovieService] Error deleting STRM file:`, error);
      }
    }

    // Delete folder (if empty)
    try {
      await fs.rmdir(movie.folder_path);
      console.log(`[MovieService] Deleted folder: ${movie.folder_path}`);
    } catch (error) {
      if (error.code === 'ENOTEMPTY') {
        console.warn(`[MovieService] Folder not empty, skipping: ${movie.folder_path}`);
      } else if (error.code !== 'ENOENT') {
        console.error(`[MovieService] Error deleting folder:`, error);
      }
    }
  } catch (error) {
    console.error(`[MovieService] Error in deleteStrmFile:`, error);
  }
}

/**
 * Sync movies from M3U import
 * @param {Array} parsedMovies - Array of movie objects from M3U parser
 * @param {string} jobId - Optional job ID for progress tracking
 * @returns {Promise<Object>} Sync statistics
 */
async function syncMoviesFromM3u(parsedMovies, jobId = null) {
  const stats = {
    total: parsedMovies.length,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };

  if (!parsedMovies || parsedMovies.length === 0) {
    console.log('[MovieService] No movies to sync');
    return stats;
  }

  console.log(`[MovieService] Syncing ${parsedMovies.length} movies to database (DB only)`);
  const startTime = Date.now();

  // Get all existing movies from DB
  const existingMovies = db.prepare('SELECT * FROM movies').all();
  const existingMoviesMap = new Map(
    existingMovies.map(m => [m.tvg_name, m])
  );

  // Track which movies are in the current feed
  const feedMovieNames = new Set(parsedMovies.map(m => m.tvg_name));

  // Process movies in batches to avoid blocking event loop
  const BATCH_SIZE = 500;
  const PROGRESS_INTERVAL = 1000;

  for (let i = 0; i < parsedMovies.length; i += BATCH_SIZE) {
    const batch = parsedMovies.slice(i, Math.min(i + BATCH_SIZE, parsedMovies.length));

    // Process batch in a transaction for performance
    const processBatch = db.transaction((movies) => {
      for (const movie of movies) {
        try {
          const existing = existingMoviesMap.get(movie.tvg_name);

          if (existing) {
            // Movie exists - update metadata and last_seen_at (DB only)
            db.prepare(
              `UPDATE movies
               SET tvg_logo = ?,
                   group_title = ?,
                   url = ?,
                   last_seen_at = CURRENT_TIMESTAMP,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(movie.tvg_logo || null, movie.group_title || 'Uncategorized', movie.url, existing.id);
            stats.updated++;
          } else {
            // New movie - create DB record only (no filesystem)
            const id = uuidv4();

            const result = db.prepare(
              `INSERT OR IGNORE INTO movies (id, tvg_name, tvg_logo, group_title, url, folder_path, strm_file_path, last_seen_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            ).run(id, movie.tvg_name, movie.tvg_logo || null, movie.group_title || 'Uncategorized', movie.url);

            // Only increment if actually inserted (changes > 0)
            if (result.changes > 0) {
              stats.created++;
            }
          }
        } catch (error) {
          console.error(`[MovieService] Error processing movie "${movie.tvg_name}":`, error);
          stats.errors++;
        }
      }
    });

    processBatch(batch);

    // Update job progress
    const processed = Math.min(i + BATCH_SIZE, parsedMovies.length);
    if (jobId) {
      const jobQueue = require('./jobQueue');
      jobQueue.updateJob(jobId, {
        processed,
        created: stats.created,
        updated: stats.updated
      });
    }

    // Progress logging every 1000 movies
    if ((i + BATCH_SIZE) % PROGRESS_INTERVAL === 0 || i + BATCH_SIZE >= parsedMovies.length) {
      const percentage = ((processed / parsedMovies.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[MovieService] Progress: ${processed}/${parsedMovies.length} (${percentage}%) - ${elapsed}s elapsed`);
    }

    // Yield to event loop between batches (non-blocking)
    if (i + BATCH_SIZE < parsedMovies.length) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  // Find and delete orphaned movies (in DB but not in feed)
  const orphanedMovies = existingMovies.filter(
    m => !feedMovieNames.has(m.tvg_name)
  );

  if (orphanedMovies.length > 0) {
    console.log(`[MovieService] Found ${orphanedMovies.length} orphaned movies to delete`);

    try {
      // Bulk delete using NOT IN query for performance
      const feedNamesArray = Array.from(feedMovieNames);

      if (feedNamesArray.length === 0) {
        // If feed is empty, delete all movies
        const result = db.prepare('DELETE FROM movies').run();
        stats.deleted = result.changes;
        console.log(`[MovieService] Deleted all ${stats.deleted} movies (empty feed)`);
      } else {
        // Build placeholders for IN clause
        const placeholders = feedNamesArray.map(() => '?').join(',');
        const query = `DELETE FROM movies WHERE tvg_name NOT IN (${placeholders})`;

        const result = db.prepare(query).run(...feedNamesArray);
        stats.deleted = result.changes;
        console.log(`[MovieService] Bulk deleted ${stats.deleted} orphaned movies`);
      }
    } catch (error) {
      console.error('[MovieService] Error during bulk delete:', error);
      stats.errors++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[MovieService] Database sync completed in ${totalTime}s:`, stats);

  // Mark job as completed
  if (jobId) {
    const jobQueue = require('./jobQueue');
    jobQueue.updateJob(jobId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      created: stats.created,
      updated: stats.updated,
      deleted: stats.deleted
    });
  }

  return stats;
}

/**
 * Sync filesystem from database
 * Aligns remote filesystem with DB state (creates/deletes .strm files)
 * @param {string} remotePath - Remote filesystem path for movies
 * @param {boolean} dryRun - If true, only returns diff without making changes
 * @returns {Promise<Object>} Sync results with diff and stats
 */
async function syncFilesystemFromDb(remotePath, dryRun = false) {
  const results = {
    dryRun,
    remotePath,
    toCreate: [],
    toDelete: [],
    stats: {
      created: 0,
      deleted: 0,
      errors: 0
    }
  };

  try {
    // Ensure remote path exists
    await ensureDirectoryExists(remotePath);

    // Get all movies from DB
    const dbMovies = db.prepare('SELECT * FROM movies').all();
    console.log(`[MovieService] Found ${dbMovies.length} movies in database`);

    // Scan existing filesystem
    const existingFolders = new Set();
    try {
      const entries = await fs.readdir(remotePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          existingFolders.add(entry.name);
        }
      }
      console.log(`[MovieService] Found ${existingFolders.size} folders in filesystem`);
    } catch (error) {
      console.error('[MovieService] Error reading remote directory:', error);
    }

    // Phase 1: Identify movies to create
    for (const movie of dbMovies) {
      const safeName = sanitizeFilename(movie.tvg_name);

      // FLAT Structure: /{remotePath}/{movie_name}/{movie_name}.strm
      const folderPath = path.join(remotePath, safeName);
      const strmFileName = `${safeName}.strm`;
      const strmFilePath = path.join(folderPath, strmFileName);

      // Check if folder/file exists
      const folderExists = existingFolders.has(safeName);

      if (!folderExists) {
        results.toCreate.push({
          id: movie.id,
          tvg_name: movie.tvg_name,
          folderPath,
          strmFilePath,
          url: movie.url
        });
      } else {
        // Folder exists, check if .strm file exists
        try {
          await fs.access(strmFilePath);
          // File exists, verify DB has correct paths
          if (movie.folder_path !== folderPath || movie.strm_file_path !== strmFilePath) {
            // Update DB with correct paths
            if (!dryRun) {
              db.prepare(
                `UPDATE movies
                 SET folder_path = ?, strm_file_path = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`
              ).run(folderPath, strmFilePath, movie.id);
            }
          }
        } catch (error) {
          // File doesn't exist, add to create list
          results.toCreate.push({
            id: movie.id,
            tvg_name: movie.tvg_name,
            folderPath,
            strmFilePath,
            url: movie.url
          });
        }
      }
    }

    // Phase 2: Identify folders to delete (exist in filesystem but not in DB)
    const dbMovieNames = new Set(dbMovies.map(m => sanitizeFilename(m.tvg_name)));

    for (const folderName of existingFolders) {
      if (!dbMovieNames.has(folderName)) {
        const folderPath = path.join(remotePath, folderName);
        results.toDelete.push({
          folderName,
          folderPath
        });
      }
    }

    // Phase 3: Apply changes (if not dry run)
    if (!dryRun) {
      // Create missing files
      for (const item of results.toCreate) {
        try {
          await ensureDirectoryExists(item.folderPath);
          await fs.writeFile(item.strmFilePath, item.url, 'utf8');

          // Update DB with paths
          db.prepare(
            `UPDATE movies
             SET folder_path = ?, strm_file_path = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).run(item.folderPath, item.strmFilePath, item.id);

          results.stats.created++;
          console.log(`[MovieService] Created: ${item.tvg_name}`);
        } catch (error) {
          console.error(`[MovieService] Error creating ${item.tvg_name}:`, error);
          results.stats.errors++;
        }
      }

      // Delete obsolete folders
      for (const item of results.toDelete) {
        try {
          // Delete folder recursively
          await fs.rm(item.folderPath, { recursive: true, force: true });
          results.stats.deleted++;
          console.log(`[MovieService] Deleted: ${item.folderName}`);
        } catch (error) {
          console.error(`[MovieService] Error deleting ${item.folderName}:`, error);
          results.stats.errors++;
        }
      }
    }

    console.log('[MovieService] Filesystem sync completed:', results.stats);
    return results;

  } catch (error) {
    console.error('[MovieService] Error in syncFilesystemFromDb:', error);
    throw error;
  }
}

/**
 * Get all movies with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of movies
 */
async function getAllMovies(filters = {}) {
  const { search, limit, offset } = filters;

  let query = 'SELECT * FROM movies WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND tvg_name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY tvg_name ASC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  if (offset) {
    query += ' OFFSET ?';
    params.push(offset);
  }

  return db.prepare(query).all(...params);
}

/**
 * Get movie by ID
 * @param {string} id - Movie ID
 * @returns {Object|null} Movie object or null
 */
function getMovieById(id) {
  return db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
}

/**
 * Delete movie by ID
 * @param {string} id - Movie ID
 * @returns {Promise<void>}
 */
async function deleteMovie(id) {
  const movie = getMovieById(id);
  if (!movie) {
    throw new Error('Movie not found');
  }

  await deleteStrmFile(movie);
  db.prepare('DELETE FROM movies WHERE id = ?').run(id);
}

/**
 * Get movies statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getMoviesStats() {
  const totalResult = db.prepare('SELECT COUNT(*) as total FROM movies').get();
  const total = totalResult?.total || 0;

  const moviesDir = getMoviesDirectory();

  // Count actual STRM files
  let strmFilesCount = 0;
  try {
    const movies = db.prepare('SELECT * FROM movies').all();
    for (const movie of movies) {
      if (movie.strm_file_path) {
        try {
          await fs.access(movie.strm_file_path);
          strmFilesCount++;
        } catch (error) {
          // File doesn't exist
        }
      }
    }
  } catch (error) {
    console.error('[MovieService] Error counting STRM files:', error);
  }

  return {
    total,
    strm_files_count: strmFilesCount,
    movies_directory: moviesDir
  };
}

/**
 * Re-scan filesystem and sync with database
 * Useful for detecting manual file deletions or changes
 * @returns {Promise<Object>} Scan results
 */
async function rescanFilesystem() {
  const movies = db.prepare('SELECT * FROM movies').all();
  const results = {
    checked: 0,
    missing: 0,
    recreated: 0,
    errors: 0
  };

  const moviesDir = getMoviesDirectory();

  for (const movie of movies) {
    results.checked++;
    if (movie.strm_file_path) {
      try {
        await fs.access(movie.strm_file_path);
      } catch (error) {
        results.missing++;
        console.log(`[MovieService] Missing STRM file, recreating: ${movie.tvg_name}`);
        try {
          const paths = await createStrmFile({
            tvg_name: movie.tvg_name,
            url: movie.url
          }, moviesDir);

          db.prepare(
            `UPDATE movies
             SET folder_path = ?, strm_file_path = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).run(paths.folder_path, paths.strm_file_path, movie.id);
          results.recreated++;
        } catch (err) {
          console.error(`[MovieService] Error recreating STRM file:`, err);
          results.errors++;
        }
      }
    }
  }

  console.log('[MovieService] Filesystem scan completed:', results);
  return results;
}

module.exports = {
  syncMoviesFromM3u,
  syncFilesystemFromDb,
  getAllMovies,
  getMovieById,
  deleteMovie,
  getMoviesStats,
  getMoviesDirectory,
  setMoviesDirectory,
  rescanFilesystem,
  sanitizeFilename,
  createStrmFile,
  deleteStrmFile
};

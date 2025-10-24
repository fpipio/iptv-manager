const db = require('../db/database');

/**
 * Cleanup Service
 * Handles movie name cleanup (actor name removal) and pattern detection
 */

/**
 * Get all enabled cleanup patterns from database (for analysis)
 * @returns {Array<{id: number, type: string, value: string}>}
 */
function getCleanupPatterns() {
  try {
    const patterns = db.prepare(
      `SELECT id, type, value, description
       FROM cleanup_patterns
       WHERE enabled = 1
       ORDER BY is_default DESC, value ASC`
    ).all();

    console.log(`[CleanupService] Loaded ${patterns.length} enabled cleanup patterns for analysis`);
    return patterns;
  } catch (error) {
    console.error('[CleanupService] Error loading patterns:', error);
    return [];
  }
}

/**
 * Get ALL cleanup patterns (enabled and disabled) for UI management
 * @returns {Array<{id: number, type: string, value: string, enabled: number, is_default: number}>}
 */
function getAllCleanupPatterns() {
  try {
    const patterns = db.prepare(
      `SELECT id, type, value, description, enabled, is_default
       FROM cleanup_patterns
       ORDER BY is_default DESC, value ASC`
    ).all();

    console.log(`[CleanupService] Loaded ${patterns.length} total cleanup patterns (all)`);
    return patterns;
  } catch (error) {
    console.error('[CleanupService] Error loading all patterns:', error);
    return [];
  }
}

/**
 * Extract year from movie name (e.g., "Movie Name (2020)" -> 2020)
 * @param {string} name - Movie name
 * @returns {number|null} Year or null if not found
 */
function extractYear(name) {
  const match = name.match(/\((\d{4})\)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Clean movie name by removing actor prefix/suffix
 * @param {string} name - Original movie name
 * @param {Array} patterns - Cleanup patterns
 * @returns {{cleaned: string, matched: boolean, patternId: number|null, actorName: string|null}}
 */
function cleanMovieName(name, patterns) {
  if (!name) {
    return { cleaned: name, matched: false, patternId: null, actorName: null };
  }

  // Only process 'actor' type patterns for now
  const actorPatterns = patterns.filter(p => p.type === 'actor');

  for (const pattern of actorPatterns) {
    const actorName = pattern.value;

    // Case 1: "{Actor} {Title} ({Year})" or "{Actor} {Title}"
    // Example: "Alberto Sordi Dove vai in vacanza? (1978)"
    const prefixRegex = new RegExp(`^${escapeRegex(actorName)}\\s+(.+)$`, 'i');
    const prefixMatch = name.match(prefixRegex);

    if (prefixMatch) {
      const cleaned = prefixMatch[1].trim();
      console.log(`[CleanupService] Matched prefix pattern: "${name}" -> "${cleaned}" (actor: ${actorName})`);
      return {
        cleaned,
        matched: true,
        patternId: pattern.id,
        actorName
      };
    }

    // Case 2: "{Title} {Actor} ({Year})"
    // Example: "Dove vai in vacanza? Alberto Sordi (1978)"
    // Extract year first if present
    const yearMatch = name.match(/\((\d{4})\)$/);
    const year = yearMatch ? yearMatch[0] : '';
    const nameWithoutYear = year ? name.replace(/\s*\(\d{4}\)$/, '').trim() : name;

    const suffixRegex = new RegExp(`^(.+?)\\s+${escapeRegex(actorName)}$`, 'i');
    const suffixMatch = nameWithoutYear.match(suffixRegex);

    if (suffixMatch) {
      const titlePart = suffixMatch[1].trim();
      const cleaned = year ? `${titlePart} ${year}` : titlePart;
      console.log(`[CleanupService] Matched suffix pattern: "${name}" -> "${cleaned}" (actor: ${actorName})`);
      return {
        cleaned,
        matched: true,
        patternId: pattern.id,
        actorName
      };
    }
  }

  // No match found
  return { cleaned: name, matched: false, patternId: null, actorName: null };
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analyze all movies and return cleanup suggestions
 * @returns {Promise<Array<{id: string, tvgName: string, cleanedName: string, patternId: number, actorName: string, year: number|null}>>}
 */
async function analyzeMovies() {
  try {
    const patterns = getCleanupPatterns();
    if (patterns.length === 0) {
      console.log('[CleanupService] No cleanup patterns found');
      return [];
    }

    // Get all movies
    const movies = db.prepare(`SELECT id, tvg_name, group_title FROM movies`).all();
    console.log(`[CleanupService] Analyzing ${movies.length} movies...`);

    const suggestions = [];

    for (const movie of movies) {
      const result = cleanMovieName(movie.tvg_name, patterns);

      if (result.matched && result.cleaned !== movie.tvg_name) {
        const year = extractYear(movie.tvg_name);

        suggestions.push({
          id: movie.id,
          tvgName: movie.tvg_name,
          cleanedName: result.cleaned,
          patternId: result.patternId,
          actorName: result.actorName,
          year,
          groupTitle: movie.group_title
        });
      }
    }

    console.log(`[CleanupService] Found ${suggestions.length} movies that can be cleaned`);
    return suggestions;
  } catch (error) {
    console.error('[CleanupService] Error analyzing movies:', error);
    throw error;
  }
}

/**
 * Find a unique movie name by adding [2], [3], etc. if duplicates exist
 * @param {string} baseName - The base name to make unique
 * @param {string} excludeId - Movie ID to exclude from duplicate check (the one being renamed)
 * @returns {string} Unique name
 */
function findUniqueName(baseName, excludeId) {
  const checkStmt = db.prepare(`SELECT id FROM movies WHERE tvg_name = ? AND id != ?`);

  // Check if base name is available
  if (!checkStmt.get(baseName, excludeId)) {
    return baseName;
  }

  // Base name exists, try [2], [3], etc.
  let counter = 2;
  while (counter < 100) { // Safety limit
    const candidateName = `${baseName} [${counter}]`;
    if (!checkStmt.get(candidateName, excludeId)) {
      console.log(`[CleanupService] Duplicate found, using: "${candidateName}"`);
      return candidateName;
    }
    counter++;
  }

  // Fallback if somehow we reach 100 duplicates
  return `${baseName} [${Date.now()}]`;
}

/**
 * Apply cleanup to selected movies (rename in database only, STRM regeneration handled separately)
 * @param {Array<string>} movieIds - Array of movie IDs to clean
 * @returns {Promise<{success: boolean, updated: number, errors: Array}>}
 */
async function applyCleanup(movieIds) {
  if (!movieIds || movieIds.length === 0) {
    return { success: true, updated: 0, errors: [] };
  }

  try {
    const patterns = getCleanupPatterns();
    const errors = [];
    let updated = 0;

    const updateStmt = db.prepare(`
      UPDATE movies
      SET tvg_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const historyStmt = db.prepare(`
      INSERT INTO cleanup_history (movie_id, original_name, cleaned_name, pattern_id)
      VALUES (?, ?, ?, ?)
    `);

    // Process in transaction for atomicity
    const transaction = db.transaction((ids) => {
      for (const movieId of ids) {
        try {
          // Get current movie
          const movie = db.prepare(`SELECT id, tvg_name FROM movies WHERE id = ?`).get(movieId);

          if (!movie) {
            errors.push({ id: movieId, error: 'Movie not found' });
            continue;
          }

          // Clean the name
          const result = cleanMovieName(movie.tvg_name, patterns);

          if (!result.matched) {
            errors.push({ id: movieId, error: 'No matching pattern found' });
            continue;
          }

          if (result.cleaned === movie.tvg_name) {
            errors.push({ id: movieId, error: 'Name unchanged after cleanup' });
            continue;
          }

          // Check for duplicates and find unique name
          const uniqueName = findUniqueName(result.cleaned, movieId);

          // Update movie name
          updateStmt.run(uniqueName, movieId);

          // Record in history
          historyStmt.run(movieId, movie.tvg_name, uniqueName, result.patternId);

          updated++;
          console.log(`[CleanupService] Updated: "${movie.tvg_name}" -> "${uniqueName}"`);
        } catch (err) {
          console.error(`[CleanupService] Error updating movie ${movieId}:`, err);
          errors.push({ id: movieId, error: err.message });
        }
      }
    });

    transaction(movieIds);

    console.log(`[CleanupService] Cleanup complete: ${updated} updated, ${errors.length} errors`);
    return { success: true, updated, errors };
  } catch (error) {
    console.error('[CleanupService] Error applying cleanup:', error);
    throw error;
  }
}

/**
 * Get cleanup history for a movie
 * @param {string} movieId - Movie ID
 * @returns {Array<{originalName: string, cleanedName: string, appliedAt: string}>}
 */
function getCleanupHistory(movieId) {
  try {
    const history = db.prepare(`
      SELECT
        ch.original_name as originalName,
        ch.cleaned_name as cleanedName,
        ch.applied_at as appliedAt,
        cp.value as patternValue
      FROM cleanup_history ch
      LEFT JOIN cleanup_patterns cp ON ch.pattern_id = cp.id
      WHERE ch.movie_id = ?
      ORDER BY ch.applied_at DESC
    `).all(movieId);

    return history;
  } catch (error) {
    console.error('[CleanupService] Error getting cleanup history:', error);
    return [];
  }
}

/**
 * Get cleanup statistics
 * @returns {{totalPatterns: number, totalCleaned: number, lastCleanup: string|null}}
 */
function getCleanupStats() {
  try {
    const totalPatterns = db.prepare(`SELECT COUNT(*) as count FROM cleanup_patterns WHERE enabled = 1`).get().count;
    const totalCleaned = db.prepare(`SELECT COUNT(DISTINCT movie_id) as count FROM cleanup_history`).get().count;
    const lastCleanup = db.prepare(`SELECT MAX(applied_at) as lastDate FROM cleanup_history`).get().lastDate;

    return {
      totalPatterns,
      totalCleaned,
      lastCleanup
    };
  } catch (error) {
    console.error('[CleanupService] Error getting stats:', error);
    return { totalPatterns: 0, totalCleaned: 0, lastCleanup: null };
  }
}

/**
 * Add custom cleanup pattern
 * @param {string} type - Pattern type ('actor' or 'custom_regex')
 * @param {string} value - Pattern value
 * @param {string} description - Optional description
 * @returns {{success: boolean, id: number}}
 */
function addCleanupPattern(type, value, description = '') {
  try {
    const result = db.prepare(`
      INSERT INTO cleanup_patterns (type, value, description, enabled, is_default)
      VALUES (?, ?, ?, 1, 0)
    `).run(type, value, description);

    console.log(`[CleanupService] Added custom pattern: ${type} = "${value}"`);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('[CleanupService] Error adding pattern:', error);
    throw error;
  }
}

/**
 * Delete custom cleanup pattern (only user-added, not defaults)
 * @param {number} patternId - Pattern ID
 * @returns {{success: boolean}}
 */
function deleteCleanupPattern(patternId) {
  try {
    const pattern = db.prepare(`SELECT is_default FROM cleanup_patterns WHERE id = ?`).get(patternId);

    if (!pattern) {
      throw new Error('Pattern not found');
    }

    if (pattern.is_default) {
      throw new Error('Cannot delete default patterns');
    }

    db.prepare(`DELETE FROM cleanup_patterns WHERE id = ?`).run(patternId);
    console.log(`[CleanupService] Deleted custom pattern ID: ${patternId}`);
    return { success: true };
  } catch (error) {
    console.error('[CleanupService] Error deleting pattern:', error);
    throw error;
  }
}

/**
 * Toggle pattern enabled state
 * @param {number} patternId - Pattern ID
 * @param {boolean} enabled - New enabled state
 * @returns {{success: boolean}}
 */
function togglePattern(patternId, enabled) {
  try {
    db.prepare(`
      UPDATE cleanup_patterns
      SET enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(enabled ? 1 : 0, patternId);

    console.log(`[CleanupService] Pattern ${patternId} ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true };
  } catch (error) {
    console.error('[CleanupService] Error toggling pattern:', error);
    throw error;
  }
}

module.exports = {
  getCleanupPatterns,
  getAllCleanupPatterns,
  cleanMovieName,
  analyzeMovies,
  applyCleanup,
  getCleanupHistory,
  getCleanupStats,
  addCleanupPattern,
  deleteCleanupPattern,
  togglePattern,
  extractYear
};

const db = require('../db/database');
const { extractYear } = require('./cleanupService');

/**
 * Year Library Service
 * Handles year-based library organization for movies
 */

/**
 * Check if year organization is enabled
 * @returns {boolean}
 */
function isYearOrganizationEnabled() {
  try {
    const result = db.prepare(
      `SELECT value FROM epg_config WHERE key = 'year_organization_enabled'`
    ).get();

    const enabled = result?.value === '1' || result?.value === 'true';
    return enabled;
  } catch (error) {
    console.error('[YearLibraryService] Error checking if year organization is enabled:', error);
    return false;
  }
}

/**
 * Get all enabled year libraries sorted by sort_order
 * @returns {Array<{id: number, name: string, year_from: number|null, year_to: number|null, directory: string}>}
 */
function getEnabledYearLibraries() {
  try {
    const libraries = db.prepare(`
      SELECT id, name, year_from, year_to, directory, sort_order
      FROM year_libraries
      WHERE enabled = 1
      ORDER BY sort_order ASC
    `).all();

    return libraries;
  } catch (error) {
    console.error('[YearLibraryService] Error getting enabled year libraries:', error);
    return [];
  }
}

/**
 * Find the appropriate year library for a movie based on its year
 * @param {number|null} year - Movie year
 * @returns {Object|null} Year library object or null if no match
 */
function findLibraryForYear(year) {
  const libraries = getEnabledYearLibraries();

  if (libraries.length === 0) {
    return null;
  }

  // If year is null or undefined, look for the "Unknown Year" library
  if (!year) {
    const unknownLibrary = libraries.find(lib => {
      const yf = lib.year_from === '' || lib.year_from === undefined ? null : lib.year_from;
      const yt = lib.year_to === '' || lib.year_to === undefined ? null : lib.year_to;
      return yf === null && yt === null;
    });
    return unknownLibrary || null;
  }

  // Find the library that matches the year range
  for (const library of libraries) {
    let { year_from, year_to } = library;

    // Normalize empty strings to null (SQLite can return empty strings)
    if (year_from === '' || year_from === undefined) year_from = null;
    if (year_to === '' || year_to === undefined) year_to = null;

    // Skip "Unknown Year" libraries (both NULL) when we have a valid year
    // These should only match when year is null (handled above)
    if (year_from === null && year_to === null) {
      continue;
    }

    // Check if year falls within range
    const matchesFrom = year_from === null || year >= year_from;
    const matchesTo = year_to === null || year <= year_to;

    if (matchesFrom && matchesTo) {
      return library;
    }
  }

  // No matching library found, return "Unknown Year" library as fallback
  const unknownLibrary = libraries.find(lib => {
    const yf = lib.year_from === '' || lib.year_from === undefined ? null : lib.year_from;
    const yt = lib.year_to === '' || lib.year_to === undefined ? null : lib.year_to;
    return yf === null && yt === null;
  });
  return unknownLibrary || null;
}

/**
 * Get subdirectory path for a movie based on year organization
 * @param {string} movieName - Movie name (e.g., "Movie Title (2020)")
 * @returns {string|null} Subdirectory path (e.g., "2001-2020") or null if year org disabled
 */
function getSubdirectoryForMovie(movieName) {
  if (!isYearOrganizationEnabled()) {
    return null;
  }

  const year = extractYear(movieName);
  const library = findLibraryForYear(year);

  if (!library) {
    console.warn(`[YearLibraryService] No library found for movie: ${movieName} (year: ${year || 'unknown'})`);
    return null;
  }

  console.log(`[YearLibraryService] Movie "${movieName}" (${year || 'unknown'}) → library "${library.name}" (${library.directory})`);
  return library.directory;
}

/**
 * Get year distribution statistics for all movies
 * @returns {Object} Statistics object with counts per library
 */
function getYearDistributionStats() {
  try {
    const libraries = getEnabledYearLibraries();
    const movies = db.prepare('SELECT tvg_name FROM movies').all();

    const stats = {
      total: movies.length,
      organized: 0,
      unorganized: 0,
      byLibrary: {}
    };

    // Initialize library counters
    libraries.forEach(lib => {
      stats.byLibrary[lib.name] = {
        count: 0,
        directory: lib.directory,
        range: lib.year_from || lib.year_to
          ? `${lib.year_from || '∞'}-${lib.year_to || '∞'}`
          : 'Unknown'
      };
    });

    // Count movies per library
    for (const movie of movies) {
      const year = extractYear(movie.tvg_name);
      const library = findLibraryForYear(year);

      if (library) {
        stats.byLibrary[library.name].count++;
        stats.organized++;
      } else {
        stats.unorganized++;
      }
    }

    return stats;
  } catch (error) {
    console.error('[YearLibraryService] Error getting year distribution stats:', error);
    return {
      total: 0,
      organized: 0,
      unorganized: 0,
      byLibrary: {}
    };
  }
}

module.exports = {
  isYearOrganizationEnabled,
  getEnabledYearLibraries,
  findLibraryForYear,
  getSubdirectoryForMovie,
  getYearDistributionStats
};

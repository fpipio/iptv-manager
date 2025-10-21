const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { parseM3U } = require('./m3uParser');
const movieService = require('./movieService');

/**
 * Find or create a group by name
 */
function findOrCreateGroup(groupName) {
  // Try to find existing group
  let group = db.prepare('SELECT * FROM group_titles WHERE name = ?').get(groupName);

  if (!group) {
    // Create new group
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM group_titles').get();
    const sortOrder = (maxOrder.max || 0) + 1;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO group_titles (id, name, sort_order, is_exported, is_special, created_at, updated_at)
      VALUES (?, ?, ?, 1, 0, ?, ?)
    `).run(id, groupName, sortOrder, now, now);

    group = db.prepare('SELECT * FROM group_titles WHERE id = ?').get(id);
  }

  return group;
}

/**
 * Get next sort order for channels in a group
 */
function getNextSortOrder(groupId) {
  const result = db.prepare(`
    SELECT MAX(sort_order) as max
    FROM channels
    WHERE custom_group_id = ?
  `).get(groupId);

  return (result.max || 0) + 1;
}

/**
 * Import only TV channels from M3U content
 * @param {string} content - M3U file content
 * @param {string} duplicateStrategy - 'replace' (default), 'skip', or 'rename'
 */
async function importChannelsOnly(content, duplicateStrategy = 'replace') {
  const parsed = parseM3U(content);
  const { channels } = parsed;

  if (channels.length === 0) {
    return {
      success: false,
      message: 'No TV channels found in M3U file'
    };
  }

  let newChannels = 0;
  let updatedChannels = 0;
  let skippedChannels = 0;
  let renamedChannels = 0;
  const renamedChannelsList = []; // Track renamed channels with details

  const importTransaction = db.transaction((parsedChannels) => {
    const now = new Date().toISOString();
    const processedTvgIds = new Set(); // Track tvg_ids processed in THIS transaction

    for (const channel of parsedChannels) {
      let tvgIdToUse = channel.tvgId;

      // Check for duplicate WITHIN the same file (already processed in this transaction)
      if (processedTvgIds.has(channel.tvgId)) {
        // Duplicate within file - ALWAYS auto-rename regardless of strategy
        let suffix = 2;
        let newTvgId = `${channel.tvgId}-${suffix}`;
        while (db.prepare('SELECT id FROM channels WHERE tvg_id = ?').get(newTvgId) || processedTvgIds.has(newTvgId)) {
          suffix++;
          newTvgId = `${channel.tvgId}-${suffix}`;
        }
        tvgIdToUse = newTvgId;

        // Create as new channel with renamed tvg_id
        const group = findOrCreateGroup(channel.groupTitle);
        const sortOrder = getNextSortOrder(group.id);
        const id = uuidv4();

        db.prepare(`
          INSERT INTO channels (
            id, tvg_id, original_tvg_id,
            imported_tvg_name, imported_tvg_logo, imported_group_title, imported_url,
            custom_group_id,
            is_name_overridden, is_logo_overridden, is_group_overridden,
            sort_order, is_exported, channel_type,
            created_at, updated_at, last_import_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1, ?, ?, ?, ?)
        `).run(
          id, tvgIdToUse, channel.tvgId, // Save original tvg_id
          channel.tvgName, channel.tvgLogo, channel.groupTitle, channel.url,
          group.id,
          sortOrder, channel.channelType,
          now, now, now
        );

        // Track renamed channel details
        renamedChannelsList.push({
          name: channel.tvgName,
          originalTvgId: channel.tvgId,
          newTvgId: tvgIdToUse,
          reason: 'duplicate_in_file'
        });

        processedTvgIds.add(tvgIdToUse);
        renamedChannels++;
        continue;
      }

      // Check if channel exists in database
      const existing = db.prepare('SELECT * FROM channels WHERE tvg_id = ?').get(channel.tvgId);

      if (existing) {
        // Duplicate found with DB - apply user-selected strategy
        if (duplicateStrategy === 'skip') {
          // Skip this channel
          skippedChannels++;
          continue;
        } else if (duplicateStrategy === 'rename') {
          // Auto-rename tvg_id to make it unique
          let suffix = 2;
          let newTvgId = `${channel.tvgId}-${suffix}`;
          while (db.prepare('SELECT id FROM channels WHERE tvg_id = ?').get(newTvgId) || processedTvgIds.has(newTvgId)) {
            suffix++;
            newTvgId = `${channel.tvgId}-${suffix}`;
          }
          tvgIdToUse = newTvgId;

          // Create as new channel with renamed tvg_id
          const group = findOrCreateGroup(channel.groupTitle);
          const sortOrder = getNextSortOrder(group.id);
          const id = uuidv4();

          db.prepare(`
            INSERT INTO channels (
              id, tvg_id, original_tvg_id,
              imported_tvg_name, imported_tvg_logo, imported_group_title, imported_url,
              custom_group_id,
              is_name_overridden, is_logo_overridden, is_group_overridden,
              sort_order, is_exported, channel_type,
              created_at, updated_at, last_import_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1, ?, ?, ?, ?)
          `).run(
            id, tvgIdToUse, channel.tvgId, // Save original tvg_id
            channel.tvgName, channel.tvgLogo, channel.groupTitle, channel.url,
            group.id,
            sortOrder, channel.channelType,
            now, now, now
          );

          // Track renamed channel details
          renamedChannelsList.push({
            name: channel.tvgName,
            originalTvgId: channel.tvgId,
            newTvgId: tvgIdToUse,
            reason: 'duplicate_with_db'
          });

          processedTvgIds.add(tvgIdToUse);
          renamedChannels++;
        } else {
          // Default 'replace' strategy - update existing channel
          db.prepare(`
            UPDATE channels
            SET imported_tvg_name = ?,
                imported_tvg_logo = ?,
                imported_group_title = ?,
                imported_url = ?,
                updated_at = ?,
                last_import_date = ?
            WHERE id = ?
          `).run(
            channel.tvgName,
            channel.tvgLogo,
            channel.groupTitle,
            channel.url,
            now,
            now,
            existing.id
          );

          processedTvgIds.add(channel.tvgId);
          updatedChannels++;
        }
      } else {
        // New channel - create it
        const group = findOrCreateGroup(channel.groupTitle);
        const sortOrder = getNextSortOrder(group.id);
        const id = uuidv4();

        db.prepare(`
          INSERT INTO channels (
            id, tvg_id,
            imported_tvg_name, imported_tvg_logo, imported_group_title, imported_url,
            custom_group_id,
            is_name_overridden, is_logo_overridden, is_group_overridden,
            sort_order, is_exported, channel_type,
            created_at, updated_at, last_import_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1, ?, ?, ?, ?)
        `).run(
          id, tvgIdToUse,
          channel.tvgName, channel.tvgLogo, channel.groupTitle, channel.url,
          group.id,
          sortOrder, channel.channelType,
          now, now, now
        );

        processedTvgIds.add(tvgIdToUse);
        newChannels++;
      }
    }
  });

  try {
    importTransaction(channels);
  } catch (error) {
    console.error('Channels import transaction failed:', error);
    throw error;
  }

  return {
    success: true,
    message: `Successfully imported ${newChannels + updatedChannels + renamedChannels} channels`,
    stats: {
      total: channels.length,
      new: newChannels,
      updated: updatedChannels,
      skipped: skippedChannels,
      renamed: renamedChannels,
      renamedList: renamedChannelsList, // Detailed list of renamed channels
      strategy: duplicateStrategy
    }
  };
}

/**
 * Import only movies from M3U content
 */
async function importMoviesOnly(content) {
  const parsed = parseM3U(content);
  const { movies } = parsed;

  if (movies.length === 0) {
    return {
      success: false,
      message: 'No movies found in M3U file'
    };
  }

  let movieStats = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };

  try {
    movieStats = await movieService.syncMoviesFromM3u(movies);
  } catch (error) {
    console.error('Movies import failed:', error);
    throw error;
  }

  return {
    success: true,
    message: `Successfully imported ${movieStats.created + movieStats.updated} movies`,
    stats: movieStats
  };
}

/**
 * Import M3U content (both channels and movies)
 * @deprecated Use importChannelsOnly or importMoviesOnly instead
 */
async function importM3U(content) {
  const parsed = parseM3U(content);
  const { channels, movies } = parsed;

  if (channels.length === 0 && movies.length === 0) {
    return {
      success: false,
      message: 'No TV channels or movies found in M3U file'
    };
  }

  let newChannels = 0;
  let updatedChannels = 0;
  let skippedChannels = 0;

  // Import TV channels (existing logic)
  if (channels.length > 0) {
    const importTransaction = db.transaction((parsedChannels) => {
      const now = new Date().toISOString();

      for (const channel of parsedChannels) {
        // Check if channel exists
        const existing = db.prepare('SELECT * FROM channels WHERE tvg_id = ?').get(channel.tvgId);

        if (existing) {
          // Channel exists - update imported values only
          db.prepare(`
            UPDATE channels
            SET imported_tvg_name = ?,
                imported_tvg_logo = ?,
                imported_group_title = ?,
                imported_url = ?,
                updated_at = ?,
                last_import_date = ?
            WHERE id = ?
          `).run(
            channel.tvgName,
            channel.tvgLogo,
            channel.groupTitle,
            channel.url,
            now,
            now,
            existing.id
          );

          updatedChannels++;
        } else {
          // New channel - create it
          const group = findOrCreateGroup(channel.groupTitle);
          const sortOrder = getNextSortOrder(group.id);
          const id = uuidv4();

          db.prepare(`
            INSERT INTO channels (
              id, tvg_id,
              imported_tvg_name, imported_tvg_logo, imported_group_title, imported_url,
              custom_group_id,
              is_name_overridden, is_logo_overridden, is_group_overridden,
              sort_order, is_exported, channel_type,
              created_at, updated_at, last_import_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1, ?, ?, ?, ?)
          `).run(
            id, channel.tvgId,
            channel.tvgName, channel.tvgLogo, channel.groupTitle, channel.url,
            group.id,
            sortOrder, channel.channelType,
            now, now, now
          );

          newChannels++;
        }
      }
    });

    try {
      importTransaction(channels);
    } catch (error) {
      console.error('Channels import transaction failed:', error);
      throw error;
    }
  }

  // Import movies (new logic)
  let movieStats = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };

  if (movies.length > 0) {
    try {
      movieStats = await movieService.syncMoviesFromM3u(movies);
    } catch (error) {
      console.error('Movies import failed:', error);
      // Don't throw - continue with partial success
    }
  }

  return {
    success: true,
    message: 'Import completed successfully',
    stats: {
      channels: {
        total: channels.length,
        new: newChannels,
        updated: updatedChannels,
        skipped: skippedChannels
      },
      movies: movieStats
    }
  };
}

/**
 * Analyze M3U content without importing (pre-import analysis)
 * Returns statistics and duplicate information
 */
async function analyzeM3uContent(content) {
  const parsed = parseM3U(content);
  const { channels, movies } = parsed;

  // Detect duplicates within the file
  const tvgIdMap = new Map();
  const duplicatesInFile = [];

  for (const channel of channels) {
    if (tvgIdMap.has(channel.tvgId)) {
      duplicatesInFile.push({
        tvgId: channel.tvgId,
        tvgName: channel.tvgName,
        url: channel.url,
        firstOccurrence: tvgIdMap.get(channel.tvgId)
      });
    } else {
      tvgIdMap.set(channel.tvgId, {
        tvgName: channel.tvgName,
        url: channel.url
      });
    }
  }

  // Detect duplicates with existing database
  const duplicatesWithDb = [];
  for (const channel of channels) {
    const existing = db.prepare('SELECT id, tvg_id, imported_tvg_name, imported_url FROM channels WHERE tvg_id = ?').get(channel.tvgId);
    if (existing) {
      duplicatesWithDb.push({
        tvgId: channel.tvgId,
        newName: channel.tvgName,
        newUrl: channel.url,
        existingName: existing.imported_tvg_name,
        existingUrl: existing.imported_url,
        sameUrl: existing.imported_url === channel.url
      });
    }
  }

  return {
    channels: {
      total: channels.length,
      duplicatesInFile: duplicatesInFile.length,
      duplicatesWithDb: duplicatesWithDb.length,
      duplicatesList: duplicatesWithDb
    },
    movies: {
      total: movies.length
    }
  };
}

module.exports = {
  importM3U,
  importChannelsOnly,
  importMoviesOnly,
  analyzeM3uContent
};

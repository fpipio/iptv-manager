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
 */
async function importChannelsOnly(content) {
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

  return {
    success: true,
    message: `Successfully imported ${newChannels + updatedChannels} channels`,
    stats: {
      total: channels.length,
      new: newChannels,
      updated: updatedChannels,
      skipped: 0
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

module.exports = { importM3U, importChannelsOnly, importMoviesOnly };

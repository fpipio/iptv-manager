const db = require('../db/database');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate M3U content
 */
async function generateM3UContent() {
  // Get all exported groups ordered by sort_order
  const groups = db.prepare(`
    SELECT * FROM group_titles
    WHERE is_exported = 1
    ORDER BY sort_order ASC
  `).all();

  // Build M3U header with EPG URL if available
  let content = '#EXTM3U';

  // Check if EPG data exists
  const epgPath = path.join(__dirname, '../../../data/epg/guide.xml');
  try {
    await fs.access(epgPath);
    // EPG file exists, add x-tvg-url attribute
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    content += ` x-tvg-url="${baseUrl}/epg-files/guide.xml"`;
  } catch (error) {
    // EPG file doesn't exist, skip x-tvg-url attribute
  }

  content += '\n';

  for (const group of groups) {
    // Get all exported channels in this group
    const channels = db.prepare(`
      SELECT * FROM channels
      WHERE custom_group_id = ? AND is_exported = 1
      ORDER BY sort_order ASC
    `).all(group.id);

    for (const channel of channels) {
      // Use custom values if overridden, otherwise use imported values
      const tvgName = channel.is_name_overridden && channel.custom_tvg_name
        ? channel.custom_tvg_name
        : channel.imported_tvg_name;

      const tvgLogo = channel.is_logo_overridden && channel.custom_tvg_logo
        ? channel.custom_tvg_logo
        : channel.imported_tvg_logo;

      const groupTitle = group.name;

      // Build EXTINF line (M3U Plus format)
      // Keep original tvg_id - the EPG guide.xml will be modified to match these IDs
      content += `#EXTINF:-1 tvg-id="${channel.tvg_id}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${tvgName}\n`;
      content += `${channel.imported_url}\n`;
    }
  }

  return content;
}

/**
 * Generate and save M3U file
 */
async function generateM3U() {
  const content = await generateM3UContent();

  // Write to output directory
  const outputPath = process.env.OUTPUT_PATH || path.join(__dirname, '../../../data/output');
  const filePath = path.join(outputPath, 'playlist.m3u');

  // Ensure output directory exists
  await fs.mkdir(outputPath, { recursive: true });

  // Write file
  await fs.writeFile(filePath, content, 'utf8');

  // Count stats
  const totalGroups = db.prepare('SELECT COUNT(*) as count FROM group_titles WHERE is_exported = 1').get();
  const totalChannels = db.prepare('SELECT COUNT(*) as count FROM channels WHERE is_exported = 1').get();

  return {
    success: true,
    message: 'M3U file generated successfully',
    filePath: '/output/playlist.m3u',
    stats: {
      groups: totalGroups.count,
      channels: totalChannels.count
    }
  };
}

/**
 * Preview M3U content without saving
 */
async function previewM3U() {
  return generateM3UContent();
}

/**
 * Auto-regenerate playlist (silent, non-blocking)
 * Used as hook after channel/group modifications
 */
async function autoRegeneratePlaylist() {
  try {
    await generateM3U();
    console.log('[ExportService] Playlist auto-regenerated');
  } catch (error) {
    console.error('[ExportService] Auto-regenerate failed:', error.message);
    // Non-blocking: don't throw error, just log
  }
}

/**
 * Get playlist statistics without regenerating
 */
async function getPlaylistStats() {
  const outputPath = process.env.OUTPUT_PATH || path.join(__dirname, '../../../data/output');
  const filePath = path.join(outputPath, 'playlist.m3u');

  try {
    const stats = await fs.stat(filePath);
    const totalGroups = db.prepare('SELECT COUNT(*) as count FROM group_titles WHERE is_exported = 1').get();
    const totalChannels = db.prepare('SELECT COUNT(*) as count FROM channels WHERE is_exported = 1').get();

    return {
      exists: true,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      lastModified: stats.mtime,
      channels: totalChannels.count,
      groups: totalGroups.count
    };
  } catch (error) {
    // File doesn't exist yet
    return {
      exists: false,
      fileSize: '0 KB',
      lastModified: null,
      channels: 0,
      groups: 0
    };
  }
}

module.exports = {
  generateM3U,
  previewM3U,
  autoRegeneratePlaylist,
  getPlaylistStats
};

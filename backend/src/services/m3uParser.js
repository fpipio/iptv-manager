/**
 * Parse M3U file content
 * @param {string} content - M3U file content
 * @returns {Object} Object with channels and movies arrays
 */
function parseM3U(content) {
  const lines = content.split('\n').map(line => line.trim());
  const channels = [];
  const movies = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for EXTINF lines
    if (line.startsWith('#EXTINF:')) {
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.startsWith('#')) continue;

      // Extract attributes
      const tvgId = extractAttribute(line, 'tvg-ID') || extractAttribute(line, 'tvg-id');
      const tvgName = extractAttribute(line, 'tvg-name');
      const tvgLogo = extractAttribute(line, 'tvg-logo');
      const groupTitle = extractAttribute(line, 'group-title');

      // Extract display name (after last comma)
      const commaIndex = line.lastIndexOf(',');
      const displayName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : tvgName;

      const url = nextLine.trim();

      // Determine channel type based on URL
      let channelType = 'tv';
      if (url.includes('/series/')) {
        channelType = 'series';
      } else if (url.includes('/movie/')) {
        channelType = 'movie';
      }

      // Process based on type
      if (channelType === 'tv') {
        channels.push({
          tvgId: tvgId || `generated-${Date.now()}-${i}`,
          tvgName: tvgName || displayName,
          tvgLogo: tvgLogo || '',
          groupTitle: groupTitle || 'Uncategorized',
          url: url,
          channelType: channelType
        });
      } else if (channelType === 'movie') {
        movies.push({
          tvg_name: tvgName || displayName,
          tvg_logo: tvgLogo || '',
          group_title: groupTitle || 'Uncategorized',
          url: url
        });
      }
      // Skip series for now (future phase)

      i++; // Skip the URL line
    }
  }

  return {
    channels,
    movies
  };
}

/**
 * Extract attribute value from EXTINF line
 * @param {string} line - EXTINF line
 * @param {string} attr - Attribute name
 * @returns {string|null}
 */
function extractAttribute(line, attr) {
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = line.match(regex);
  return match ? match[1] : null;
}

module.exports = { parseM3U };

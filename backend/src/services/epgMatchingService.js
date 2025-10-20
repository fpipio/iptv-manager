const db = require('../db/database');
const epgChannelsParser = require('./epgChannelsParser');

/**
 * EPG Matching Service
 * Intelligent matching between M3U channels and EPG source channels
 * with priority system and fuzzy matching fallback
 */

class EpgMatchingService {
  /**
   * Auto-match all M3U channels to EPG source channels
   * @param {Object} options - Matching options
   * @returns {Object} Stats { matched, unmatched, exact, fuzzy }
   */
  async autoMatchAllChannels(options = {}) {
    const {
      useFuzzyMatching = false, // Enable fuzzy matching as fallback
      overwriteManual = false    // Overwrite existing manual mappings
    } = options;

    const stats = {
      matched: 0,
      unmatched: 0,
      exact: 0,
      fuzzy: 0,
      skipped: 0
    };

    // Get all M3U channels with tvg-id (only exported channels)
    const m3uChannels = db.prepare(`
      SELECT
        id,
        tvg_id,
        custom_tvg_name,
        imported_tvg_name,
        is_exported
      FROM channels
      WHERE tvg_id IS NOT NULL
        AND tvg_id != ''
        AND is_exported = 1
    `).all();

    console.log(`Auto-matching ${m3uChannels.length} M3U channels...`);

    for (const m3uChannel of m3uChannels) {
      // Check if already mapped manually
      if (!overwriteManual) {
        const existingManualMapping = db.prepare(`
          SELECT 1 FROM channel_epg_mappings
          WHERE channel_id = ? AND is_manual = 1
          LIMIT 1
        `).get(m3uChannel.id);

        if (existingManualMapping) {
          stats.skipped++;
          continue;
        }
      }

      // Try exact match first
      const exactMatch = await this.findExactMatch(m3uChannel.tvg_id);

      if (exactMatch) {
        await this.createMapping(m3uChannel.id, exactMatch.id, {
          priority: exactMatch.source_priority,
          match_quality: 'exact',
          is_manual: false
        });
        stats.matched++;
        stats.exact++;
        continue;
      }

      // Try fuzzy match as fallback
      if (useFuzzyMatching) {
        const channelName = m3uChannel.custom_tvg_name || m3uChannel.imported_tvg_name;
        const fuzzyMatch = await this.findFuzzyMatch(channelName);

        if (fuzzyMatch && fuzzyMatch.score >= 0.8) {
          await this.createMapping(m3uChannel.id, fuzzyMatch.channel.id, {
            priority: fuzzyMatch.channel.source_priority,
            match_quality: 'fuzzy',
            is_manual: false
          });
          stats.matched++;
          stats.fuzzy++;
          continue;
        }
      }

      // No match found
      stats.unmatched++;
    }

    console.log(`Auto-matching completed:`, stats);
    return stats;
  }

  /**
   * Find exact match for a tvg-id
   * @param {string} tvgId - tvg-id from M3U channel
   * @returns {Object|null} EPG channel with source info
   */
  async findExactMatch(tvgId) {
    if (!tvgId) return null;

    // Generate all variations upfront
    const variations = [tvgId, ...this.generateTvgIdVariations(tvgId)];

    // Build single optimized query with all variations
    // Use parameterized placeholders for all variations
    const placeholders = variations.map(() => 'LOWER(esc.xmltv_id) = LOWER(?)').join(' OR ');

    const match = db.prepare(`
      SELECT
        esc.*,
        es.priority as source_priority,
        es.site_name as source_name
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE (${placeholders}) AND es.enabled = 1
      ORDER BY es.priority ASC
      LIMIT 1
    `).get(...variations);

    if (match && match.xmltv_id !== tvgId) {
      console.log(`[Matching] Found match: ${tvgId} → ${match.xmltv_id}`);
    }

    return match || null;
  }

  /**
   * Generate common tvg_id variations
   * @param {string} tvgId - Original tvg_id
   * @returns {Array} Array of possible variations
   */
  generateTvgIdVariations(tvgId) {
    const variations = [];

    // Common suffixes to remove (case-insensitive)
    const qualitySuffixes = [
      'HD', 'FullHD', 'Full HD', 'FHD', '4K', 'UHD',
      ' HD', ' FullHD', ' Full HD', ' FHD', ' 4K', ' UHD',
      '_HD', '_FullHD', '_Full_HD', '_FHD', '_4K', '_UHD',
      '-HD', '-FullHD', '-Full-HD', '-FHD', '-4K', '-UHD'
    ];

    // Common TLDs
    const tlds = ['.it', '.com', '.net', '.tv', '.eu'];

    // Clean version (remove quality suffixes and TLDs)
    let cleanId = tvgId;

    // Remove quality suffixes (case-insensitive)
    qualitySuffixes.forEach(suffix => {
      const regex = new RegExp(suffix + '$', 'i');
      cleanId = cleanId.replace(regex, '').trim();
    });

    // Remove TLDs from clean version
    tlds.forEach(tld => {
      if (cleanId.toLowerCase().endsWith(tld)) {
        cleanId = cleanId.slice(0, -tld.length);
      }
    });

    // Add clean version
    if (cleanId !== tvgId) {
      variations.push(cleanId);
    }

    // Add clean version with TLDs
    tlds.forEach(tld => {
      if (!cleanId.toLowerCase().endsWith(tld)) {
        variations.push(cleanId + tld);
      }
    });

    // Original variations: Add/remove TLDs
    if (!tlds.some(tld => tvgId.toLowerCase().endsWith(tld))) {
      tlds.forEach(tld => variations.push(tvgId + tld));
    } else {
      tlds.forEach(tld => {
        if (tvgId.toLowerCase().endsWith(tld)) {
          const withoutTld = tvgId.slice(0, -tld.length);
          variations.push(withoutTld);

          // Also try removing quality suffixes from version without TLD
          qualitySuffixes.forEach(suffix => {
            const regex = new RegExp(suffix + '$', 'i');
            const cleaned = withoutTld.replace(regex, '').trim();
            if (cleaned !== withoutTld) {
              variations.push(cleaned);
              variations.push(cleaned + tld);
            }
          });
        }
      });
    }

    // Try with first letter capitalized
    if (tvgId[0] === tvgId[0].toLowerCase()) {
      const capitalized = tvgId[0].toUpperCase() + tvgId.slice(1);
      variations.push(capitalized);
      tlds.forEach(tld => variations.push(capitalized + tld));

      // Clean capitalized version
      const cleanCapitalized = cleanId[0].toUpperCase() + cleanId.slice(1);
      variations.push(cleanCapitalized);
      tlds.forEach(tld => variations.push(cleanCapitalized + tld));
    }

    // Try all lowercase
    if (tvgId !== tvgId.toLowerCase()) {
      variations.push(tvgId.toLowerCase());
      tlds.forEach(tld => variations.push(tvgId.toLowerCase() + tld));

      // Clean lowercase version
      variations.push(cleanId.toLowerCase());
      tlds.forEach(tld => variations.push(cleanId.toLowerCase() + tld));
    }

    // Try all uppercase
    if (tvgId !== tvgId.toUpperCase()) {
      variations.push(tvgId.toUpperCase());
      tlds.forEach(tld => variations.push(tvgId.toUpperCase() + tld));

      // Clean uppercase version
      variations.push(cleanId.toUpperCase());
      tlds.forEach(tld => variations.push(cleanId.toUpperCase() + tld));
    }

    // Remove duplicates and return
    return [...new Set(variations)];
  }

  /**
   * Find fuzzy match based on channel name similarity
   * @param {string} channelName - Channel name to match
   * @returns {Object|null} { channel, score }
   */
  async findFuzzyMatch(channelName) {
    if (!channelName) return null;

    // Get all EPG channels with active sources
    const epgChannels = db.prepare(`
      SELECT
        esc.*,
        es.priority as source_priority,
        es.site_name as source_name
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE es.enabled = 1
      ORDER BY es.priority ASC
    `).all();

    let bestMatch = null;
    let bestScore = 0;

    const normalizedName = this.normalizeString(channelName);

    for (const epgChannel of epgChannels) {
      const normalizedEpgName = this.normalizeString(epgChannel.display_name);
      const score = this.calculateSimilarity(normalizedName, normalizedEpgName);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = epgChannel;
      }
    }

    return bestMatch && bestScore >= 0.8
      ? { channel: bestMatch, score: bestScore }
      : null;
  }

  /**
   * Normalize string for comparison
   * @param {string} str
   * @returns {string}
   */
  normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ''); // Remove special chars
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   * @param {string} str1
   * @param {string} str2
   * @returns {number} Similarity score 0-1
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein distance between two strings
   * @param {string} str1
   * @param {string} str2
   * @returns {number}
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Create or update mapping between M3U channel and EPG channel
   * @param {string} channelId - M3U channel ID
   * @param {string} epgSourceChannelId - EPG source channel ID
   * @param {Object} options - Mapping options
   */
  async createMapping(channelId, epgSourceChannelId, options = {}) {
    const {
      priority = 1,
      match_quality = 'exact',
      is_manual = false
    } = options;

    // Delete existing mapping for this channel (single mapping per channel)
    db.prepare(`
      DELETE FROM channel_epg_mappings
      WHERE channel_id = ?
    `).run(channelId);

    // Insert new mapping
    db.prepare(`
      INSERT INTO channel_epg_mappings (
        channel_id,
        epg_source_channel_id,
        priority,
        is_manual,
        match_quality,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      channelId,
      epgSourceChannelId,
      priority,
      is_manual ? 1 : 0,
      match_quality
    );
  }

  /**
   * Get mapping for a specific M3U channel
   * @param {string} channelId - M3U channel ID
   * @returns {Object|null} Mapping with EPG channel details
   */
  async getMappingForChannel(channelId) {
    const mapping = db.prepare(`
      SELECT
        cem.*,
        esc.site,
        esc.lang,
        esc.xmltv_id,
        esc.site_id,
        esc.display_name as epg_display_name,
        es.site_name as source_name,
        es.priority as source_priority
      FROM channel_epg_mappings cem
      JOIN epg_source_channels esc ON cem.epg_source_channel_id = esc.id
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE cem.channel_id = ?
      LIMIT 1
    `).get(channelId);

    return mapping || null;
  }

  /**
   * Get all mappings with channel and EPG details
   * @returns {Array} Array of mappings
   */
  async getAllMappings() {
    return db.prepare(`
      SELECT
        c.id as channel_id,
        c.tvg_id as imported_tvg_id,
        c.custom_tvg_name,
        c.imported_tvg_name,
        c.is_exported,
        c.custom_group_id,
        c.sort_order,
        cem.priority,
        cem.is_manual,
        cem.match_quality,
        esc.site,
        esc.xmltv_id as epg_xmltv_id,
        esc.site_id as epg_site_id,
        esc.display_name as epg_display_name,
        es.site_name as source_name,
        es.priority as source_priority,
        g.name as group_name,
        g.sort_order as group_sort_order
      FROM channels c
      LEFT JOIN channel_epg_mappings cem ON c.id = cem.channel_id
      LEFT JOIN epg_source_channels esc ON cem.epg_source_channel_id = esc.id
      LEFT JOIN epg_sources es ON esc.epg_source_id = es.id
      LEFT JOIN group_titles g ON c.custom_group_id = g.id
      WHERE c.tvg_id IS NOT NULL
        AND c.tvg_id != ''
        AND c.is_exported = 1
      ORDER BY g.sort_order ASC, c.sort_order ASC
    `).all();
  }

  /**
   * Get alternative EPG matches for a channel (for manual override)
   * Uses intelligent matching like findExactMatch to find all possible alternatives
   * @param {string} tvgId - tvg-id to search for
   * @returns {Array} Array of alternative EPG channels
   */
  async getAlternativeMatches(tvgId) {
    if (!tvgId) return [];

    const allMatches = [];
    const seenIds = new Set();

    // Helper to add match if not duplicate
    const addMatch = (matches) => {
      if (!Array.isArray(matches)) matches = [matches];
      matches.forEach(match => {
        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          allMatches.push(match);
        }
      });
    };

    // 1. Exact match (case-sensitive)
    const exactMatches = db.prepare(`
      SELECT
        esc.*,
        es.site_name as source_name,
        es.priority as source_priority
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE esc.xmltv_id = ? AND es.enabled = 1
      ORDER BY es.priority ASC
    `).all(tvgId);
    addMatch(exactMatches);

    // 2. Case-insensitive match
    const caseInsensitiveMatches = db.prepare(`
      SELECT
        esc.*,
        es.site_name as source_name,
        es.priority as source_priority
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE LOWER(esc.xmltv_id) = LOWER(?) AND es.enabled = 1
      ORDER BY es.priority ASC
    `).all(tvgId);
    addMatch(caseInsensitiveMatches);

    // 3. Try variations (TLD, quality suffixes, etc.)
    const variations = this.generateTvgIdVariations(tvgId);
    for (const variation of variations) {
      // Case-sensitive variation
      const varMatches = db.prepare(`
        SELECT
          esc.*,
          es.site_name as source_name,
          es.priority as source_priority
        FROM epg_source_channels esc
        JOIN epg_sources es ON esc.epg_source_id = es.id
        WHERE esc.xmltv_id = ? AND es.enabled = 1
        ORDER BY es.priority ASC
      `).all(variation);
      addMatch(varMatches);

      // Case-insensitive variation
      const varCaseMatches = db.prepare(`
        SELECT
          esc.*,
          es.site_name as source_name,
          es.priority as source_priority
        FROM epg_source_channels esc
        JOIN epg_sources es ON esc.epg_source_id = es.id
        WHERE LOWER(esc.xmltv_id) = LOWER(?) AND es.enabled = 1
        ORDER BY es.priority ASC
      `).all(variation);
      addMatch(varCaseMatches);
    }

    // Sort by priority (lower number = higher priority)
    return allMatches.sort((a, b) => a.source_priority - b.source_priority);
  }

  /**
   * Delete mapping for a channel
   * @param {string} channelId - M3U channel ID
   */
  async deleteMapping(channelId) {
    db.prepare(`
      DELETE FROM channel_epg_mappings
      WHERE channel_id = ?
    `).run(channelId);
  }

  /**
   * Get statistics about mappings
   * @returns {Object} Stats
   */
  async getMappingStats() {
    const totalChannels = db.prepare(`
      SELECT COUNT(*) as count
      FROM channels
      WHERE tvg_id IS NOT NULL
        AND tvg_id != ''
        AND is_exported = 1
    `).get().count;

    const mappedChannels = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_epg_mappings
    `).get().count;

    const exactMatches = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_epg_mappings
      WHERE match_quality = 'exact'
    `).get().count;

    const fuzzyMatches = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_epg_mappings
      WHERE match_quality = 'fuzzy'
    `).get().count;

    const manualMatches = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_epg_mappings
      WHERE is_manual = 1
    `).get().count;

    return {
      totalChannels,
      mappedChannels,
      unmappedChannels: totalChannels - mappedChannels,
      exactMatches,
      fuzzyMatches,
      manualMatches
    };
  }
}

module.exports = new EpgMatchingService();

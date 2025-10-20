const fs = require('fs').promises;
const path = require('path');
const { parseStringPromise } = require('xml2js');
const db = require('../db/database');

/**
 * EPG Channels Parser
 * Parses .channels.xml files from epg-grabber/sites/ directory
 * and populates epg_source_channels table
 */

class EpgChannelsParser {
  constructor() {
    this.epgGrabberPath = process.env.EPG_GRABBER_PATH || '/app/epg-grabber';
    this.sitesPath = path.join(this.epgGrabberPath, 'sites');
  }

  /**
   * Parse a single .channels.xml file
   * @param {string} filePath - Path to .channels.xml file
   * @returns {Array} Array of channel objects
   */
  async parseChannelsXml(filePath) {
    try {
      const xmlContent = await fs.readFile(filePath, 'utf-8');
      const result = await parseStringPromise(xmlContent, {
        explicitArray: false,
        mergeAttrs: true
      });

      if (!result.channels || !result.channels.channel) {
        return [];
      }

      // Ensure channels is always an array
      const channels = Array.isArray(result.channels.channel)
        ? result.channels.channel
        : [result.channels.channel];

      return channels.map(ch => ({
        site: ch.site || '',
        lang: ch.lang || '',
        xmltv_id: ch.xmltv_id || '',
        site_id: ch.site_id || '',
        display_name: typeof ch === 'object' ? (ch._ || '') : ch
      }));
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Scan epg-grabber/sites/ directory for .channels.xml files
   * @returns {Array} Array of { site, filePath }
   */
  async scanChannelsFiles() {
    try {
      // Check if sites directory exists
      const sitesExists = await fs.access(this.sitesPath)
        .then(() => true)
        .catch(() => false);

      if (!sitesExists) {
        console.warn(`EPG sites directory not found: ${this.sitesPath}`);
        return [];
      }

      // Read all directories in sites/
      const entries = await fs.readdir(this.sitesPath, { withFileTypes: true });
      const siteDirs = entries.filter(e => e.isDirectory());

      const channelsFiles = [];

      for (const dir of siteDirs) {
        const siteName = dir.name;
        const channelsFilePath = path.join(this.sitesPath, siteName, `${siteName}.channels.xml`);

        // Check if .channels.xml exists
        const fileExists = await fs.access(channelsFilePath)
          .then(() => true)
          .catch(() => false);

        if (fileExists) {
          channelsFiles.push({
            site: siteName,
            filePath: channelsFilePath
          });
        }
      }

      return channelsFiles;
    } catch (error) {
      console.error('Error scanning channels files:', error.message);
      return [];
    }
  }

  /**
   * Load channels from a specific EPG source into database
   * @param {string} epgSourceId - EPG source ID from epg_sources table
   * @param {string} site - Site name (e.g., "raiplay.it")
   * @returns {number} Number of channels loaded
   */
  async loadChannelsForSource(epgSourceId, site) {
    const channelsFilePath = path.join(this.sitesPath, site, `${site}.channels.xml`);

    // Check if file exists
    const fileExists = await fs.access(channelsFilePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      throw new Error(`Channels file not found: ${channelsFilePath}`);
    }

    // Parse channels
    const channels = await this.parseChannelsXml(channelsFilePath);

    if (channels.length === 0) {
      console.warn(`No channels found in ${channelsFilePath}`);
      return 0;
    }

    // Delete existing channels for this source (refresh)
    db.prepare(`
      DELETE FROM epg_source_channels
      WHERE epg_source_id = ?
    `).run(epgSourceId);

    // Insert channels
    const insertStmt = db.prepare(`
      INSERT INTO epg_source_channels (
        id, epg_source_id, site, lang, xmltv_id, site_id, display_name
      ) VALUES (
        lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?
      )
    `);

    let insertedCount = 0;
    for (const ch of channels) {
      try {
        insertStmt.run(
          epgSourceId,
          ch.site,
          ch.lang,
          ch.xmltv_id,
          ch.site_id,
          ch.display_name
        );
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting channel ${ch.site_id}:`, error.message);
      }
    }

    console.log(`Loaded ${insertedCount} channels for source ${site}`);
    return insertedCount;
  }

  /**
   * Sync all EPG source channels from filesystem to database
   * @returns {Object} Stats { totalSources, totalChannels, errors }
   */
  async syncAllSourceChannels() {
    const stats = {
      totalSources: 0,
      totalChannels: 0,
      errors: []
    };

    // Get all active EPG sources from database
    const sources = db.prepare(`
      SELECT id, site_name FROM epg_sources
      WHERE enabled = 1
    `).all();

    for (const source of sources) {
      try {
        const channelsCount = await this.loadChannelsForSource(source.id, source.site_name);
        stats.totalSources++;
        stats.totalChannels += channelsCount;
      } catch (error) {
        console.error(`Error syncing channels for ${source.site_name}:`, error.message);
        stats.errors.push({
          source: source.site_name,
          error: error.message
        });
      }
    }

    return stats;
  }

  /**
   * Get all channels for a specific EPG source
   * @param {string} epgSourceId - EPG source ID
   * @returns {Array} Array of channels
   */
  async getChannelsForSource(epgSourceId) {
    return db.prepare(`
      SELECT * FROM epg_source_channels
      WHERE epg_source_id = ?
      ORDER BY display_name ASC
    `).all(epgSourceId);
  }

  /**
   * Search channels by xmltv_id across all sources
   * @param {string} xmltvId - xmltv_id to search for
   * @returns {Array} Array of matching channels with source info
   */
  async searchChannelsByXmltvId(xmltvId) {
    return db.prepare(`
      SELECT
        esc.*,
        es.site_name as source_name,
        es.priority as source_priority
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE esc.xmltv_id = ? AND es.enabled = 1
      ORDER BY es.priority ASC, esc.display_name ASC
    `).all(xmltvId);
  }

  /**
   * Get statistics about loaded EPG channels
   * @returns {Object} Stats { totalChannels, channelsBySite, sourcesCount }
   */
  async getChannelsStats() {
    const totalChannels = db.prepare(`
      SELECT COUNT(*) as count FROM epg_source_channels
    `).get().count;

    const channelsBySite = db.prepare(`
      SELECT
        esc.site,
        es.site_name,
        COUNT(*) as count
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      GROUP BY esc.site, es.site_name
      ORDER BY count DESC
    `).all();

    const sourcesCount = db.prepare(`
      SELECT COUNT(DISTINCT epg_source_id) as count
      FROM epg_source_channels
    `).get().count;

    return {
      totalChannels,
      channelsBySite,
      sourcesCount
    };
  }
}

module.exports = new EpgChannelsParser();

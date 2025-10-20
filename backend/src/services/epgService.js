const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * EPG Service
 * Manages EPG sources, configuration, and grabbing operations
 */

class EpgService {
  constructor() {
    // Use absolute paths for Docker container
    this.epgGrabberPath = process.env.EPG_GRABBER_PATH || '/app/epg-grabber';
    this.epgOutputPath = process.env.EPG_OUTPUT_PATH || '/app/data/epg';
  }

  /**
   * Get all EPG sources
   */
  async getAllSources() {
    return db.prepare(`
      SELECT * FROM epg_sources
      ORDER BY site_name ASC
    `).all();
  }

  /**
   * Get EPG source by ID
   */
  async getSourceById(id) {
    return db.prepare(`
      SELECT * FROM epg_sources WHERE id = ?
    `).get(id);
  }

  /**
   * Create new EPG source
   */
  async createSource({ siteName, siteUrl, enabled = true }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO epg_sources (
        id, site_name, site_url, enabled,
        last_grab_status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, siteName, siteUrl, enabled ? 1 : 0, now, now);

    return this.getSourceById(id);
  }

  /**
   * Update EPG source
   */
  async updateSource(id, { siteName, siteUrl, enabled, priority }) {
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE epg_sources
      SET site_name = COALESCE(?, site_name),
          site_url = COALESCE(?, site_url),
          enabled = COALESCE(?, enabled),
          priority = COALESCE(?, priority),
          updated_at = ?
      WHERE id = ?
    `).run(
      siteName,
      siteUrl,
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      priority !== undefined ? priority : null,
      now,
      id
    );

    return this.getSourceById(id);
  }

  /**
   * Delete EPG source
   */
  async deleteSource(id) {
    db.prepare(`DELETE FROM epg_sources WHERE id = ?`).run(id);
  }

  /**
   * Get EPG configuration
   */
  async getConfig() {
    const rows = db.prepare(`SELECT key, value FROM epg_config`).all();
    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });
    return config;
  }

  /**
   * Update EPG configuration
   */
  async updateConfig(key, value) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO epg_config (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(key, value, now);
  }

  /**
   * Generate channels.xml from database for EPG grabber
   */
  async generateChannelsXml() {
    // Get all channels with tvg_id
    const channels = db.prepare(`
      SELECT
        c.tvg_id,
        COALESCE(c.custom_tvg_name, c.imported_tvg_name) as name,
        COALESCE(c.custom_tvg_logo, c.imported_tvg_logo) as logo,
        g.name as group_name
      FROM channels c
      LEFT JOIN group_titles g ON c.custom_group_id = g.id
      WHERE c.tvg_id IS NOT NULL AND c.tvg_id != ''
      ORDER BY g.sort_order, c.sort_order
    `).all();

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<channels>\n';

    channels.forEach(channel => {
      xml += `  <channel site="" xmltv_id="${this.escapeXml(channel.tvg_id)}">\n`;
      xml += `    <display-name lang="en">${this.escapeXml(channel.name)}</display-name>\n`;
      if (channel.logo) {
        xml += `    <icon src="${this.escapeXml(channel.logo)}" />\n`;
      }
      xml += `  </channel>\n`;
    });

    xml += '</channels>\n';

    // Ensure epg-grabber directory exists
    await fs.mkdir(this.epgGrabberPath, { recursive: true });

    // Write channels.xml
    const channelsXmlPath = path.join(this.epgGrabberPath, 'channels.xml');
    await fs.writeFile(channelsXmlPath, xml, 'utf8');

    return channelsXmlPath;
  }

  /**
   * Grab EPG data from a source
   */
  async grabEpg(sourceId) {
    const source = await this.getSourceById(sourceId);
    if (!source) {
      throw new Error('EPG source not found');
    }

    if (!source.enabled) {
      throw new Error('EPG source is disabled');
    }

    // Create grab log
    const logId = uuidv4();
    const startTime = new Date().toISOString();

    db.prepare(`
      INSERT INTO epg_grab_logs (id, source_id, status, started_at)
      VALUES (?, ?, 'running', ?)
    `).run(logId, sourceId, startTime);

    // Update source status
    db.prepare(`
      UPDATE epg_sources
      SET last_grab_status = 'running', last_grab_at = ?, updated_at = ?
      WHERE id = ?
    `).run(startTime, startTime, sourceId);

    try {
      // Generate channels.xml
      await this.generateChannelsXml();

      // Get config
      const config = await this.getConfig();
      const days = config.grab_days || '3';
      const maxConnections = config.max_connections || '1';
      const timeout = config.timeout_ms || '60000';

      // Ensure output directory exists
      await fs.mkdir(this.epgOutputPath, { recursive: true });

      // Build grab command
      const outputPath = path.join(this.epgOutputPath, 'guide.xml');
      const channelsPath = path.join(this.epgGrabberPath, 'channels.xml');

      // Build grab command
      const grabberDir = '/app/epg-grabber';

      console.log(`[EPG] Starting grab from site: ${source.site_name}`);
      console.log(`[EPG] Channels file: ${channelsPath}`);
      console.log(`[EPG] Output file: ${outputPath}`);
      console.log(`[EPG] Days: ${days}, Max connections: ${maxConnections}, Timeout: ${timeout}ms`);

      // Execute npm run grab in epg-grabber directory
      const grabCommand = `cd "${grabberDir}" && npm run grab --- --site=${source.site_name} --channels="${channelsPath}" --output="${outputPath}" --days=${days} --maxConnections=${maxConnections} --timeout=${timeout}`;

      const { stdout, stderr } = await execAsync(grabCommand, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: parseInt(timeout) * 100 // timeout x 100 per sicurezza
      });

      console.log(`[EPG] Grab completed`);
      if (stdout) console.log(`[EPG] stdout:`, stdout.substring(0, 500));
      if (stderr) console.error(`[EPG] stderr:`, stderr.substring(0, 500));

      // Parse programs count from output
      let programsCount = 0;
      const programsMatch = stdout.match(/\((\d+) programs\)/g);
      if (programsMatch) {
        programsMatch.forEach(match => {
          const count = parseInt(match.match(/\d+/)[0]);
          programsCount += count;
        });
      }

      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(startTime);

      // Count channels grabbed
      const channelsXml = await fs.readFile(channelsPath, 'utf8');
      const channelsCount = (channelsXml.match(/<channel /g) || []).length;

      // Update grab log
      db.prepare(`
        UPDATE epg_grab_logs
        SET status = 'success',
            completed_at = ?,
            duration_ms = ?,
            channels_grabbed = ?,
            programs_grabbed = ?
        WHERE id = ?
      `).run(endTime, duration, channelsCount, programsCount, logId);

      // Update source
      db.prepare(`
        UPDATE epg_sources
        SET last_grab_status = 'success',
            last_grab_at = ?,
            updated_at = ?,
            channels_count = ?,
            programs_count = ?,
            error_log = NULL
        WHERE id = ?
      `).run(endTime, endTime, channelsCount, programsCount, sourceId);

      return {
        success: true,
        logId,
        duration,
        channelsGrabbed: channelsCount,
        programsGrabbed: programsCount,
        message: `EPG grab completed successfully! Grabbed ${programsCount} programs for ${channelsCount} channels.`
      };

    } catch (error) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(startTime);

      // Update grab log
      db.prepare(`
        UPDATE epg_grab_logs
        SET status = 'error',
            completed_at = ?,
            duration_ms = ?,
            error_message = ?
        WHERE id = ?
      `).run(endTime, duration, error.message, logId);

      // Update source
      db.prepare(`
        UPDATE epg_sources
        SET last_grab_status = 'error',
            last_grab_at = ?,
            updated_at = ?,
            error_log = ?
        WHERE id = ?
      `).run(endTime, endTime, error.message, sourceId);

      throw error;
    }
  }

  /**
   * Get EPG grab logs
   */
  async getGrabLogs(limit = 50) {
    return db.prepare(`
      SELECT
        l.*,
        s.site_name
      FROM epg_grab_logs l
      LEFT JOIN epg_sources s ON l.source_id = s.id
      ORDER BY l.started_at DESC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Get EPG XML content
   */
  async getEpgXml() {
    const xmlPath = path.join(this.epgOutputPath, 'guide.xml');

    try {
      const content = await fs.readFile(xmlPath, 'utf8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty EPG
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="IPTV Manager EPG">
  <!-- No EPG data available. Run a grab first. -->
</tv>`;
      }
      throw error;
    }
  }

  /**
   * Check if EPG data exists
   */
  async hasEpgData() {
    const xmlPath = path.join(this.epgOutputPath, 'guide.xml');
    try {
      await fs.access(xmlPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate custom.channels.xml from mapped channels
   * Uses channel_epg_mappings to create optimized channels list
   * @returns {Object} { path, channelsCount, sources }
   */
  async generateCustomChannelsXml() {
    const mappings = db.prepare(`
      SELECT
        esc.site,
        esc.lang,
        esc.xmltv_id,
        esc.site_id,
        esc.display_name,
        c.custom_tvg_name,
        c.tvg_id,
        c.is_exported,
        es.site_name,
        es.priority
      FROM channel_epg_mappings cem
      JOIN epg_source_channels esc ON cem.epg_source_channel_id = esc.id
      JOIN channels c ON cem.channel_id = c.id
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE c.is_exported = 1 AND es.enabled = 1
      ORDER BY cem.priority ASC, esc.display_name ASC
    `).all();

    if (mappings.length === 0) {
      throw new Error('No mapped channels found. Run auto-matching first.');
    }

    // Generate XML
    const xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];

    for (const m of mappings) {
      // Use tvg_id from M3U channel instead of xmltv_id from EPG source
      // This ensures the guide.xml channel IDs match the M3U tvg-id values
      const forcedXmltvId = m.tvg_id || m.xmltv_id;

      const attrs = [
        `site="${this.escapeXml(m.site)}"`,
        m.lang ? `lang="${this.escapeXml(m.lang)}"` : '',
        forcedXmltvId ? `xmltv_id="${this.escapeXml(forcedXmltvId)}"` : '',
        `site_id="${this.escapeXml(m.site_id)}"`
      ].filter(Boolean).join(' ');

      xmlLines.push(`  <channel ${attrs}>${this.escapeXml(m.display_name)}</channel>`);
    }

    xmlLines.push('</channels>');

    const xmlContent = xmlLines.join('\n');

    // Save to epg-grabber/custom.channels.xml
    const customXmlPath = path.join(this.epgGrabberPath, 'custom.channels.xml');
    await fs.writeFile(customXmlPath, xmlContent, 'utf8');

    // Count unique sources
    const sources = [...new Set(mappings.map(m => m.site_name))];

    console.log(`Generated custom.channels.xml with ${mappings.length} channels from ${sources.length} sources`);

    return {
      path: 'custom.channels.xml',
      channelsCount: mappings.length,
      sources: sources
    };
  }

  /**
   * Grab EPG using custom channels (from mappings)
   * @param {Object} options - Grab options
   * @returns {Object} Grab result
   */
  async grabCustomEpg(options = {}) {
    const {
      days = 1,
      maxConnections = 1,
      timeout = 60000
    } = options;

    // 1. Generate custom.channels.xml from mappings
    console.log('[EPG] Generating custom.channels.xml from mappings...');
    const customXml = await this.generateCustomChannelsXml();

    // 2. Execute grab with custom channels
    console.log(`[EPG] Grabbing EPG for ${customXml.channelsCount} channels from ${customXml.sources.length} sources...`);

    const startTime = new Date().toISOString();

    // Create grab log (generic for multi-source)
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO epg_grab_logs (
        id, source_id, started_at, status
      ) VALUES (?, NULL, ?, 'running')
    `).run(
      logId,
      startTime
    );

    try {
      // Ensure output directory exists
      await fs.mkdir(this.epgOutputPath, { recursive: true });

      const grabberDir = this.epgGrabberPath;
      const channelsPath = path.join(grabberDir, 'custom.channels.xml');
      const outputPath = path.join(this.epgOutputPath, 'guide.xml');

      console.log(`[EPG] Grabber directory: ${grabberDir}`);
      console.log(`[EPG] Channels file: ${channelsPath}`);
      console.log(`[EPG] Output file: ${outputPath}`);
      console.log(`[EPG] Days: ${days}, Max connections: ${maxConnections}, Timeout: ${timeout}ms`);

      // Execute npm run grab with custom channels
      const grabCommand = `cd "${grabberDir}" && npm run grab --- --channels="${channelsPath}" --output="${outputPath}" --days=${days} --maxConnections=${maxConnections} --timeout=${timeout}`;

      const { stdout, stderr } = await execAsync(grabCommand, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: parseInt(timeout) * 100 // timeout x 100 per sicurezza
      });

      console.log(`[EPG] Grab completed`);
      if (stdout) console.log(`[EPG] stdout:`, stdout.substring(0, 500));
      if (stderr) console.error(`[EPG] stderr:`, stderr.substring(0, 500));

      // Parse programs count from output
      let programsCount = 0;
      const programsMatch = stdout.match(/\((\d+) programs\)/g);
      if (programsMatch) {
        programsMatch.forEach(match => {
          const count = parseInt(match.match(/\d+/)[0]);
          programsCount += count;
        });
      }

      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(startTime);

      // Update grab log
      db.prepare(`
        UPDATE epg_grab_logs
        SET status = 'success',
            completed_at = ?,
            duration_ms = ?,
            channels_grabbed = ?,
            programs_grabbed = ?
        WHERE id = ?
      `).run(endTime, duration, customXml.channelsCount, programsCount, logId);

      return {
        success: true,
        logId,
        duration,
        channelsGrabbed: customXml.channelsCount,
        programsGrabbed: programsCount,
        sources: customXml.sources,
        message: `EPG grab completed successfully! Grabbed ${programsCount} programs for ${customXml.channelsCount} channels from ${customXml.sources.length} sources.`
      };

    } catch (error) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(startTime);

      // Update grab log
      db.prepare(`
        UPDATE epg_grab_logs
        SET status = 'error',
            completed_at = ?,
            duration_ms = ?,
            error_message = ?
        WHERE id = ?
      `).run(endTime, duration, error.message, logId);

      throw error;
    }
  }

  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = new EpgService();

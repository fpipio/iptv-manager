const express = require('express');
const router = express.Router();
const epgService = require('../services/epgService');
const epgChannelsParser = require('../services/epgChannelsParser');
const epgMatchingService = require('../services/epgMatchingService');

/**
 * GET /api/epg/sources
 * Get all EPG sources
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await epgService.getAllSources();
    res.json(sources);
  } catch (error) {
    console.error('[EPG] Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch EPG sources' });
  }
});

/**
 * GET /api/epg/sources/:id
 * Get EPG source by ID
 */
router.get('/sources/:id', async (req, res) => {
  try {
    const source = await epgService.getSourceById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'EPG source not found' });
    }
    res.json(source);
  } catch (error) {
    console.error('[EPG] Error fetching source:', error);
    res.status(500).json({ error: 'Failed to fetch EPG source' });
  }
});

/**
 * POST /api/epg/sources
 * Create new EPG source
 */
router.post('/sources', async (req, res) => {
  try {
    const { siteName, siteUrl, enabled } = req.body;

    if (!siteName) {
      return res.status(400).json({ error: 'Site name is required' });
    }

    const source = await epgService.createSource({
      siteName,
      siteUrl,
      enabled
    });

    res.status(201).json(source);
  } catch (error) {
    console.error('[EPG] Error creating source:', error);

    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A source with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to create EPG source' });
  }
});

/**
 * PUT /api/epg/sources/:id
 * Update EPG source
 */
router.put('/sources/:id', async (req, res) => {
  try {
    const { siteName, siteUrl, enabled, priority } = req.body;

    const source = await epgService.updateSource(req.params.id, {
      siteName,
      siteUrl,
      enabled,
      priority
    });

    if (!source) {
      return res.status(404).json({ error: 'EPG source not found' });
    }

    res.json(source);
  } catch (error) {
    console.error('[EPG] Error updating source:', error);

    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A source with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to update EPG source' });
  }
});

/**
 * DELETE /api/epg/sources/:id
 * Delete EPG source
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    await epgService.deleteSource(req.params.id);
    res.json({ message: 'EPG source deleted successfully' });
  } catch (error) {
    console.error('[EPG] Error deleting source:', error);
    res.status(500).json({ error: 'Failed to delete EPG source' });
  }
});

/**
 * GET /api/epg/config
 * Get EPG configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = await epgService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[EPG] Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch EPG configuration' });
  }
});

/**
 * PUT /api/epg/config
 * Update EPG configuration
 */
router.put('/config', async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await epgService.updateConfig(key, value);
    }

    const config = await epgService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[EPG] Error updating config:', error);
    res.status(500).json({ error: 'Failed to update EPG configuration' });
  }
});

/**
 * POST /api/epg/grab/:sourceId
 * Trigger EPG grab for a source
 */
router.post('/grab/:sourceId', async (req, res) => {
  try {
    const result = await epgService.grabEpg(req.params.sourceId);
    res.json(result);
  } catch (error) {
    console.error('[EPG] Error grabbing EPG:', error);
    res.status(500).json({ error: error.message || 'Failed to grab EPG data' });
  }
});

/**
 * POST /api/epg/grab-all
 * Trigger EPG grab for all enabled sources
 */
router.post('/grab-all', async (req, res) => {
  try {
    const sources = await epgService.getAllSources();
    const enabledSources = sources.filter(s => s.enabled);

    if (enabledSources.length === 0) {
      return res.status(400).json({ error: 'No enabled EPG sources found' });
    }

    const results = [];
    for (const source of enabledSources) {
      try {
        const result = await epgService.grabEpg(source.id);
        results.push({ sourceId: source.id, siteName: source.site_name, ...result });
      } catch (error) {
        results.push({
          sourceId: source.id,
          siteName: source.site_name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'EPG grab completed for all enabled sources',
      results
    });
  } catch (error) {
    console.error('[EPG] Error grabbing all EPG:', error);
    res.status(500).json({ error: 'Failed to grab EPG data' });
  }
});

/**
 * GET /api/epg/logs
 * Get EPG grab logs
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await epgService.getGrabLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('[EPG] Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch EPG logs' });
  }
});

/**
 * GET /api/epg/xml
 * Get EPG XML data (XMLTV format)
 * This endpoint is used by IPTV players via url-tvg in M3U
 */
router.get('/xml', async (req, res) => {
  try {
    const xmlContent = await epgService.getEpgXml();

    res.set('Content-Type', 'application/xml');
    res.set('Content-Disposition', 'inline; filename="guide.xml"');
    res.send(xmlContent);
  } catch (error) {
    console.error('[EPG] Error serving EPG XML:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><tv></tv>');
  }
});

/**
 * GET /api/epg/status
 * Get EPG system status
 */
router.get('/status', async (req, res) => {
  try {
    const sources = await epgService.getAllSources();
    const config = await epgService.getConfig();
    const hasData = await epgService.hasEpgData();
    const recentLogs = await epgService.getGrabLogs(5);

    const enabledCount = sources.filter(s => s.enabled).length;
    const successfulGrabs = recentLogs.filter(l => l.status === 'success').length;

    res.json({
      hasEpgData: hasData,
      sourcesTotal: sources.length,
      sourcesEnabled: enabledCount,
      autoGrabEnabled: config.auto_grab_enabled === '1',
      grabSchedule: config.auto_grab_schedule,
      recentGrabs: recentLogs.length,
      recentSuccessRate: recentLogs.length > 0
        ? `${Math.round((successfulGrabs / recentLogs.length) * 100)}%`
        : 'N/A'
    });
  } catch (error) {
    console.error('[EPG] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch EPG status' });
  }
});

/**
 * POST /api/epg/channels/sync
 * Sync EPG source channels from filesystem to database
 */
router.post('/channels/sync', async (req, res) => {
  try {
    const stats = await epgChannelsParser.syncAllSourceChannels();
    res.json({
      message: 'EPG channels synced successfully',
      ...stats
    });
  } catch (error) {
    console.error('[EPG] Error syncing channels:', error);
    res.status(500).json({ error: error.message || 'Failed to sync EPG channels' });
  }
});

/**
 * GET /api/epg/channels/stats
 * Get EPG channels statistics
 */
router.get('/channels/stats', async (req, res) => {
  try {
    const stats = await epgChannelsParser.getChannelsStats();
    res.json(stats);
  } catch (error) {
    console.error('[EPG] Error fetching channels stats:', error);
    res.status(500).json({ error: 'Failed to fetch channels statistics' });
  }
});

/**
 * GET /api/epg/channels/source/:sourceId
 * Get all channels for a specific EPG source
 */
router.get('/channels/source/:sourceId', async (req, res) => {
  try {
    const channels = await epgChannelsParser.getChannelsForSource(req.params.sourceId);
    res.json(channels);
  } catch (error) {
    console.error('[EPG] Error fetching source channels:', error);
    res.status(500).json({ error: 'Failed to fetch source channels' });
  }
});

/**
 * POST /api/epg/matching/auto
 * Run auto-matching for all channels
 */
router.post('/matching/auto', async (req, res) => {
  try {
    const { useFuzzyMatching = false, overwriteManual = false } = req.body;

    const stats = await epgMatchingService.autoMatchAllChannels({
      useFuzzyMatching,
      overwriteManual
    });

    res.json({
      message: 'Auto-matching completed',
      ...stats
    });
  } catch (error) {
    console.error('[EPG] Error running auto-matching:', error);
    res.status(500).json({ error: error.message || 'Failed to run auto-matching' });
  }
});

/**
 * GET /api/epg/matching/all
 * Get all channel-to-EPG mappings
 */
router.get('/matching/all', async (req, res) => {
  try {
    const mappings = await epgMatchingService.getAllMappings();
    res.json(mappings);
  } catch (error) {
    console.error('[EPG] Error fetching mappings:', error);
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

/**
 * GET /api/epg/matching/channel/:channelId
 * Get mapping for a specific channel
 */
router.get('/matching/channel/:channelId', async (req, res) => {
  try {
    const mapping = await epgMatchingService.getMappingForChannel(req.params.channelId);
    res.json(mapping);
  } catch (error) {
    console.error('[EPG] Error fetching channel mapping:', error);
    res.status(500).json({ error: 'Failed to fetch channel mapping' });
  }
});

/**
 * GET /api/epg/matching/alternatives/:tvgId
 * Get alternative EPG matches for a tvg-id
 */
router.get('/matching/alternatives/:tvgId', async (req, res) => {
  try {
    const alternatives = await epgMatchingService.getAlternativeMatches(req.params.tvgId);
    res.json(alternatives);
  } catch (error) {
    console.error('[EPG] Error fetching alternatives:', error);
    res.status(500).json({ error: 'Failed to fetch alternative matches' });
  }
});

/**
 * POST /api/epg/matching/manual
 * Create manual mapping between channel and EPG source channel
 */
router.post('/matching/manual', async (req, res) => {
  try {
    const { channelId, epgSourceChannelId, priority = 1 } = req.body;

    if (!channelId || !epgSourceChannelId) {
      return res.status(400).json({ error: 'channelId and epgSourceChannelId are required' });
    }

    await epgMatchingService.createMapping(channelId, epgSourceChannelId, {
      priority,
      match_quality: 'manual',
      is_manual: true
    });

    res.json({ message: 'Manual mapping created successfully' });
  } catch (error) {
    console.error('[EPG] Error creating manual mapping:', error);
    res.status(500).json({ error: error.message || 'Failed to create manual mapping' });
  }
});

/**
 * DELETE /api/epg/matching/channel/:channelId
 * Delete mapping for a channel
 */
router.delete('/matching/channel/:channelId', async (req, res) => {
  try {
    await epgMatchingService.deleteMapping(req.params.channelId);
    res.json({ message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('[EPG] Error deleting mapping:', error);
    res.status(500).json({ error: 'Failed to delete mapping' });
  }
});

/**
 * GET /api/epg/matching/stats
 * Get matching statistics
 */
router.get('/matching/stats', async (req, res) => {
  try {
    const stats = await epgMatchingService.getMappingStats();
    res.json(stats);
  } catch (error) {
    console.error('[EPG] Error fetching matching stats:', error);
    res.status(500).json({ error: 'Failed to fetch matching statistics' });
  }
});

/**
 * POST /api/epg/grab-custom
 * Grab EPG using custom channels (from mappings)
 */
router.post('/grab-custom', async (req, res) => {
  try {
    const { days, maxConnections, timeout } = req.body;

    const result = await epgService.grabCustomEpg({
      days,
      maxConnections,
      timeout
    });

    res.json(result);
  } catch (error) {
    console.error('[EPG] Error grabbing custom EPG:', error);
    res.status(500).json({ error: error.message || 'Failed to grab custom EPG data' });
  }
});

/**
 * POST /api/epg/generate-custom-xml
 * Generate custom.channels.xml from mappings
 */
router.post('/generate-custom-xml', async (req, res) => {
  try {
    const result = await epgService.generateCustomChannelsXml();
    res.json({
      message: 'Custom channels XML generated successfully',
      ...result
    });
  } catch (error) {
    console.error('[EPG] Error generating custom XML:', error);
    res.status(500).json({ error: error.message || 'Failed to generate custom channels XML' });
  }
});

/**
 * GET /api/epg/debug/unmapped
 * Debug: Get unmapped channels with their tvg-id for troubleshooting
 */
router.get('/debug/unmapped', async (req, res) => {
  try {
    const db = require('../db/database');

    // Get unmapped channels
    const unmapped = db.prepare(`
      SELECT
        c.id,
        c.tvg_id,
        c.custom_tvg_name,
        c.imported_tvg_name
      FROM channels c
      LEFT JOIN channel_epg_mappings cem ON c.id = cem.channel_id
      WHERE c.tvg_id IS NOT NULL
        AND c.tvg_id != ''
        AND cem.channel_id IS NULL
      ORDER BY c.custom_tvg_name ASC
    `).all();

    // Sample EPG channels to compare
    const epgSample = db.prepare(`
      SELECT DISTINCT esc.xmltv_id, esc.display_name, es.site_name
      FROM epg_source_channels esc
      JOIN epg_sources es ON esc.epg_source_id = es.id
      WHERE es.enabled = 1
      ORDER BY esc.xmltv_id
      LIMIT 20
    `).all();

    // Check for potential case-sensitive mismatches
    const potentialMatches = [];
    for (const channel of unmapped) {
      const tvgIdLower = channel.tvg_id.toLowerCase();
      const matches = db.prepare(`
        SELECT esc.xmltv_id, esc.display_name, es.site_name
        FROM epg_source_channels esc
        JOIN epg_sources es ON esc.epg_source_id = es.id
        WHERE LOWER(esc.xmltv_id) = ? AND es.enabled = 1
        LIMIT 3
      `).all(tvgIdLower);

      if (matches.length > 0) {
        potentialMatches.push({
          m3u_channel: channel.custom_tvg_name || channel.imported_tvg_name,
          m3u_tvg_id: channel.tvg_id,
          epg_candidates: matches.map(m => ({
            xmltv_id: m.xmltv_id,
            display_name: m.display_name,
            source: m.site_name,
            issue: m.xmltv_id !== channel.tvg_id ? 'Case mismatch' : 'Unknown'
          }))
        });
      }
    }

    res.json({
      unmappedCount: unmapped.length,
      unmappedChannels: unmapped,
      epgSample: epgSample,
      potentialMatches: potentialMatches,
      hint: 'Compare tvg_id from M3U channels with xmltv_id from EPG sources. Check potentialMatches for case-sensitive issues.'
    });
  } catch (error) {
    console.error('[EPG] Error fetching debug info:', error);
    res.status(500).json({ error: 'Failed to fetch debug info' });
  }
});

module.exports = router;

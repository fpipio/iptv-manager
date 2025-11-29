const cron = require('node-cron');
const epgService = require('./epgService');
const db = require('../db/database');

/**
 * EPG Scheduler Service
 * Manages automatic EPG grab scheduling based on database configuration
 */

class EpgScheduler {
  constructor() {
    this.currentTask = null;
    this.currentSchedule = null;
  }

  /**
   * Initialize scheduler - load config and start if enabled
   */
  async initialize() {
    console.log('[EPG Scheduler] Initializing...');
    await this.reloadSchedule();
  }

  /**
   * Reload schedule from database configuration
   */
  async reloadSchedule() {
    try {
      const config = await this.getConfig();

      const enabled = config.auto_grab_enabled === '1';
      const schedule = config.auto_grab_schedule || '0 */6 * * *'; // Default: every 6 hours

      console.log(`[EPG Scheduler] Config loaded - Enabled: ${enabled}, Schedule: ${schedule}`);

      // Stop existing task if any
      if (this.currentTask) {
        this.currentTask.stop();
        this.currentTask = null;
        console.log('[EPG Scheduler] Stopped previous task');
      }

      // Start new task if enabled
      if (enabled) {
        this.start(schedule);
      }
    } catch (error) {
      console.error('[EPG Scheduler] Error reloading schedule:', error);
    }
  }

  /**
   * Get EPG configuration from database
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
   * Start scheduled EPG grab
   * @param {string} cronExpression - Cron expression (e.g., "0 *\/6 * * *")
   */
  start(cronExpression) {
    if (!cron.validate(cronExpression)) {
      console.error(`[EPG Scheduler] Invalid cron expression: ${cronExpression}`);
      return;
    }

    console.log(`[EPG Scheduler] Starting with schedule: ${cronExpression}`);
    this.currentSchedule = cronExpression;

    this.currentTask = cron.schedule(cronExpression, async () => {
      console.log('[EPG Scheduler] Executing scheduled EPG grab...');
      try {
        const config = await this.getConfig();
        const days = parseInt(config.grab_days) || 3;
        const maxConnections = parseInt(config.max_connections) || 1;
        const timeout = parseInt(config.timeout_ms) || 60000;

        const result = await epgService.grabCustomEpg({
          days,
          maxConnections,
          timeout
        });

        console.log(`[EPG Scheduler] ✅ Grab completed! Channels: ${result.channelsGrabbed}, Programs: ${result.programsGrabbed}`);
      } catch (error) {
        console.error('[EPG Scheduler] ❌ Grab failed:', error.message);
      }
    });

    console.log('[EPG Scheduler] Scheduled task started');
  }

  /**
   * Stop scheduled task
   */
  stop() {
    if (this.currentTask) {
      this.currentTask.stop();
      this.currentTask = null;
      this.currentSchedule = null;
      console.log('[EPG Scheduler] Stopped');
    }
  }

  /**
   * Get current scheduler status
   */
  getStatus() {
    return {
      running: this.currentTask !== null,
      schedule: this.currentSchedule
    };
  }

  /**
   * Update configuration and reload scheduler
   * @param {boolean} enabled - Enable/disable auto grab
   * @param {string} schedule - Cron expression (optional)
   */
  async updateConfig(enabled, schedule) {
    const now = new Date().toISOString();

    if (enabled !== undefined) {
      db.prepare(`
        UPDATE epg_config
        SET value = ?, updated_at = ?
        WHERE key = 'auto_grab_enabled'
      `).run(enabled ? '1' : '0', now);
    }

    if (schedule !== undefined) {
      if (!cron.validate(schedule)) {
        throw new Error(`Invalid cron expression: ${schedule}`);
      }

      db.prepare(`
        UPDATE epg_config
        SET value = ?, updated_at = ?
        WHERE key = 'auto_grab_schedule'
      `).run(schedule, now);
    }

    // Reload scheduler with new config
    await this.reloadSchedule();
  }
}

module.exports = new EpgScheduler();

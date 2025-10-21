const { v4: uuidv4 } = require('uuid');

/**
 * In-memory Job Queue Service
 * Manages asynchronous file operations with progress tracking
 */

class JobQueue {
  constructor() {
    this.jobs = new Map(); // jobId -> job object
    this.workers = new Map(); // jobId -> worker promise
  }

  /**
   * Create a new job
   * @param {Object} jobData - Job configuration
   * @returns {string} Job ID
   */
  createJob(jobData) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: jobData.type, // 'create' | 'delete' | 'import_channels' | 'import_movies'
      groupTitle: jobData.groupTitle || null,
      outputDir: jobData.outputDir || null,
      description: jobData.description || null,
      total: jobData.total,
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: 0,
      status: 'pending', // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      startedAt: null,
      completedAt: null,
      error: null,
      errorDetails: []
    };

    this.jobs.set(jobId, job);
    const desc = jobData.description || (jobData.groupTitle ? `group "${jobData.groupTitle}"` : 'import');
    console.log(`[JobQueue] Created job ${jobId} for ${desc} (${jobData.type})`);
    return jobId;
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job object or null
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Update job progress
   * @param {string} jobId - Job ID
   * @param {Object} updates - Fields to update
   */
  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  /**
   * Start processing a job
   * @param {string} jobId - Job ID
   * @param {Function} processor - Async function to process the job
   */
  async startJob(jobId, processor) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Job ${jobId} is already ${job.status}`);
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();

    console.log(`[JobQueue] Starting job ${jobId}`);

    const workerPromise = processor(job, this)
      .then(() => {
        if (job.status === 'running') {
          job.status = 'completed';
          job.completedAt = new Date().toISOString();
          console.log(`[JobQueue] Job ${jobId} completed: ${job.created} created, ${job.deleted} deleted, ${job.errors} errors`);
        }
      })
      .catch((error) => {
        console.error(`[JobQueue] Job ${jobId} failed:`, error);
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date().toISOString();
      })
      .finally(() => {
        this.workers.delete(jobId);
      });

    this.workers.set(jobId, workerPromise);
  }

  /**
   * Cancel a running job
   * @param {string} jobId - Job ID
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();
      console.log(`[JobQueue] Job ${jobId} cancelled`);
    }
  }

  /**
   * Clean up old completed/failed jobs
   * @param {number} maxAge - Maximum age in milliseconds (default 1 hour)
   */
  cleanup(maxAge = 3600000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        const completedAt = new Date(job.completedAt).getTime();
        if (now - completedAt > maxAge) {
          this.jobs.delete(jobId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[JobQueue] Cleaned up ${cleaned} old jobs`);
    }
  }

  /**
   * Get all jobs (for debugging)
   * @returns {Array} Array of job objects
   */
  getAllJobs() {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
const jobQueue = new JobQueue();

// Auto-cleanup every hour
setInterval(() => {
  jobQueue.cleanup();
}, 3600000);

module.exports = jobQueue;

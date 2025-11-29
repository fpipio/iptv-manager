const express = require('express');
const cors = require('cors');
const path = require('path');
const { runMigrations } = require('./db/migrate');
const epgScheduler = require('./services/epgScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Run migrations on startup
try {
  runMigrations();
} catch (error) {
  console.error('Failed to run migrations:', error);
  process.exit(1);
}

// Initialize EPG scheduler
epgScheduler.initialize().catch(error => {
  console.error('Failed to initialize EPG scheduler:', error);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (highest priority)
app.use('/api/groups', require('./routes/groups'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/import', require('./routes/import'));
app.use('/api/export', require('./routes/export'));
app.use('/api/epg', require('./routes/epg'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/cleanup', require('./routes/cleanup'));
app.use('/api/year-libraries', require('./routes/yearLibraries'));
app.use('/api/reset', require('./routes/reset'));

// Serve M3U output files (BEFORE frontend fallback)
const outputPath = process.env.OUTPUT_PATH || path.join(__dirname, '../data/output');
app.use('/output', express.static(outputPath));

// Serve EPG files (BEFORE frontend fallback)
// Using /epg-files instead of /epg to avoid conflicts with Vue Router /epg/* routes
const epgPath = process.env.EPG_PATH || path.join(__dirname, '../data/epg');
app.use('/epg-files', express.static(epgPath));

// Serve frontend static files (in production)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');

  // Serve static assets only from /assets directory
  app.use('/assets', express.static(path.join(publicPath, 'assets')));

  // Serve favicon and other root files
  app.use('/vite.svg', express.static(path.join(publicPath, 'vite.svg')));

  // Fallback for Vue Router (SPA) - MUST BE LAST!
  // Exclude /output and /epg-files paths from SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/output/') || req.path.startsWith('/epg-files/')) {
      return next(); // Let other handlers deal with it
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 IPTV Manager Server running on port ${PORT}`);
  console.log(`   - Frontend: http://localhost:${PORT}`);
  console.log(`   - API: http://localhost:${PORT}/api`);
  console.log(`   - M3U Playlist: http://localhost:${PORT}/output/playlist.m3u`);
  console.log(`   - EPG Guide: http://localhost:${PORT}/epg-files/guide.xml\n`);
});

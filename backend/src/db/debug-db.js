#!/usr/bin/env node
/**
 * Database Debug Script
 * Utile per interrogare il database quando sqlite3 CLI non è disponibile
 *
 * Usage:
 *   node debug-db.js                          # Mostra tutte le configurazioni
 *   node debug-db.js migrations               # Mostra migrations eseguite
 *   node debug-db.js query "SELECT * FROM ..." # Esegui query custom
 */

const db = require('./database');

const command = process.argv[2] || 'config';
const arg = process.argv[3];

console.log('=== IPTV Manager - Database Debug ===\n');

try {
  switch (command) {
    case 'config':
    case 'epg_config':
      console.log('📋 EPG Configuration:');
      console.log('─────────────────────────────────────');
      const configs = db.prepare('SELECT key, value, updated_at FROM epg_config ORDER BY key').all();
      if (configs.length === 0) {
        console.log('  (empty)');
      } else {
        configs.forEach(row => {
          console.log(`  ${row.key.padEnd(30)} = ${row.value}`);
          console.log(`    Updated: ${row.updated_at}`);
        });
      }
      break;

    case 'migrations':
      console.log('📦 Executed Migrations:');
      console.log('─────────────────────────────────────');
      const migrations = db.prepare('SELECT filename, executed_at FROM migrations ORDER BY executed_at').all();
      if (migrations.length === 0) {
        console.log('  (empty)');
      } else {
        migrations.forEach((row, idx) => {
          console.log(`  ${(idx + 1).toString().padStart(2)}. ${row.filename}`);
          console.log(`      Executed: ${row.executed_at}`);
        });
      }
      break;

    case 'movies-stats':
      console.log('🎬 Movies Statistics:');
      console.log('─────────────────────────────────────');
      const total = db.prepare('SELECT COUNT(*) as count FROM movies').get();
      const withStrm = db.prepare('SELECT COUNT(*) as count FROM movies WHERE strm_enabled = 1').get();
      const groups = db.prepare('SELECT group_title, COUNT(*) as count FROM movies GROUP BY group_title ORDER BY count DESC').all();

      console.log(`  Total Movies: ${total.count}`);
      console.log(`  With STRM: ${withStrm.count}`);
      console.log(`\n  By Group:`);
      groups.forEach(row => {
        console.log(`    ${row.group_title.padEnd(30)} : ${row.count} movies`);
      });
      break;

    case 'channels-stats':
      console.log('📺 Channels Statistics:');
      console.log('─────────────────────────────────────');
      const totalChannels = db.prepare('SELECT COUNT(*) as count FROM channels').get();
      const exportedChannels = db.prepare('SELECT COUNT(*) as count FROM channels WHERE is_exported = 1').get();
      const groupsCount = db.prepare('SELECT COUNT(*) as count FROM group_titles').get();

      console.log(`  Total Channels: ${totalChannels.count}`);
      console.log(`  Exported: ${exportedChannels.count}`);
      console.log(`  Total Groups: ${groupsCount.count}`);
      break;

    case 'query':
      if (!arg) {
        console.error('❌ Error: SQL query required');
        console.log('\nUsage: node debug-db.js query "SELECT * FROM epg_config"');
        process.exit(1);
      }
      console.log('🔍 Custom Query:');
      console.log(`   ${arg}`);
      console.log('─────────────────────────────────────');

      const results = db.prepare(arg).all();
      if (results.length === 0) {
        console.log('  (no results)');
      } else {
        console.log(JSON.stringify(results, null, 2));
      }
      break;

    case 'check-movies-dir':
      console.log('🎯 Movies Directory Check:');
      console.log('─────────────────────────────────────');
      const moviesDir = db.prepare("SELECT value FROM epg_config WHERE key = 'movies_directory'").get();
      if (moviesDir) {
        console.log(`  ✓ Configuration found: ${moviesDir.value}`);
      } else {
        console.log('  ❌ Configuration NOT found!');
        console.log('  Running fix...');
        db.prepare(
          `INSERT INTO epg_config (key, value, updated_at)
           VALUES ('movies_directory', '/app/data/movies', datetime('now'))`
        ).run();
        console.log('  ✓ Fixed: inserted default value /app/data/movies');
      }
      break;

    case 'help':
    default:
      console.log('Available commands:');
      console.log('  config              Show all epg_config entries');
      console.log('  migrations          Show executed migrations');
      console.log('  movies-stats        Show movies statistics');
      console.log('  channels-stats      Show channels statistics');
      console.log('  check-movies-dir    Check and fix movies_directory config');
      console.log('  query "SQL"         Execute custom SQL query');
      console.log('  help                Show this help');
      console.log('\nExamples:');
      console.log('  docker exec iptv-manager node src/db/debug-db.js config');
      console.log('  docker exec iptv-manager node src/db/debug-db.js migrations');
      console.log('  docker exec iptv-manager node src/db/debug-db.js check-movies-dir');
      break;
  }

  console.log('');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

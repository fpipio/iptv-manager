const db = require('./database');
const fs = require('fs');
const path = require('path');

function runMigrations() {
  console.log('Running database migrations...');

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      executed_at TEXT NOT NULL
    )
  `);

  // Get list of migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Get executed migrations
  const executed = db.prepare('SELECT filename FROM migrations').all();
  const executedFiles = new Set(executed.map(m => m.filename));

  // Run pending migrations
  for (const file of migrationFiles) {
    if (executedFiles.has(file)) {
      console.log(`  ✓ ${file} (already executed)`);
      continue;
    }

    console.log(`  → Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename, executed_at) VALUES (?, ?)').run(
        file,
        new Date().toISOString()
      );
      console.log(`  ✓ ${file} completed`);
    } catch (error) {
      console.error(`  ✗ ${file} failed:`, error.message);
      throw error;
    }
  }

  console.log('Migrations completed successfully!');
}

// Run migrations if executed directly
if (require.main === module) {
  runMigrations();
  db.close();
}

module.exports = { runMigrations };

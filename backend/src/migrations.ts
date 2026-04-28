import { pool } from './db';
import fs from 'fs';
import path from 'path';

/**
 * Run database migrations in order
 * Migrations are applied only once per version
 */
export async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('\n🔄 Running database migrations...\n');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of applied migrations
    const result = await client.query('SELECT name FROM migrations');
    const appliedMigrations = new Set(result.rows.map((r) => r.name));

    // Migration files to run in order
    const migrationFiles = [
      'migration_001_add_enumerator_email.sql',
      'migration_002_add_image_url.sql',
      'migration_003_add_features.sql',
      'migration_004_fix_geom_and_quality.sql',
    ];

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`✅ ${file} (already applied)`);
        continue;
      }

      const filePath = path.join(__dirname, '..', '..', 'database', file);

      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} (not found, skipping)`);
        continue;
      }

      console.log(`⏳ Applying ${file}...`);

      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        console.log(`✅ ${file}`);
      } catch (error: any) {
        console.error(`❌ ${file} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

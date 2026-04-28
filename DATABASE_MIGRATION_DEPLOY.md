# Database Migration Deployment Guide

## Critical: Apply migration_003 to Production

This document provides step-by-step instructions to deploy the Phase 2 features database schema to production.

## Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Verify migration file exists: `database/migration_003_add_features.sql`
- [ ] Test migration on development database first
- [ ] Notify team of planned downtime (if any)
- [ ] Have rollback plan ready

## Development Testing (Local)

### 1. Reset Local Database (Optional - for clean test)

```bash
# Drop and recreate database
dropdb geowaste_kilifi_dev
createdb geowaste_kilifi_dev

# Load base schema
psql geowaste_kilifi_dev -f database/schema.sql

# Load Phase 1 migration (image columns)
psql geowaste_kilifi_dev -f database/migration_002_add_image_url.sql

# Load Phase 2 migration (advanced features)
psql geowaste_kilifi_dev -f database/migration_003_add_features.sql
```

### 2. Verify Migration

```bash
# Connect to database
psql geowaste_kilifi_dev

# Run verification queries
\d enumerator_assignments  -- Should show assignment table
\d record_comments          -- Should show comments table
\d notifications            -- Should show notifications table
\d offline_queue            -- Should show offline queue table

# Check columns added to waste_sites
\d waste_sites
-- Look for: quality_score, quality_issues, is_flagged, flag_reason

# Check enumerators permissions column
\d enumerators
-- Look for: permissions (JSONB)
```

### 3. Test with Sample Data

```sql
-- Test creating an assignment
INSERT INTO enumerator_assignments (enumerator_id, ward, status, target_records)
VALUES (1, 'Tezo', 'active', 50);

-- Test adding a comment
INSERT INTO record_comments (waste_site_id, author_id, content, comment_type)
VALUES (1, 1, 'Test comment', 'general');

-- Test creating a notification
INSERT INTO notifications (recipient_id, subject, message, notification_type, is_read)
VALUES (1, 'Test', 'Test notification', 'assignment', false);

-- Verify rows were created
SELECT COUNT(*) FROM enumerator_assignments;
SELECT COUNT(*) FROM record_comments;
SELECT COUNT(*) FROM notifications;

-- Cleanup test data
DELETE FROM enumerator_assignments WHERE ward = 'Tezo';
DELETE FROM record_comments WHERE content LIKE 'Test%';
DELETE FROM notifications WHERE message = 'Test notification';
```

## Production Deployment

### Option 1: Direct psql Connection (Recommended)

#### 1a. Backup Production Database

```bash
# Full database backup
pg_dump postgresql://geowaste:PASSWORD@dpg-d78fh09r0fns738k6m40-a.frankfurt-postgres.render.com/geowaste_kilifi > backup_2024_$(date +%m%d).sql

# Store backup securely
```

#### 1b. Apply Migration

```bash
# Run migration on production
psql postgresql://geowaste:UYmRtM2J2SuVsxxUJo0TcXCsIrsGfCiO@dpg-d78fh09r0fns738k6m40-a.frankfurt-postgres.render.com/geowaste_kilifi -f database/migration_003_add_features.sql
```

#### 1c. Verify Success

```bash
# Connect and verify
psql postgresql://geowaste:UYmRtM2J2SuVsxxUJo0TcXCsIrsGfCiO@dpg-d78fh09r0fns738k6m40-a.frankfurt-postgres.render.com/geowaste_kilifi

# Run verification queries (same as above)
\d enumerator_assignments
\d record_comments
\d notifications
\d offline_queue
SELECT column_name FROM information_schema.columns WHERE table_name='waste_sites' ORDER BY column_name;
```

### Option 2: Via Render Dashboard (Backup Method)

If direct psql fails:

1. Go to Render PostgreSQL Dashboard
2. Click "Database" section
3. Open "Query" or "SQL Editor"
4. Paste contents of `database/migration_003_add_features.sql`
5. Execute query
6. Verify tables created

### Option 3: Via Application Startup (Migration Runner)

Create `backend/src/runMigrations.ts`:

```typescript
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('⏳ Running migrations...');

    // Read and execute migration files in order
    const migrations = [
      'migration_002_add_image_url.sql',
      'migration_003_add_features.sql',
    ];

    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', '..', 'database', migration);
      
      if (!fs.existsSync(filePath)) {
        console.log(` Skipping ${migration} (not found)`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Running: ${migration}`);
      await client.query(sql);
      console.log(`✓ Completed: ${migration}`);
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations on startup
if (require.main === module) {
  runMigrations().catch(console.error);
}
```

Update `backend/src/index.ts`:

```typescript
import { runMigrations } from './runMigrations';

// Run migrations before starting server
runMigrations().then(() => {
  // Start server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

## Post-Deployment Verification

### 1. Check All Tables Created

```bash
psql postgresql://geowaste:UYmRtM2J2SuVsxxUJo0TcXCsIrsGfCiO@dpg-d78fh09r0fns738k6m40-a.frankfurt-postgres.render.com/geowaste_kilifi

-- List all new tables
SELECT tablename FROM pg_tables 
WHERE tablename IN ('enumerator_assignments', 'record_comments', 'notifications', 'offline_queue')
ORDER BY tablename;

-- Expected output:
--  tablename
-- -----------
--  enumerator_assignments
--  notifications
--  offline_queue
--  record_comments

-- Count rows (should all be 0 for new tables)
SELECT 'enumerator_assignments' as table_name, COUNT(*) FROM enumerator_assignments
UNION ALL
SELECT 'record_comments', COUNT(*) FROM record_comments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'offline_queue', COUNT(*) FROM offline_queue;

-- Check new columns on waste_sites
SELECT COUNT(*) as waste_sites_count FROM information_schema.columns 
WHERE table_name = 'waste_sites';
-- Expected: 40+ columns (was 36 before migration)

-- Check new columns on enumerators
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'enumerators' AND column_name IN ('role', 'permissions')
ORDER BY column_name;
-- Expected: role (varchar), permissions (jsonb)
```

### 2. Verify Constraints

```sql
-- Check unique constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'enumerator_assignments' AND constraint_type = 'UNIQUE';

-- Check foreign keys
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name IN ('enumerator_assignments', 'record_comments', 'notifications', 'offline_queue')
AND constraint_type = 'FOREIGN KEY';
```

### 3. Verify Default Permissions

```sql
-- Check default permissions were set for existing enumerators
SELECT id, email, role, permissions 
FROM enumerators 
LIMIT 5;

-- Should see permissions JSONB column populated
-- Example format:
-- {"view_records": true, "export_records": true, "manage_assignments": false}
```

### 4. Test Backend Connection

```bash
cd backend
npm run build  # Should compile without errors

# Start server (will show migration logs)
npm start

# In another terminal, test API
curl https://geowastekilifiproject.onrender.com/api/health
# Should return 200 OK
```

## Rollback Procedure (If Issues)

If something goes wrong, you can rollback by dropping the new tables:

```sql
-- Drop new tables (in correct order to respect foreign keys)
DROP TABLE IF EXISTS offline_queue CASCADE;
DROP TABLE IF EXISTS record_comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS enumerator_assignments CASCADE;

-- Drop new columns from existing tables
ALTER TABLE waste_sites 
DROP COLUMN IF EXISTS quality_score,
DROP COLUMN IF EXISTS quality_issues,
DROP COLUMN IF EXISTS is_flagged,
DROP COLUMN IF EXISTS flag_reason;

ALTER TABLE enumerators
DROP COLUMN IF EXISTS permissions;

-- Verify rollback
\d enumerators
\d waste_sites
SELECT tablename FROM pg_tables WHERE tablename LIKE '%enumerator%' OR tablename LIKE '%comment%' OR tablename LIKE '%notification%' OR tablename LIKE '%offline%';
```

## Deployment Timeline

**Estimated time to complete:**
- Development testing: 30 minutes
- Production backup: 5 minutes
- Migration execution: 2-3 minutes
- Verification: 10 minutes
- **Total: ~50 minutes**

**Best time to deploy:**
- Off-peak hours (early morning or late evening)
- When no active enumerators are using the app
- Have team on standby for troubleshooting

## Success Indicators

After deployment, you should see:

✅ All 4 new tables exist in production database
✅ All new columns exist on existing tables
✅ No error messages in server logs
✅ Backend starts without migration errors
✅ API endpoints respond normally
✅ Frontend loads without errors

## Troubleshooting

### Error: "Permission denied for schema public"

**Cause:** User doesn't have permission to create tables
**Solution:** Use superuser account or contact Render support

### Error: "Relation already exists"

**Cause:** Table already created in previous migration attempt
**Solution:** Either:
1. Ignore if all tables exist
2. Drop and re-run migration
3. Use `IF NOT EXISTS` clause (already in migration file)

### Error: "Foreign key constraint failed"

**Cause:** Referencing non-existent table
**Solution:** Ensure migration_002 was applied before migration_003

### Slow/Timeout

**Cause:** Migration taking too long on large database
**Solution:** 
1. Run separately (each table)
2. Check server resources
3. Contact Render support for performance issues

---

## Next Steps After Deployment

1. **Update Backend Code**
   - Services now have access to new tables
   - Start implementing Phase 2 features

2. **Update Frontend**
   - Start building new UI components
   - Implement role-based visibility

3. **Testing**
   - Run full test suite
   - Test end-to-end workflows

4. **Documentation**
   - Update API docs
   - Create user guides for new features

---

## Questions?

Refer to:
- `ADVANCED_FEATURES_GUIDE.md` - Feature implementation details
- `database/migration_003_add_features.sql` - Migration SQL code
- `backend/src/types.ts` - Type definitions for new features

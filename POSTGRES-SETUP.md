# PostgreSQL Setup Guide for GeoWaste Kilifi

## Problem

You're getting PostgreSQL authentication errors:
```
FATAL:  password authentication failed for user "postgres"
```

This usually means either:
1. PostgreSQL was never properly initialized
2. The postgres user password was never set
3. There's a configuration issue

## Solution

### Option 1: Using the Setup Scripts (RECOMMENDED - Windows)

1. **Open PowerShell as Administrator**
   - Right-click PowerShell → "Run as administrator"
   - Navigate to GeoWaste Kilifi folder:
   ```powershell
   cd "C:\Users\koder\Desktop\GeoWaste Kilifi"
   ```

2. **Run the database setup script:**
   ```powershell
   .\setup-db.ps1
   ```
   
   This will:
   - Stop PostgreSQL service
   - Backup existing database
   - Reinitialize the database cluster
   - Start PostgreSQL service
   - Create the geowaste_kilifi database

3. **Set a password for postgres user:**
   ```powershell
   psql -U postgres -h localhost
   ```
   
   Then at the `postgres=#` prompt:
   ```sql
   ALTER USER postgres WITH PASSWORD 'your_secure_password';
   \q
   ```

4. **Load the schema:**
   ```powershell
   .\load-schema.ps1
   ```

5. **Update backend/.env:**
   ```env
   DB_PASSWORD=your_secure_password
   ```

### Option 2: Manual Setup (Cross-platform)

1. **Stop PostgreSQL:**
   - Windows: Services → Stop postgresql-x64-18
   - macOS: `brew services stop postgresql@15`
   - Linux: `sudo systemctl stop postgresql`

2. **Backup existing data (if needed):**
   ```powershell
   # Windows
   Rename-Item -Path "C:\Program Files\PostgreSQL\18\data" -NewName "data-backup"
   ```

3. **Reinitialize database cluster:**
   ```powershell
   # Windows
   & "C:\Program Files\PostgreSQL\18\bin\initdb.exe" -D "C:\Program Files\PostgreSQL\18\data" -E UTF8 -U postgres
   ```

4. **Start PostgreSQL:**
   - Windows: Services → Start postgresql-x64-18
   - Or: `pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start`

5. **Create database and set password:**
   ```bash
   createdb -U postgres -h localhost geowaste_kilifi
   psql -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD 'your_password';"
   ```

6. **Enable PostGIS and load schema:**
   ```bash
   psql -U postgres -h localhost -d geowaste_kilifi -c "CREATE EXTENSION postgis;"
   psql -U postgres -h localhost -d geowaste_kilifi -f database/schema.sql
   ```

## Verify Setup

### Test PostgreSQL Connection
```bash
psql -U postgres -h localhost -c "SELECT version();"
```

Expected output:
```
PostgreSQL 18.x on x86_64-pc-windows-msvc...
```

### Test Database
```bash
psql -U postgres -h localhost -d geowaste_kilifi -c "\dt"
```

Expected: List of tables including `waste_sites`

### Test PostGIS
```bash
psql -U postgres -h localhost -d geowaste_kilifi -c "SELECT PostGIS_version();"
```

Expected: PostGIS version information

## Configure Backend

1. Update `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=geowaste_kilifi
   DB_USER=postgres
   DB_PASSWORD=your_password_you_set
   CORS_ORIGIN=http://localhost:3000
   ```

2. Save and restart backend:
   ```bash
   npm run dev:backend
   ```

## Troubleshooting

### Still getting "password authentication failed"

**Check the pg_hba.conf file:**
```powershell
# Open with Notepad
notepad "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
```

Look for these lines around line 120-130 and ensure they have the correct METHOD:
```
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Then restart PostgreSQL service.

### "Could not open file base/5/1249"

This indicates a corrupted database directory. Run the setup script above to reinitialize.

### Port 5432 already in use

Another PostgreSQL instance is running. Either:
- Stop the other instance
- Use a different port in `.env` and update connections accordingly

### Can't reset password

1. Edit `pg_hba.conf`: change `scram-sha-256` to `trust`
2. Restart PostgreSQL
3. Run: `psql -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD 'newpassword';"`
4. Change `pg_hba.conf` back to `scram-sha-256`
5. Restart PostgreSQL again

## Production Configuration

⚠️ **DO NOT USE** default password in production!

For production, set a strong password:
```sql
ALTER USER postgres WITH PASSWORD 'very_strong_random_password_here';
```

Also consider:
- Using separate database user for application (not postgres)
- Enable SSL connections (set `sslmode=require` in connection string)
- Regularly backup database
- Monitor connections and locks

## Next Steps

After successful setup:

1. Run the application:
   ```bash
   npm run dev
   ```

2. Test the API:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Open frontend:
   ```
   http://localhost:3000
   ```

---

See README.md for more information about the application.

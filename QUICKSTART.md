# 🚀 Quick Start Guide

Get GeoWaste Kilifi up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] PostgreSQL v12+ installed  
- [ ] PostGIS extension available
- [ ] 2GB RAM available
- [ ] Port 3000 & 5000 available

## Installation (5 Steps)

### 1. Setup PostgreSQL

```bash
# Create database and enable PostGIS
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE geowaste_kilifi;
\c geowaste_kilifi
CREATE EXTENSION postgis;
\q
```

### 2. Load Database Schema

```bash
cd database
psql -U postgres -d geowaste_kilifi -f schema.sql
cd ..
```

### 3. Configure Environment

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database password
cd ..
```

#### Frontend

```bash
cd frontend
cp .env.example .env
# Keep default values or adjust if needed
cd ..
```

### 4. Install Dependencies

```bash
npm run install:all
```

### 5. Start Application

```bash
npm run dev
```

## Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## First Steps

1. ✅ Dashboard loads
2. 📍 Click "Start New Survey"
3. 📍 Allow GPS access
4. 📝 Fill form sections
5. ✅ Submit survey
6. 🗺️ View on map

## Troubleshooting

**Database connection error?**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

**Port already in use?**
```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

**GPS permission denied?**
- Ensure site is on localhost or HTTPS
- Check browser location settings
- Try Firefox or Chrome

## Next Steps

→ See [README.md](./README.md) for complete documentation  
→ See [API Documentation](./README.md#-api-documentation) for API usage  
→ Check [Database Schema](./README.md#-database-schema) for data structure

---

**Questions?** Refer to the full README for detailed troubleshooting.

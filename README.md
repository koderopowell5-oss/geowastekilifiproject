# 🗑️ GeoWaste Kilifi MVP

A web-based geospatial data collection system for field data collection and analysis of solid waste disposal suitability in Kilifi Municipality.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Features](#features)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**GeoWaste Kilifi** is an MVP designed for geographic research on sustainable waste management practices in Kilifi Municipality. The system enables:

- **📍 Automatic GPS capture** of field locations
- **📝 Comprehensive digital questionnaire** with 9 sections
- **🗺️ Interactive mapping** of waste disposal sites
- **📊 Real-time data analysis** and visualization
- **💾 Spatial database** with PostGIS support

### Key Achievements

✅ Full-stack application (Frontend + Backend + Database)  
✅ Mobile-friendly field data collection form  
✅ Real-time map visualization with Leaflet  
✅ RESTful API with proper error handling  
✅ PostgreSQL with PostGIS spatial queries  
✅ TypeScript across entire stack  
✅ Production-ready project structure

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS | User interface & form handling |
| **Mapping** | Leaflet.js + React-Leaflet | Geospatial visualization |
| **Geolocation** | Browser Geolocation API | GPS auto-capture |
| **Backend** | Node.js + Express | REST API server |
| **Database** | PostgreSQL + PostGIS | Spatial data storage |
| **DevOps** | Docker-ready | Container deployment |

---

## 📁 Project Structure

```
GeoWaste Kilifi/
├── backend/                 # Node.js + Express server
│   ├── src/
│   │   ├── index.ts        # Main server entry point
│   │   ├── db.ts           # PostgreSQL connection pool
│   │   ├── routes.ts       # API route definitions
│   │   └── service.ts      # Business logic & queries
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                # React application
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── WasteSurveyForm.tsx  # Multi-section form
│   │   │   └── WasteMap.tsx         # Leaflet map
│   │   ├── services/
│   │   │   ├── wasteApi.ts         # API client
│   │   │   └── geolocation.ts      # GPS service
│   │   ├── App.tsx                  # Main app component
│   │   ├── index.tsx               # React entry point
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
├── database/
│   └── schema.sql          # PostgreSQL schema with PostGIS
├── types.ts                # Shared TypeScript interfaces
├── package.json            # Root package.json
└── README.md               # This file
```

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **npm** v7+ (comes with Node.js)
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/))
- **PostGIS** extension for PostgreSQL ([Installation Guide](https://postgis.net/install/))
- **Git** (optional, for version control)

### System Requirements

- 2GB RAM minimum
- 500MB free disk space
- Windows, macOS, or Linux

### Verify Installation

```bash
# Check Node.js
node --version
# Expected: v16.0.0 or higher

# Check npm
npm --version
# Expected: v7.0.0 or higher

# Check PostgreSQL
psql --version
# Expected: psql (PostgreSQL) 12 or higher
```

---

## 📦 Installation & Setup

### Step 1: Clone/Extract the Project

```bash
cd GeoWaste Kilifi
```

### Step 2: Setup PostgreSQL Database

#### On Windows

1. **Start PostgreSQL Server**
   - PostgreSQL should start automatically if installed
   - Verify: Open PowerShell and run:
   ```bash
   psql -U postgres
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE geowaste_kilifi;
   \c geowaste_kilifi
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

3. **Load Schema**
   ```bash
   psql -U postgres -d geowaste_kilifi -f database/schema.sql
   ```

#### On macOS/Linux

```bash
# Start PostgreSQL
sudo service postgresql start

# Connect to PostgreSQL
createdb -U postgres geowaste_kilifi
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Load schema
psql -U postgres -d geowaste_kilifi -f database/schema.sql
```

### Step 3: Configure Environment Variables

#### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geowaste_kilifi
DB_USER=postgres
DB_PASSWORD=your_postgres_password
CORS_ORIGIN=http://localhost:3000
```

#### Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_CENTER_LAT=-3.2869
REACT_APP_MAP_CENTER_LNG=39.6568
REACT_APP_MAP_ZOOM=13
```

### Step 4: Install Dependencies

#### Option A: Install All at Once

```bash
npm run install:all
```

#### Option B: Install Separately

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## 🚀 Running the Application

### Option 1: Run Both Frontend & Backend Together

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### Option 2: Run Separately

#### Terminal 1 - Backend

```bash
npm run dev:backend
# Or manually:
cd backend && npm run dev
```

#### Terminal 2 - Frontend

```bash
npm run dev:frontend
# Or manually:
cd frontend && npm start
```

### Verify Backend is Running

```bash
# In a new terminal, test API health
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

---

## 🔌 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### 1. Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Create Waste Site Record

```http
POST /waste
Content-Type: application/json

{
  "latitude": -3.2869,
  "longitude": 39.6568,
  "ward": "Tezo",
  "settlement_type": "Formal",
  "household_size": "4-6",
  "waste_types": ["Organic", "Plastics"],
  "waste_quantity": "3-5kg",
  "waste_separation": true,
  "disposal_method": "County collection",
  "distance_to_site": "100-500m",
  "collection_frequency": "Weekly",
  "road_access": "Good",
  "distance_to_road": "<50m",
  "waste_near_home": false,
  "distance_to_waste": ">200m",
  "impacts": [],
  "nearby_features": ["River/stream"],
  "recommended_distance": "500m-1km",
  "preferred_location": ["Far from settlements", "Away from water"],
  "distance_weight": 4,
  "water_weight": 5,
  "road_weight": 3,
  "slope_weight": 3,
  "landuse_weight": 2,
  "terrain": "Gentle slope",
  "flooding": "Occasionally",
  "policy_awareness": true,
  "support_new_site": "Yes",
  "preferred_management": "Composting",
  "challenges": "Poor road access",
  "suggested_location": "Near the industrial area"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Waste site record created successfully",
  "data": {
    "id": 1,
    "latitude": -3.2869,
    "longitude": 39.6568,
    ...
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 3. Get All Records

```http
GET /waste?limit=100&offset=0
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Waste sites retrieved successfully",
  "data": {
    "records": [...],
    "pagination": {
      "total": 150,
      "limit": 100,
      "offset": 0,
      "pages": 2
    }
  }
}
```

#### 4. Get Single Record

```http
GET /waste/:id
```

**Example:** `GET /waste/1`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Waste site record retrieved successfully",
  "data": { ... }
}
```

#### 5. Get Statistics

```http
GET /waste/stats/summary
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_records": 45,
    "total_wards": 2,
    "distinct_settlement_types": 3
  }
}
```

#### 6. Get Sites by Geographic Bounds

```http
GET /waste/bounds/:minLat/:maxLat/:minLng/:maxLng
```

**Example:** `GET /waste/bounds/-3.3/-3.2/39.5/39.7`

---

## 🗄️ Database Schema

### Main Table: `waste_sites`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Unique record identifier |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude |
| `geom` | GEOMETRY(POINT, 4326) | NOT NULL | PostGIS geometry |
| `ward` | VARCHAR(50) | NOT NULL | Administrative unit |
| `settlement_type` | VARCHAR(50) | NOT NULL | Formal/Informal/Peri-urban |
| `household_size` | VARCHAR(10) | NOT NULL | 1-3 / 4-6 / 7+ |
| `waste_types` | TEXT[] | DEFAULT '{}' | Array of waste categories |
| `waste_quantity` | VARCHAR(20) | NOT NULL | <1kg / 1-3kg / 3-5kg / >5kg |
| `waste_separation` | BOOLEAN | NOT NULL | Yes/No |
| ... (additional fields) | ... | ... | ... |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

### Indexes

- `idx_waste_sites_geom` - Spatial index on geom column
- `idx_waste_sites_created_at` - Temporal index
- `idx_waste_sites_ward` - Ward lookup index

### Views

- `waste_sites_summary` - Statistics view with aggregate functions

---

## ✨ Features

### Frontend

#### Dashboard
- 📊 Real-time statistics (total records, wards covered, settlement types)
- 🎯 Quick action buttons (Start Survey, View Map)
- ℹ️ Project information section

#### Survey Form
- 📍 **Section A**: Automatic GPS capture + household info
- 🗑️ **Section B**: Waste generation details
- ♻️ **Section C**: Disposal practices
- 🛣️ **Section D**: Accessibility assessment
- ⚠️ **Section E**: Environmental risks
- 🎯 **Section F**: Suitability perception (with weights 1-5)
- 🏔️ **Section G**: Topography
- 👥 **Section H**: Community & policy awareness
- 📝 **Section I**: Open-ended feedback
- ✅ Form validation and error handling
- 📱 Mobile-first responsive design
- ⏳ Loading states and disabled states

#### Map Visualization
- 🗺️ Interactive Leaflet map
- 📍 Markers for each waste site
- 💬 Popup details on marker click
- 🏗️ Site details panel with full record information
- 📊 Statistics overlay

### Backend

- ✅ RESTful API with proper HTTP status codes
- 🔒 Input validation
- 📊 Error handling and logging
- 📈 Pagination support
- 🔍 Spatial queries
- 📍 Geographic bounds filtering
- 🚀 Optimized queries with indexes

### Database

- 🗺️ PostGIS spatial support
- 📈 Automatic timestamp tracking
- 🔍 Optimized indexes for performance
- 📊 Statistical views
- 🔄 Update triggers

---

## 📱 Usage Guide

### Starting a New Survey

1. Click **"Start New Survey"** on the dashboard
2. Allow GPS permission when prompted
3. Review auto-captured coordinates
4. Fill in each section sequentially
5. Use **Next/Previous** buttons to navigate
6. Submit completed survey

### Viewing the Map

1. Click **"View Map"** on the dashboard
2. Map loads with all collected sites
3. Click markers to see site details
4. View full record in detail panel
5. Navigate back to dashboard

### Understanding the Data

- **Survey Form**: All fields required except open-ended text
- **Weights (1-5)**: Higher = more important for suitability
- **Multi-select**: Hold Ctrl/Cmd to select multiple options
- **GPS**: Requires location permissions, <10 meters accuracy

---

## 🐛 Troubleshooting

### Issue: "Failed to get location"

**Solution:**
1. Ensure HTTPS or localhost (required for Geolocation API)
2. Check browser location permissions
3. Try a different browser
4. Verify GPS is enabled on device

### Issue: "Cannot connect to backend"

**Solution:**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check if port 5000 is in use
# Windows:
netstat -ano | findstr :5000

# Kill process on Windows:
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### Issue: "Database connection error"

**Solution:**
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -l | grep geowaste_kilifi

# Verify credentials in .env file
```

### Issue: "PostGIS extension not found"

**Solution:**
```bash
# Create PostGIS extension
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION postgis;"

# Verify
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"
```

### Issue: Port already in use

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📊 Data Export & Analysis

To export collected data for analysis:

```sql
-- Export all records as CSV
\COPY (SELECT * FROM waste_sites) TO 'export.csv' WITH CSV HEADER;

-- Get aggregated statistics by ward
SELECT ward, COUNT(*) as count, AVG(household_size::integer) as avg_size
FROM waste_sites
GROUP BY ward;

-- Find sites near water features
SELECT * FROM waste_sites 
WHERE 'River/stream' = ANY(nearby_features)
  OR 'Wetland' = ANY(nearby_features);
```

---

## 🔄 Database Backup & Restore

### Backup

```bash
# Windows
pg_dump -U postgres geowaste_kilifi > backup.sql

# macOS/Linux
pg_dump -U postgres geowaste_kilifi > backup.sql
```

### Restore

```bash
psql -U postgres geowaste_kilifi < backup.sql
```

---

## 🚀 Production Deployment

### Build for Production

```bash
npm run build:all

# Or separately:
npm run build:backend
npm run build:frontend
```

### Frontend Deployment

1. Frontend build is in `frontend/build/`
2. Deploy to Netlify, Vercel, or any static host
3. Update API URL in environment variables

### Backend Deployment

1. Deploy Node.js app to services like Heroku, Railway, or DigitalOcean
2. Ensure PostgreSQL instance is accessible
3. Set production environment variables
4. Run database migrations

---

## 📝 License

MIT License © 2024 GeoWaste Team

---

## 🤝 Contributing

To contribute:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📞 Support

For issues or questions:

1. Check the Troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Contact the development team

---

## 🎓 Academic Context

This system was developed as an MVP for a **BSc Geography project** focused on:

- Field data collection techniques
- Geospatial Information Systems (GIS)
- Waste disposal site suitability analysis
- Environmental assessment methodologies

The system reflects real-world geospatial data collection practices and can be extended with advanced spatial analysis features.

---

**Last Updated:** January 2024  
**Version:** 1.0.0 (MVP)  
**Status:** ✅ Production Ready
#   g e o w a s t e k i l i f  
 
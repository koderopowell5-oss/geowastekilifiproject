# 🗺️ GeoWaste Kilifi MVP

> A web-based geospatial data collection system for field research and analysis of solid waste disposal suitability in Kilifi Municipality.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

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
- [Data Export & Analysis](#data-export--analysis)
- [Database Backup & Restore](#database-backup--restore)
- [Production Deployment](#production-deployment)
- [Academic Context](#academic-context)

---

## Overview

**GeoWaste Kilifi** is a comprehensive MVP designed for geographic research on sustainable waste management practices in Kilifi Municipality. It integrates modern geospatial technologies with field data collection methodologies to enable evidence-based analysis of waste disposal site suitability.

### ✨ System Capabilities

| Capability | Description |
|---|---|
| 📍 **GPS Capture** | Automatic high-precision coordinate capture |
| 📝 **Digital Questionnaire** | 9-section survey covering household waste management |
| 🗺️ **Interactive Mapping** | Spatial analysis and visualization of disposal sites |
| 📊 **Real-time Analytics** | Live data analysis and statistical visualization |
| 🔐 **Role-based Access** | Enumerator and Administrator roles |
| 📶 **Offline Support** | Data caching for low-connectivity areas |

### 🏆 Key Achievements

- Full-stack application (React + Express + PostgreSQL/PostGIS)
- Mobile-friendly, responsive design for field use
- RESTful API with comprehensive validation and error handling
- Complete TypeScript implementation across all layers
- Docker containerization support
- Authentication and authorization mechanisms

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI components & form handling |
| TypeScript | 5+ | Type-safe development |
| Tailwind CSS | 3.x | Responsive design system |
| Leaflet.js | 1.9+ | Geospatial visualization |
| Vite | Latest | Build tooling |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 16+ | Server runtime |
| Express.js | 4.x | REST API server |
| TypeScript | 5+ | Type-safe backend logic |

### Database
| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | 12+ | Data persistence |
| PostGIS | 3.x+ | Spatial queries & indexing |

### DevOps
| Technology | Purpose |
|---|---|
| Docker & Docker Compose | Containerization & orchestration |
| Render / Railway | Cloud deployment |

---

## Project Structure

```
GeoWaste Kilifi/
├── backend/                          # Node.js + Express REST API
│   └── src/
│       ├── index.ts                  # App entry point
│       ├── db.ts                     # DB connection pooling
│       ├── routes.ts                 # API route definitions
│       ├── service.ts                # Business logic & spatial ops
│       ├── types.ts                  # TypeScript interfaces
│       └── authService.ts            # Authentication logic
│
├── frontend/                         # React TypeScript app
│   └── src/
│       ├── components/
│       │   ├── Dashboard.tsx         # Main dashboard
│       │   ├── AdminDashboard.tsx    # Admin panel
│       │   ├── WasteSurveyForm.tsx   # 9-section survey form
│       │   ├── WasteMap.tsx          # Leaflet map
│       │   └── ...
│       ├── context/
│       │   ├── AuthContext.tsx       # Auth state
│       │   └── NotificationContext.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── AdminLoginPage.tsx
│       │   └── SignupPage.tsx
│       └── services/
│           ├── wasteApi.ts           # API client
│           ├── geolocation.ts        # GPS service
│           └── offlineService.ts     # Offline cache
│
├── database/
│   ├── schema.sql                    # Full PostGIS schema
│   ├── schema-no-postgis.sql         # Schema without spatial features
│   └── *.sql                         # Migrations & setup scripts
│
├── types.ts                          # Shared frontend/backend types
├── docker-compose.yml
│
├── Documentation/
│   ├── QUICKSTART.md
│   ├── PROJECT-OVERVIEW.md
│   ├── API-TESTING.md
│   ├── DEPLOYMENT.md
│   └── POSTGRES-SETUP.md
│
└── Scripts/
    ├── setup-db.ps1
    ├── install-postgis.ps1
    └── fix-permissions.ps1
```

---

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|---|---|---|
| Node.js | v16+ (LTS recommended) | [nodejs.org](https://nodejs.org/) |
| npm | v7+ | Bundled with Node.js |
| PostgreSQL | 12+ | [postgresql.org](https://www.postgresql.org/download/) |
| PostGIS | 3.x+ | [postgis.net](https://postgis.net/install/) |
| Git | Any | [git-scm.com](https://git-scm.com/) *(optional)* |

### System Requirements

- 2 GB RAM minimum
- 500 MB free disk space
- Windows, macOS, or Linux
- Modern browser (Chrome, Firefox, Safari, Edge)

### Verify Your Installation

```bash
node --version    # Expected: v16.0.0 or higher
npm --version     # Expected: v7.0.0 or higher
psql --version    # Expected: psql (PostgreSQL) 12 or higher
```

---

## Installation & Setup

### Step 1 — Clone or Extract the Project

```bash
git clone <repository-url> GeoWaste-Kilifi
cd GeoWaste-Kilifi
```

### Step 2 — Set Up PostgreSQL Database

<details>
<summary><b>🪟 Windows</b></summary>

```powershell
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

```sql
-- In the PostgreSQL prompt
CREATE DATABASE geowaste_kilifi;
\c geowaste_kilifi
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_version();
```

```powershell
# Load the schema
psql -U postgres -d geowaste_kilifi -f database\schema.sql
```

</details>

<details>
<summary><b>🍎 macOS / 🐧 Linux</b></summary>

```bash
# Start PostgreSQL
brew services start postgresql       # macOS
sudo service postgresql start        # Linux

# Create database and enable PostGIS
createdb -U postgres geowaste_kilifi
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Load schema
psql -U postgres -d geowaste_kilifi -f database/schema.sql
```

</details>

### Step 3 — Configure Environment Variables

#### Backend (`backend/.env`)

```bash
cd backend && cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=geowaste_kilifi
DB_USER=postgres
DB_PASSWORD=your_postgres_password

CORS_ORIGIN=http://localhost:3000

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```

#### Frontend (`frontend/.env`)

```bash
cd frontend && cp .env.example .env
```

```env
REACT_APP_API_URL=http://localhost:5000/api

# Map center: Kilifi Municipality
REACT_APP_MAP_CENTER_LAT=-3.2869
REACT_APP_MAP_CENTER_LNG=39.6568
REACT_APP_MAP_ZOOM=13

REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true
```

### Step 4 — Install Dependencies

```bash
# Install all at once (recommended)
npm run install:all

# Or separately
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

> **Note:** First install may take 2–5 minutes depending on your connection.

---

## Running the Application

### Option 1 — Run Both Together *(Recommended)*

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

### Option 2 — Run Separately

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

### Verify the Backend

```bash
curl http://localhost:5000/api/health
```

```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## API Documentation

**Base URL:** `http://localhost:5000/api`

All responses follow this structure:

```json
{
  "success": true,
  "message": "Response message",
  "data": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/waste` | Get all records *(pagination supported)* |
| `POST` | `/api/waste` | Create new waste site record |
| `GET` | `/api/waste/:id` | Get single record |
| `GET` | `/api/waste/stats/summary` | Aggregate statistics |
| `GET` | `/api/waste/bounds/:minLat/:maxLat/:minLng/:maxLng` | Spatial query by bounding box |

<details>
<summary><b>POST /api/waste — Example Request Body</b></summary>

```json
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
  "distance_weight": 4,
  "water_weight": 5,
  "road_weight": 3,
  "slope_weight": 3,
  "landuse_weight": 2
}
```

</details>

For full API docs, see [`Documentation/API-TESTING.md`](Documentation/API-TESTING.md).

---

## Database Schema

### Primary Table: `waste_sites`

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing record ID |
| `latitude` | `DECIMAL(10,8)` | GPS latitude |
| `longitude` | `DECIMAL(11,8)` | GPS longitude |
| `geom` | `GEOMETRY(POINT, 4326)` | PostGIS spatial point (WGS84) |
| `ward` | `VARCHAR(50)` | Administrative ward |
| `settlement_type` | `VARCHAR(50)` | Formal / Informal / Peri-urban |
| `household_size` | `VARCHAR(10)` | 1-3 / 4-6 / 7+ |
| `waste_types` | `TEXT[]` | Array of waste categories |
| `waste_quantity` | `VARCHAR(20)` | Daily generation range |
| `distance_weight` – `landuse_weight` | `INTEGER (1–5)` | Suitability weighting factors |
| `created_at` | `TIMESTAMP` | Record creation time |
| `updated_at` | `TIMESTAMP` | Last update time |

### Indexes

| Index | Type | Column | Purpose |
|---|---|---|---|
| `idx_waste_sites_geom` | GIST | `geom` | Spatial queries |
| `idx_waste_sites_created_at` | BTREE | `created_at` | Temporal sorting |
| `idx_waste_sites_ward` | BTREE | `ward` | Ward filtering |
| `idx_waste_sites_settlement` | BTREE | `settlement_type` | Settlement filtering |

### Spatial Query Examples

```sql
-- Sites within 1 km radius
SELECT * FROM waste_sites
WHERE ST_Distance(geom, ST_GeomFromText('POINT(-3.2869 39.6568)', 4326)) < 1000;

-- Sites within a bounding box
SELECT * FROM waste_sites
WHERE geom && ST_MakeEnvelope(-3.3, 39.5, -3.2, 39.7, 4326);
```

---

## Features

### 📋 Survey Form — 9 Sections

| Section | Topics |
|---|---|
| A | Location & household demographics (auto GPS) |
| B | Waste generation types and quantities |
| C | Current disposal practices and frequency |
| D | Road accessibility assessments |
| E | Environmental risk identification |
| F | Suitability perception (weighted 1–5) |
| G | Topography and flood risk |
| H | Community & policy awareness |
| I | Open-ended qualitative feedback |

### 🗺️ Map Features

- Interactive Leaflet map centred on Kilifi Municipality
- Marker clustering for dense data areas
- Click-to-expand site detail panel
- Multiple basemap options (satellite, terrain)

### ⚙️ Backend & Database

- Pagination for large datasets
- PostGIS spatial querying and bounding box filtering
- Input validation & SQL injection prevention
- CORS configuration, JWT authentication
- Connection pooling and optimised indexes

---

## Usage Guide

### Starting a New Survey

1. Navigate to `http://localhost:3000`
2. Click **"Start New Survey"**
3. Allow GPS permission when prompted
4. Review auto-captured coordinates
5. Complete all 9 sections (use **Next / Previous** to navigate)
6. Submit — a confirmation message will appear on success

### Viewing the Map

1. Click **"View Map"** on the dashboard
2. The map loads with all collected sites as markers
3. Click a marker to see a popup with site details
4. Expand the detail panel for the full survey record

### Understanding Suitability Weights

Weights use a **1–5 scale** across five factors:

| Weight | Factor |
|---|---|
| `distance_weight` | Proximity to settlements |
| `water_weight` | Proximity to water bodies |
| `road_weight` | Road accessibility |
| `slope_weight` | Terrain slope |
| `landuse_weight` | Land use compatibility |

`1` = Not important · `3` = Moderately important · `5` = Critical

---

## Troubleshooting

<details>
<summary><b>❌ Cannot Get Location</b></summary>

- Ensure the app is running on `localhost` or `https://` (browser requires a secure context)
- Check browser location permissions: **Settings → Privacy → Site Settings → Location**
- Enable GPS on the device
- Try a different browser

</details>

<details>
<summary><b>❌ Cannot Connect to Backend</b></summary>

```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check if port 5000 is in use
lsof -i :5000          # macOS/Linux
netstat -ano | findstr :5000   # Windows

# Restart the backend
cd backend && npm run dev
```

</details>

<details>
<summary><b>❌ Database Connection Error</b></summary>

```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -l | grep geowaste_kilifi

# Verify PostGIS is installed
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Install PostGIS if missing
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

</details>

<details>
<summary><b>❌ Port Already in Use</b></summary>

```bash
# macOS/Linux
kill -9 $(lsof -ti :5000)
kill -9 $(lsof -ti :3000)

# Windows
taskkill /PID $(netstat -ano | findstr :5000 | awk '{print $5}') /F
```

Or start on a different port:

```bash
PORT=5001 npm run dev        # backend
PORT=3001 npm start          # frontend
```

</details>

<details>
<summary><b>❌ npm install Fails</b></summary>

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

</details>

---

## Data Export & Analysis

```sql
-- Export all records as CSV
\COPY (SELECT * FROM waste_sites) TO 'export.csv' WITH CSV HEADER;

-- Statistics by ward
SELECT ward, COUNT(*) AS total_sites
FROM waste_sites
GROUP BY ward
ORDER BY total_sites DESC;

-- Sites near water features
SELECT * FROM waste_sites
WHERE 'River/stream' = ANY(nearby_features)
   OR 'Wetland' = ANY(nearby_features);
```

---

## Database Backup & Restore

```bash
# Backup
pg_dump -U postgres geowaste_kilifi > backup.sql

# Restore
psql -U postgres geowaste_kilifi < backup.sql
```

---

## Production Deployment

### Build

```bash
npm run build:all
```

### Frontend

Deploy the contents of `frontend/build/` to **Netlify**, **Vercel**, or any static host. Update `REACT_APP_API_URL` in environment settings.

### Backend

Deploy the Node.js app to **Render**, **Railway**, or **DigitalOcean**. Ensure PostgreSQL with PostGIS is accessible and set all required environment variables.

For detailed instructions, see [`Documentation/DEPLOYMENT.md`](Documentation/DEPLOYMENT.md).

---

## Academic Context

This system was developed as an MVP for a **BSc Geography** research project focused on:

- Geospatial data collection methodologies
- Geographic Information Systems (GIS) development
- Waste disposal site suitability analysis
- Environmental assessment and sustainable waste management
- Real-world field research techniques

The platform demonstrates practical applications of modern geospatial technologies and can be extended with advanced spatial analysis features.

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Commit with descriptive messages
3. Run linting and tests
4. Open a pull request

---

## License

[MIT License](LICENSE) © 2024 GeoWaste Team

---

## Support

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [`Documentation/PROJECT-OVERVIEW.md`](Documentation/PROJECT-OVERVIEW.md)
3. Open browser DevTools (`F12`) and check the Console and Network tabs
4. Submit a [GitHub Issue](https://github.com/koderopowell5-oss/geowastekilifiproject/issues) for bugs

---

*Last updated: January 2024 · Version 1.0.0 · Status: Production Ready*

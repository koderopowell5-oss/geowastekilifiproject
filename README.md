# GeoWaste Kilifi MVP

A web-based geospatial data collection system for field data collection and analysis of solid waste disposal suitability in Kilifi Municipality.

## Table of Contents

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
- [License](#license)
- [Contributing](#contributing)
- [Support](#support)
- [Academic Context](#academic-context)

---

## Overview

**GeoWaste Kilifi** is a comprehensive MVP designed for geographic research on sustainable waste management practices in Kilifi Municipality. This system integrates modern geospatial technologies with field data collection methodologies to enable evidence-based analysis of waste disposal site suitability.

### System Capabilities

The platform enables researchers and field enumerators to:

- **Automatic GPS capture** of field locations with high-precision coordinates
- **Comprehensive digital questionnaire** with 9 specialized sections covering household waste management
- **Interactive mapping** of waste disposal sites with spatial analysis capabilities
- **Real-time data analysis** and statistical visualization
- **Spatial database** with advanced PostGIS support for geographic queries
- **Multiple user roles** (Enumerators, Administrators) with role-based access control
- **Offline data caching** for data collection in areas with limited connectivity

### Key Achievements

- Full-stack application architecture (Frontend + Backend + Database)
- Mobile-friendly responsive design optimized for field data collection
- Real-time map visualization with Leaflet and interactive markers
- RESTful API with comprehensive error handling and validation
- PostgreSQL with PostGIS spatial indexing and efficient geographic queries
- Complete TypeScript implementation across frontend, backend, and shared types
- Production-ready project structure with Docker containerization support
- Notification system for real-time user feedback
- Authentication and authorization mechanisms for secure data access

---

## Tech Stack

The system is built on a modern, scalable technology foundation optimized for geospatial applications:

### Frontend Layer

- **React 18** - Modern JavaScript library for building interactive user interfaces
- **TypeScript** - Static typing for enhanced code quality and developer experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Leaflet.js + React-Leaflet** - Industry-standard geospatial mapping libraries
- **Vite** - Next-generation frontend build tool for fast development and optimal production builds

### Backend Layer

- **Node.js** - JavaScript runtime for server-side execution
- **Express.js** - Lightweight web framework for building REST APIs
- **TypeScript** - Ensures type safety and reduces runtime errors in backend logic

### Geolocation & Mapping

- **Browser Geolocation API** - Native GPS capture with fallback to network-based positioning
- **Leaflet.js** - Lightweight mapping library with extensive plugin support
- **OpenStreetMap** - Free, open-source map tiles for visualization

### Database Layer

- **PostgreSQL 12+** - Enterprise-grade relational database system
- **PostGIS Extension** - Spatial database extension for geographic queries and indexing
- **Connection Pooling** - Efficient database connection management

### DevOps & Deployment

- **Docker** - Containerization for consistent deployment across environments
- **Docker Compose** - Multi-container orchestration for development
- **Render/Railway** - Cloud deployment platforms for production hosting

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 18+ | User interface & form handling |
| Frontend Language | TypeScript | 5+ | Type-safe component development |
| Frontend Styling | Tailwind CSS | 3.x | Responsive design system |
| Mapping | Leaflet.js | 1.9+ | Geospatial visualization |
| Location Services | Browser API | Native | GPS auto-capture |
| Backend Runtime | Node.js | 16+ | Server execution environment |
| Backend Framework | Express.js | 4.x | REST API server |
| Database | PostgreSQL | 12+ | Data persistence |
| Spatial Extension | PostGIS | 3.x+ | Geographic queries |
| Containerization | Docker | Latest | Application packaging |

---

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
GeoWaste Kilifi/
├── backend/                          # Node.js + Express REST API server
│   ├── src/
│   │   ├── index.ts                 # Application entry point and server initialization
│   │   ├── db.ts                    # PostgreSQL connection pooling and configuration
│   │   ├── routes.ts                # API route definitions and endpoint mapping
│   │   ├── service.ts               # Business logic, database queries, and spatial operations
│   │   ├── types.ts                 # TypeScript interface definitions
│   │   ├── authService.ts           # Authentication and authorization logic
│   │   └── [other services]         # Additional business logic modules
│   ├── dist/                        # Compiled JavaScript output
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── Dockerfile                   # Docker containerization
│   └── .eslintrc                    # Linting rules
│
├── frontend/                         # React TypeScript application
│   ├── public/
│   │   ├── index.html               # Main HTML entry point
│   │   ├── assets/                  # Static images and resources
│   │   └── images/                  # Application icons and logos
│   ├── src/
│   │   ├── App.tsx                  # Root component
│   │   ├── index.tsx                # React entry point
│   │   ├── index.css                # Global styles
│   │   ├── App.css                  # App-specific styles
│   │   ├── components/              # Reusable React components
│   │   │   ├── Dashboard.tsx        # Main dashboard view
│   │   │   ├── AdminDashboard.tsx   # Admin panel
│   │   │   ├── WasteSurveyForm.tsx  # Multi-section survey form
│   │   │   ├── WasteMap.tsx         # Leaflet map visualization
│   │   │   ├── CollectionsPage.tsx  # Data collections view
│   │   │   ├── EnumeratorsPage.tsx  # Enumerator management
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── FloatingTabBar.tsx   # Mobile tab navigation
│   │   │   ├── Toast.tsx            # Toast notifications
│   │   │   ├── Notifications/       # Notification components
│   │   │   └── [other components]
│   │   ├── context/                 # React Context for state management
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── NotificationContext.tsx # Notification state
│   │   ├── pages/                   # Page-level components (routes)
│   │   │   ├── LoginPage.tsx        # User login
│   │   │   ├── AdminLoginPage.tsx   # Admin login
│   │   │   ├── SignupPage.tsx       # User registration
│   │   │   └── Auth.tsx             # Auth routing
│   │   ├── services/                # API communication and utilities
│   │   │   ├── wasteApi.ts          # Backend API client
│   │   │   ├── geolocation.ts       # GPS positioning service
│   │   │   └── offlineService.ts    # Local cache management
│   │   └── utils/                   # Utility functions
│   ├── build/                       # Production build output
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── nginx.conf                   # Nginx web server config
│   ├── Dockerfile                   # Docker containerization
│   └── [config files]
│
├── database/                         # Database initialization and migrations
│   ├── schema.sql                   # Complete PostgreSQL schema with PostGIS
│   ├── schema-no-postgis.sql        # Alternative schema without spatial features
│   ├── migration_001_add_enumerator_email.sql # Database migration
│   ├── add-drafts.sql               # Draft records table setup
│   ├── fix-geom-column.sql          # Geometry column fixes
│   └── setup-render.sql             # Production setup script
│
├── types.ts                          # Shared TypeScript interfaces (frontend + backend)
├── types.js                          # JavaScript type definitions
├── types.d.ts                        # TypeScript declarations
├── package.json                      # Root package configuration
├── docker-compose.yml               # Multi-container orchestration
├── .env.example                      # Environment variables example
│
├── Documentation/
│   ├── README.md                    # This file
│   ├── QUICKSTART.md                # Quick start guide
│   ├── PROJECT-OVERVIEW.md          # Comprehensive project documentation
│   ├── API-TESTING.md               # API testing procedures
│   ├── DEPLOYMENT.md                # Deployment instructions
│   ├── POSTGRES-SETUP.md            # Database setup guide
│   ├── LOGIN_PORTAL_GUIDE.md        # Authentication guide
│   ├── FILE-MANIFEST.md             # File inventory and descriptions
│   └── [other guides]
│
└── Scripts/
    ├── setup-db.ps1                 # Windows database setup script
    ├── setup-db-simple.ps1          # Simplified setup script
    ├── setup-clean.ps1              # Clean installation script
    ├── install-postgis.ps1          # PostGIS installation
    ├── load-schema.ps1              # Schema loading script
    └── fix-permissions.ps1          # Permission fixes script
```

### Key Directory Descriptions

- **backend/src/** - Core server logic, API routes, database services, and authentication
- **frontend/src/components/** - Reusable UI components following React best practices
- **frontend/src/services/** - External API communication and geolocation services
- **database/** - SQL schemas, migrations, and database initialization scripts
- **types.ts** - Shared TypeScript interfaces ensuring type consistency across the stack

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js** v16 or higher (LTS recommended) - [Download](https://nodejs.org/)
- **npm** v7 or higher (typically bundled with Node.js)
- **PostgreSQL** 12 or higher - [Download](https://www.postgresql.org/download/)
- **PostGIS Extension** 3.x+ for spatial database support - [Installation Guide](https://postgis.net/install/)
- **Git** (optional but recommended for version control) - [Download](https://git-scm.com/)

### System Requirements

- Minimum 2GB RAM for development
- Minimum 500MB free disk space
- Windows, macOS, or Linux operating system
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Verify Installation

Run these commands to verify all prerequisites are correctly installed:

```bash
# Check Node.js version (should be 16+)
node --version
# Example output: v18.12.0

# Check npm version (should be 7+)
npm --version
# Example output: 9.2.0

# Check PostgreSQL version (should be 12+)
psql --version
# Example output: psql (PostgreSQL) 14.5 on x86_64-pc-linux-gnu

# Check Git (optional)
git --version
# Example output: git version 2.38.0
```

If any command returns an error or version number is lower than required, please install or upgrade the software.

---

## Installation & Setup

### Step 1: Clone or Extract the Project

```bash
# Navigate to your projects directory
cd your-projects-folder

# Clone the repository (if using Git)
git clone <repository-url> GeoWaste-Kilifi
cd GeoWaste-Kilifi

# Or, if you have the project as a ZIP file
# Extract it and navigate to the directory
cd GeoWaste-Kilifi
```

### Step 2: Setup PostgreSQL Database

The database setup process varies based on your operating system.

#### Database Setup - Windows

1. **Verify PostgreSQL is Running**
   - PostgreSQL service should start automatically after installation
   - Open PowerShell as Administrator and verify:
   
   ```powershell
   psql -U postgres -c "SELECT version();"
   ```
   
   If you're prompted for a password, enter the PostgreSQL password you set during installation.

2. **Create the GeoWaste Database**
   
   ```sql
   -- Open PostgreSQL command prompt
   psql -U postgres
   
   -- Create the database
   CREATE DATABASE geowaste_kilifi;
   
   -- Connect to the new database
   \c geowaste_kilifi
   
   -- Enable PostGIS extension
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   -- Verify PostGIS installation
   SELECT PostGIS_version();
   ```

3. **Load the Database Schema**
   
   ```powershell
   # Exit PostgreSQL first (type \q)
   psql -U postgres -d geowaste_kilifi -f database\schema.sql
   ```

#### Database Setup - macOS/Linux

```bash
# Start PostgreSQL service (macOS)
brew services start postgresql

# Start PostgreSQL service (Linux)
sudo service postgresql start

# Create the database
createdb -U postgres geowaste_kilifi

# Enable PostGIS extension
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify PostGIS
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Load the schema
psql -U postgres -d geowaste_kilifi -f database/schema.sql

# Verify schema loaded successfully
psql -U postgres -d geowaste_kilifi -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

### Step 3: Configure Environment Variables

Create `.env` files for both backend and frontend with the necessary configuration.

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geowaste_kilifi
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# CORS Configuration (for frontend communication)
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (if using authentication)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# Logging Configuration
LOG_LEVEL=debug

# API Configuration
API_TIMEOUT=30000
MAX_REQUEST_SIZE=50mb
```

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your settings:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Map Configuration (Kilifi Municipality center)
REACT_APP_MAP_CENTER_LAT=-3.2869
REACT_APP_MAP_CENTER_LNG=39.6568
REACT_APP_MAP_ZOOM=13
REACT_APP_MAP_MIN_ZOOM=8
REACT_APP_MAP_MAX_ZOOM=18

# Feature Toggles
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true

# Application Name
REACT_APP_NAME=GeoWaste Kilifi
REACT_APP_VERSION=1.0.0
```

### Step 4: Install Dependencies

Choose one of the following installation methods:

#### Option A: Install All Dependencies (Recommended)

```bash
# From the project root directory
npm run install:all
```

This command installs dependencies for both backend and frontend in one step.

#### Option B: Install Separately

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 5: Verify Installation

```bash
# Check that all dependencies are installed correctly
npm list react
npm list express

# Test database connection
npm run db:test  # if this script exists
```

---

## Running the Application

### Option 1: Run Both Frontend & Backend Together (Recommended)

```bash
# From the project root directory
npm run dev
```

This command starts both services concurrently:
- **Backend API Server** will run on http://localhost:5000
- **Frontend React App** will run on http://localhost:3000

### Option 2: Run Separately

#### Terminal 1 - Backend API Server

```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend Application

```bash
cd frontend
npm start
```

### Verify the Application

- Backend is running: `curl http://localhost:5000/api/health`
- Frontend is running: Open http://localhost:3000 in your browser

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Response Format

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Key Endpoints

**Health Check** - GET /api/health
**Get All Records** - GET /api/waste?limit=100&offset=0
**Create Record** - POST /api/waste
**Get Record** - GET /api/waste/:id
**Get Statistics** - GET /api/waste/stats/summary
**Geographic Query** - GET /api/waste/bounds/:minLat/:maxLat/:minLng/:maxLng

For complete API documentation, see API-TESTING.md

---

## Database Schema

### Main Table: waste_sites

Stores all waste site survey data with spatial coordinates.

Key columns:
- `id` - Record identifier
- `latitude`, `longitude` - GPS coordinates
- `geom` - PostGIS geometry point
- `ward` - Administrative unit
- `settlement_type` - Settlement classification
- `waste_types` - Categories of waste
- `distance_weight` through `landuse_weight` - Suitability factors (1-5)
- `created_at`, `updated_at` - Timestamps

### Indexes

- Spatial index on `geom` for geographic queries
- Temporal index on `created_at`
- Lookup indexes on `ward` and `settlement_type`

For detailed schema information, see PROJECT-OVERVIEW.md

---

## Features

### Frontend

- Real-time dashboard with statistics
- 9-section waste management survey
- Interactive Leaflet map with site markers
- Mobile-responsive design
- Authentication (login/signup)
- Real-time notifications

### Backend

- RESTful API with proper HTTP status codes
- Input validation and error handling
- Spatial queries with PostGIS
- Pagination support
- Authentication and authorization
- Comprehensive logging

### Database

- PostGIS spatial support
- Automatic timestamp tracking
- Optimized indexes
- Statistical views
- Transaction support

---

## Usage Guide

### Starting a New Survey

1. Navigate to http://localhost:3000
2. Click "Start New Survey"
3. Allow GPS access
4. Fill the 9-section form
5. Submit data

### Viewing the Map

1. Click "View Map" on dashboard
2. Interactive map loads with all sites
3. Click markers to see details
4. Zoom and pan to explore

### Accessing Data

Use the API endpoints to retrieve collected data or export as CSV.

---

## Troubleshooting

### Cannot Get Location
- Ensure HTTPS or localhost
- Check browser location permissions
- Enable GPS on device
- Verify internet connectivity

### Cannot Connect to Backend
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check port 5000 is not in use
- Verify .env has correct API_URL

### Database Connection Error
- Verify PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Verify credentials in .env
- Create PostGIS extension if missing

### Port Already in Use
- Find process: `netstat -ano | findstr :5000` (Windows)
- Kill process: `taskkill /PID <PID> /F`
- Or run on different port: `PORT=5001 npm run dev`

### npm Install Fails
- Clear cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

For more detailed troubleshooting, see the full Troubleshooting section in extended documentation.

---

## Data Export & Analysis

### Export as CSV

```sql
\COPY (SELECT * FROM waste_sites) TO 'export.csv' WITH CSV HEADER;
```

### Get Statistics by Ward

```sql
SELECT ward, COUNT(*) as total, AVG(household_size::integer) as avg_size
FROM waste_sites
GROUP BY ward;
```

### Spatial Queries

```sql
-- Sites within 1km radius
SELECT * FROM waste_sites 
WHERE ST_Distance(geom, ST_GeomFromText('POINT(-3.2869 39.6568)', 4326)) < 1000;
```

---

## Database Backup & Restore

### Backup

```bash
pg_dump -U postgres geowaste_kilifi > backup.sql
```

### Restore

```bash
psql -U postgres geowaste_kilifi < backup.sql
```

---

## Production Deployment

### Build for Production

```bash
npm run build:all
```

### Deploy Frontend

Deploy `frontend/build/` to Netlify, Vercel, or your hosting provider.

### Deploy Backend

Deploy to Render, Railway, or DigitalOcean with proper environment variables.

For detailed deployment instructions, see DEPLOYMENT.md

---

## License

MIT License - Copyright 2024 GeoWaste Team

---

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make changes with descriptive commits
3. Run linting and tests
4. Submit pull request

---

## Support

For issues or questions:

1. Check this README and QUICKSTART.md
2. Review PROJECT-OVERVIEW.md for details
3. Check browser console for errors
4. Submit GitHub issues for bugs

---

## Academic Context

This system was developed as a BSc Geography project MVP focused on:

- Geospatial data collection methodologies
- Geographic Information Systems (GIS) development
- Waste disposal site suitability analysis
- Environmental assessment and sustainable waste management
- Real-world field research techniques

The platform demonstrates practical applications of modern geospatial technologies in academic research and can be extended with advanced spatial analysis features.

---

**Project Status:** Production Ready (Version 1.0.0)  
**Last Updated:** January 2024  
**Repository:** GitHub (koderopowell5-oss/geowastekilifiproject)
# GeoWaste Kilifi MVP

A web-based geospatial data collection system for field data collection and analysis of solid waste disposal suitability in Kilifi Municipality.

## Table of Contents

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

---

## Overview

**GeoWaste Kilifi** is a comprehensive MVP designed for geographic research on sustainable waste management practices in Kilifi Municipality. This system integrates modern geospatial technologies with field data collection methodologies to enable evidence-based analysis of waste disposal site suitability.

### System Capabilities

The platform enables researchers and field enumerators to:

- **Automatic GPS capture** of field locations with high-precision coordinates
- **Comprehensive digital questionnaire** with 9 specialized sections covering household waste management
- **Interactive mapping** of waste disposal sites with spatial analysis capabilities
- **Real-time data analysis** and statistical visualization
- **Spatial database** with advanced PostGIS support for geographic queries
- **Multiple user roles** (Enumerators, Administrators) with role-based access control
- **Offline data caching** for data collection in areas with limited connectivity

### Key Achievements

- Full-stack application architecture (Frontend + Backend + Database)
- Mobile-friendly responsive design optimized for field data collection
- Real-time map visualization with Leaflet and interactive markers
- RESTful API with comprehensive error handling and validation
- PostgreSQL with PostGIS spatial indexing and efficient geographic queries
- Complete TypeScript implementation across frontend, backend, and shared types
- Production-ready project structure with Docker containerization support
- Notification system for real-time user feedback
- Authentication and authorization mechanisms for secure data access

---

## Tech Stack

The system is built on a modern, scalable technology foundation optimized for geospatial applications:

### Frontend Layer

- **React 18** - Modern JavaScript library for building interactive user interfaces
- **TypeScript** - Static typing for enhanced code quality and developer experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Leaflet.js + React-Leaflet** - Industry-standard geospatial mapping libraries
- **Vite** - Next-generation frontend build tool for fast development and optimal production builds

### Backend Layer

- **Node.js** - JavaScript runtime for server-side execution
- **Express.js** - Lightweight web framework for building REST APIs
- **TypeScript** - Ensures type safety and reduces runtime errors in backend logic

### Geolocation & Mapping

- **Browser Geolocation API** - Native GPS capture with fallback to network-based positioning
- **Leaflet.js** - Lightweight mapping library with extensive plugin support
- **OpenStreetMap** - Free, open-source map tiles for visualization

### Database Layer

- **PostgreSQL 12+** - Enterprise-grade relational database system
- **PostGIS Extension** - Spatial database extension for geographic queries and indexing
- **Connection Pooling** - Efficient database connection management

### DevOps & Deployment

- **Docker** - Containerization for consistent deployment across environments
- **Docker Compose** - Multi-container orchestration for development
- **Render/Railway** - Cloud deployment platforms for production hosting

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 18+ | User interface & form handling |
| Frontend Language | TypeScript | 5+ | Type-safe component development |
| Frontend Styling | Tailwind CSS | 3.x | Responsive design system |
| Mapping | Leaflet.js | 1.9+ | Geospatial visualization |
| Location Services | Browser API | Native | GPS auto-capture |
| Backend Runtime | Node.js | 16+ | Server execution environment |
| Backend Framework | Express.js | 4.x | REST API server |
| Database | PostgreSQL | 12+ | Data persistence |
| Spatial Extension | PostGIS | 3.x+ | Geographic queries |
| Containerization | Docker | Latest | Application packaging |

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
GeoWaste Kilifi/
├── backend/                          # Node.js + Express REST API server
│   ├── src/
│   │   ├── index.ts                 # Application entry point and server initialization
│   │   ├── db.ts                    # PostgreSQL connection pooling and configuration
│   │   ├── routes.ts                # API route definitions and endpoint mapping
│   │   ├── service.ts               # Business logic, database queries, and spatial operations
│   │   ├── types.ts                 # TypeScript interface definitions
│   │   ├── authService.ts           # Authentication and authorization logic
│   │   └── [other services]         # Additional business logic modules
│   ├── dist/                        # Compiled JavaScript output
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── Dockerfile                   # Docker containerization
│   └── .eslintrc                    # Linting rules
│
├── frontend/                         # React TypeScript application
│   ├── public/
│   │   ├── index.html               # Main HTML entry point
│   │   ├── assets/                  # Static images and resources
│   │   └── images/                  # Application icons and logos
│   ├── src/
│   │   ├── App.tsx                  # Root component
│   │   ├── index.tsx                # React entry point
│   │   ├── index.css                # Global styles
│   │   ├── App.css                  # App-specific styles
│   │   ├── components/              # Reusable React components
│   │   │   ├── Dashboard.tsx        # Main dashboard view
│   │   │   ├── AdminDashboard.tsx   # Admin panel
│   │   │   ├── WasteSurveyForm.tsx  # Multi-section survey form
│   │   │   ├── WasteMap.tsx         # Leaflet map visualization
│   │   │   ├── CollectionsPage.tsx  # Data collections view
│   │   │   ├── EnumeratorsPage.tsx  # Enumerator management
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── FloatingTabBar.tsx   # Mobile tab navigation
│   │   │   ├── Toast.tsx            # Toast notifications
│   │   │   ├── Notifications/       # Notification components
│   │   │   └── [other components]
│   │   ├── context/                 # React Context for state management
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── NotificationContext.tsx # Notification state
│   │   ├── pages/                   # Page-level components (routes)
│   │   │   ├── LoginPage.tsx        # User login
│   │   │   ├── AdminLoginPage.tsx   # Admin login
│   │   │   ├── SignupPage.tsx       # User registration
│   │   │   └── Auth.tsx             # Auth routing
│   │   ├── services/                # API communication and utilities
│   │   │   ├── wasteApi.ts          # Backend API client
│   │   │   ├── geolocation.ts       # GPS positioning service
│   │   │   └── offlineService.ts    # Local cache management
│   │   └── utils/                   # Utility functions
│   ├── build/                       # Production build output
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── nginx.conf                   # Nginx web server config
│   ├── Dockerfile                   # Docker containerization
│   └── [config files]
│
├── database/                         # Database initialization and migrations
│   ├── schema.sql                   # Complete PostgreSQL schema with PostGIS
│   ├── schema-no-postgis.sql        # Alternative schema without spatial features
│   ├── migration_001_add_enumerator_email.sql # Database migration
│   ├── add-drafts.sql               # Draft records table setup
│   ├── fix-geom-column.sql          # Geometry column fixes
│   └── setup-render.sql             # Production setup script
│
├── types.ts                          # Shared TypeScript interfaces (frontend + backend)
├── types.js                          # JavaScript type definitions
├── types.d.ts                        # TypeScript declarations
├── package.json                      # Root package configuration
├── docker-compose.yml               # Multi-container orchestration
├── .env.example                      # Environment variables example
│
├── Documentation/
│   ├── README.md                    # This file
│   ├── QUICKSTART.md                # Quick start guide
│   ├── PROJECT-OVERVIEW.md          # Comprehensive project documentation
│   ├── API-TESTING.md               # API testing procedures
│   ├── DEPLOYMENT.md                # Deployment instructions
│   ├── POSTGRES-SETUP.md            # Database setup guide
│   ├── LOGIN_PORTAL_GUIDE.md        # Authentication guide
│   ├── FILE-MANIFEST.md             # File inventory and descriptions
│   └── [other guides]
│
└── Scripts/
    ├── setup-db.ps1                 # Windows database setup script
    ├── setup-db-simple.ps1          # Simplified setup script
    ├── setup-clean.ps1              # Clean installation script
    ├── install-postgis.ps1          # PostGIS installation
    ├── load-schema.ps1              # Schema loading script
    └── fix-permissions.ps1          # Permission fixes script
```

### Key Directory Descriptions

- **backend/src/** - Core server logic, API routes, database services, and authentication
- **frontend/src/components/** - Reusable UI components following React best practices
- **frontend/src/services/** - External API communication and geolocation services
- **database/** - SQL schemas, migrations, and database initialization scripts
- **types.ts** - Shared TypeScript interfaces ensuring type consistency across the stack

---

## Prerequisites

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

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js** v16 or higher (LTS recommended) - [Download](https://nodejs.org/)
- **npm** v7 or higher (typically bundled with Node.js)
- **PostgreSQL** 12 or higher - [Download](https://www.postgresql.org/download/)
- **PostGIS Extension** 3.x+ for spatial database support - [Installation Guide](https://postgis.net/install/)
- **Git** (optional but recommended for version control) - [Download](https://git-scm.com/)

### System Requirements

- Minimum 2GB RAM for development
- Minimum 500MB free disk space
- Windows, macOS, or Linux operating system
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Verify Installation

Run these commands to verify all prerequisites are correctly installed:

```bash
# Check Node.js version (should be 16+)
node --version
# Example output: v18.12.0

# Check npm version (should be 7+)
npm --version
# Example output: 9.2.0

# Check PostgreSQL version (should be 12+)
psql --version
# Example output: psql (PostgreSQL) 14.5 on x86_64-pc-linux-gnu

# Check Git (optional)
git --version
# Example output: git version 2.38.0
```

If any command returns an error or version number is lower than required, please install or upgrade the software.

---

## Installation & Setup

### Step 1: Clone or Extract the Project

```bash
# Navigate to your projects directory
cd your-projects-folder

# Clone the repository (if using Git)
git clone <repository-url> GeoWaste-Kilifi
cd GeoWaste-Kilifi

# Or, if you have the project as a ZIP file
# Extract it and navigate to the directory
cd GeoWaste-Kilifi
```

### Step 2: Setup PostgreSQL Database

The database setup process varies based on your operating system. Follow the appropriate section.

#### Database Setup - Windows

1. **Verify PostgreSQL is Running**
   - PostgreSQL service should start automatically after installation
   - Open PowerShell as Administrator and verify:
   
   ```powershell
   psql -U postgres -c "SELECT version();"
   ```
   
   If you're prompted for a password, enter the PostgreSQL password you set during installation.

2. **Create the GeoWaste Database**
   
   ```sql
   -- Open PostgreSQL command prompt
   psql -U postgres
   
   -- Create the database
   CREATE DATABASE geowaste_kilifi;
   
   -- Connect to the new database
   \c geowaste_kilifi
   
   -- Enable PostGIS extension
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   -- Verify PostGIS installation
   SELECT PostGIS_version();
   ```

3. **Load the Database Schema**
   
   ```powershell
   # Exit PostgreSQL first (type \q)
   psql -U postgres -d geowaste_kilifi -f database\schema.sql
   ```

#### Database Setup - macOS/Linux

```bash
# Start PostgreSQL service (macOS)
brew services start postgresql

# Start PostgreSQL service (Linux)
sudo service postgresql start

# Create the database
createdb -U postgres geowaste_kilifi

# Enable PostGIS extension
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify PostGIS
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Load the schema
psql -U postgres -d geowaste_kilifi -f database/schema.sql

# Verify schema loaded successfully
psql -U postgres -d geowaste_kilifi -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

### Step 3: Configure Environment Variables

Create `.env` files for both backend and frontend with the necessary configuration.

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geowaste_kilifi
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# CORS Configuration (for frontend communication)
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (if using authentication)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# Logging Configuration
LOG_LEVEL=debug

# API Configuration
API_TIMEOUT=30000
MAX_REQUEST_SIZE=50mb
```

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your settings:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Map Configuration (Kilifi Municipality center)
REACT_APP_MAP_CENTER_LAT=-3.2869
REACT_APP_MAP_CENTER_LNG=39.6568
REACT_APP_MAP_ZOOM=13
REACT_APP_MAP_MIN_ZOOM=8
REACT_APP_MAP_MAX_ZOOM=18

# Feature Toggles
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true

# Application Name
REACT_APP_NAME=GeoWaste Kilifi
REACT_APP_VERSION=1.0.0
```

### Step 4: Install Dependencies

Choose one of the following installation methods:

#### Option A: Install All Dependencies (Recommended)

```bash
# From the project root directory
npm run install:all
```

This command installs dependencies for both backend and frontend in one step.

#### Option B: Install Separately

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Option C: Manual Installation

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

The installation process will:
- Download all required npm packages
- Install TypeScript and development tools
- Configure build systems
- Create node_modules directories

**Note:** This may take 2-5 minutes depending on your internet connection.

---

## Running the Application

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

## Running the Application

The application can be run in several ways depending on your development needs.

### Option 1: Run Both Frontend & Backend Together (Recommended for Development)

```bash
# From the project root directory
npm run dev
```

This command starts both services concurrently:
- **Backend API Server** will run on http://localhost:5000
- **Frontend React App** will run on http://localhost:3000

The console will display logs from both services, making it easy to monitor development.

### Option 2: Run Frontend and Backend Separately

This approach is useful when you need to debug or work on specific parts independently.

#### Terminal 1 - Start the Backend API Server

```bash
# Option 1: Using npm script from root
npm run dev:backend

# Option 2: Navigate and run directly
cd backend
npm run dev

# Expected output:
# Environment: development
# Database connected successfully
# Backend server running on http://localhost:5000
```

#### Terminal 2 - Start the Frontend Application

```bash
# Option 1: Using npm script from root
npm run dev:frontend

# Option 2: Navigate and run directly
cd frontend
npm start

# Expected output:
# Compiled successfully!
# You can now view the app in the browser.
# Local: http://localhost:3000
```

### Verify Backend is Working

Before accessing the frontend, verify that the backend API is responding:

```bash
# Using curl (macOS/Linux)
curl http://localhost:5000/api/health

# Using PowerShell (Windows)
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -ExpandProperty Content

# Expected response:
# {
#   "success": true,
#   "message": "Backend is running",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### Access the Application

Once both services are running:

1. **Frontend Application**: Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

2. **API Documentation**: Access the API at:
   ```
   http://localhost:5000/api
   ```

3. **Map Features**: The application will display an interactive map centered on Kilifi Municipality

### Common Issues During Startup

**Port Already in Use**
- If port 5000 (backend) or 3000 (frontend) is already in use, see the Troubleshooting section below

**Database Connection Error**
- Verify PostgreSQL is running and credentials are correct in `.env` files

**Module Not Found Errors**
- Run `npm install` in both backend and frontend directories

---

## API Documentation

The GeoWaste Kilifi system provides a comprehensive REST API for data collection and retrieval.

### Base URL

```
http://localhost:5000/api
```

### Authentication

The API supports both authenticated and public endpoints:
- Public endpoints: Health checks, general statistics
- Protected endpoints: Data submission, administrative functions

### API Response Format

All API responses follow a consistent JSON structure:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "error": null
}
```

### Endpoint Reference

#### 1. Health Check

Verify the backend is operational.

```http
GET /api/health
```

**Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Create Waste Site Record

Submit a new waste site survey with spatial and questionnaire data.

```http
POST /api/waste
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

**Response Example (201 Created):**
```json
{
  "success": true,
  "message": "Waste site record created successfully",
  "data": {
    "id": 1,
    "latitude": -3.2869,
    "longitude": 39.6568,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Retrieve All Records

Fetch all waste site records with pagination support.

```http
GET /api/waste?limit=100&offset=0
```

**Query Parameters:**
- `limit` - Number of records per page (default: 100, max: 1000)
- `offset` - Number of records to skip (default: 0)

**Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Waste sites retrieved successfully",
  "data": {
    "records": [ /* array of waste site records */ ],
    "pagination": {
      "total": 150,
      "limit": 100,
      "offset": 0,
      "pages": 2
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Retrieve Single Record

Get detailed information about a specific waste site.

```http
GET /api/waste/:id
```

**Example:** `GET /api/waste/1`

**Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Waste site record retrieved successfully",
  "data": {
    "id": 1,
    "latitude": -3.2869,
    "longitude": 39.6568,
    "ward": "Tezo",
    /* complete record data */
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 5. Get Statistics Summary

Retrieve aggregate statistics about collected data.

```http
GET /api/waste/stats/summary
```

**Response Example (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_records": 45,
    "total_wards": 2,
    "distinct_settlement_types": 3,
    "records_by_week": [ /* time series */ ],
    "waste_types_distribution": {}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 6. Query Sites by Geographic Bounds

Retrieve waste sites within a specified geographic bounding box using PostGIS.

```http
GET /api/waste/bounds/:minLat/:maxLat/:minLng/:maxLng
```

**Example:** `GET /api/waste/bounds/-3.3/-3.2/39.5/39.7`

**Response Example (200 OK):**
```json
{
  "success": true,
  "message": "Sites within bounds retrieved",
  "data": {
    "sites": [ /* array of sites within bounds */ ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Database Schema

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

## Database Schema

The backbone of the application is a carefully designed PostgreSQL schema with spatial support via PostGIS.

### Primary Table: waste_sites

This is the main table storing all waste site survey data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique record identifier, auto-incrementing |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude coordinate |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude coordinate |
| `geom` | GEOMETRY(POINT, 4326) | NOT NULL, UNIQUE INDEX | PostGIS geometry point (WGS84) |
| `ward` | VARCHAR(50) | NOT NULL | Administrative ward name |
| `settlement_type` | VARCHAR(50) | NOT NULL | Settlement classification (Formal/Informal/Peri-urban) |
| `household_size` | VARCHAR(10) | NOT NULL | Household size range (1-3, 4-6, 7+) |
| `waste_types` | TEXT[] | DEFAULT '{}' | Array of waste categories |
| `waste_quantity` | VARCHAR(20) | NOT NULL | Daily waste quantity generated |
| `waste_separation` | BOOLEAN | NOT NULL | Whether household separates waste |
| `disposal_method` | VARCHAR(100) | | Primary waste disposal method |
| `distance_to_site` | VARCHAR(50) | | Distance to nearest disposal site |
| `collection_frequency` | VARCHAR(50) | | How often waste is collected |
| `road_access` | VARCHAR(50) | | Quality of road access |
| `distance_to_road` | VARCHAR(50) | | Distance in meters to nearest road |
| `waste_near_home` | BOOLEAN | | Is waste currently disposed near home |
| `distance_to_waste` | VARCHAR(50) | | Distance from home to waste site |
| `impacts` | TEXT[] | | Environmental/social impacts observed |
| `nearby_features` | TEXT[] | | Geographic features near site |
| `recommended_distance` | VARCHAR(100) | | Recommended minimum distance |
| `preferred_location` | TEXT[] | | Community preferred location type |
| `distance_weight` | INTEGER | CHECK(>=1 AND <=5) | Weighting (1-5) for distance factor |
| `water_weight` | INTEGER | CHECK(>=1 AND <=5) | Weighting for water proximity |
| `road_weight` | INTEGER | CHECK(>=1 AND <=5) | Weighting for road access |
| `slope_weight` | INTEGER | CHECK(>=1 AND <=5) | Weighting for terrain slope |
| `landuse_weight` | INTEGER | CHECK(>=1 AND <=5) | Weighting for land use consideration |
| `terrain` | VARCHAR(100) | | Terrain type (flat, gentle slope, steep) |
| `flooding` | VARCHAR(50) | | Flooding frequency risk |
| `policy_awareness` | BOOLEAN | | Is respondent aware of policies |
| `support_new_site` | VARCHAR(50) | | Support for new disposal site |
| `preferred_management` | VARCHAR(100) | | Preferred waste management method |
| `challenges` | TEXT | | Challenges in current waste management |
| `suggested_location` | TEXT | | Community suggestions for site location |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### Database Indexes

Performance optimization through strategic indexing:

| Index Name | Type | Column(s) | Purpose |
|-----------|------|-----------|---------|
| `idx_waste_sites_geom` | GIST | geom | Spatial queries on geographic location |
| `idx_waste_sites_created_at` | BTREE | created_at | Temporal queries and sorting |
| `idx_waste_sites_ward` | BTREE | ward | Fast ward-based filtering |
| `idx_waste_sites_settlement` | BTREE | settlement_type | Settlement type filtering |

### Database Views

Aggregated views for analytics:

- **waste_sites_summary** - Statistical summary with counts and averages
- **wards_statistics** - Data aggregated by administrative ward
- **settlement_analysis** - Analysis grouped by settlement type

### PostGIS Spatial Capabilities

The `geom` column enables advanced spatial queries:

```sql
-- Find sites within 1km radius of a point
SELECT * FROM waste_sites 
WHERE ST_Distance(geom, ST_GeomFromText('POINT(-3.2869 39.6568)', 4326)) < 1000;

-- Get sites within a bounding box
SELECT * FROM waste_sites
WHERE geom && ST_MakeEnvelope(-3.3, 39.5, -3.2, 39.7, 4326);

-- Calculate distance between two points
SELECT ST_Distance(geom1, geom2) as distance_meters 
FROM waste_sites WHERE id IN (1, 2);
```

---

## Features

### Frontend Features

#### Dashboard Component
- Real-time statistics showing total records, wards covered, and settlement types
- Quick action buttons for survey initiation and map viewing
- Project information and system status overview
- User authentication state indicator

#### Survey Form (9-Section Questionnaire)
- **Section A - Location & Household Info**: Automatic GPS capture, household demographics
- **Section B - Waste Generation**: Types, quantities, and household separation practices
- **Section C - Disposal Practices**: Current disposal methods and frequencies
- **Section D - Accessibility**: Road conditions and distance assessments
- **Section E - Environmental Risks**: Impact identification and nearby hazards
- **Section F - Suitability Perception**: Community perception with weighted importance (1-5)
- **Section G - Topography**: Terrain and flood risk assessment
- **Section H - Community & Policy**: Stakeholder awareness and support levels
- **Section I - Open-Ended Feedback**: Qualitative comments and suggestions

- Form validation with user-friendly error messages
- Progress tracking across sections
- Auto-save capability for draft submissions
- Mobile-first responsive design
- Loading and disabled states for better UX
- Comprehensive form data persistence

#### Map Visualization
- Interactive Leaflet map centered on Kilifi Municipality
- Site markers with clustering for dense areas
- Popup details on marker click
- Expandable side panel with complete record information
- Statistics overlay showing data coverage
- Multiple basemap options (satellite, terrain)
- Print and export capabilities

#### Additional Pages
- Enumerator management and profile pages
- Collections and records listing
- Admin dashboard for system oversight
- Authentication pages (login, signup)

### Backend Features

#### API Design
- Complete RESTful API with proper HTTP status codes
- Consistent JSON response formatting
- Comprehensive input validation
- Error handling with descriptive messages
- Request logging for debugging

#### Data Management
- Spatial querying with PostGIS
- Geographic bounds filtering for map tile loading
- Pagination support for large datasets
- Automatic timestamp tracking (created_at, updated_at)
- Transaction support for data integrity

#### Performance Optimization
- Database indexes for fast queries
- Connection pooling for efficient resource usage
- Query optimization for spatial operations
- Caching strategies for frequently accessed data

#### Security Features
- Input sanitization to prevent SQL injection
- CORS configuration for frontend communication
- Environment variable management
- Error messages that don't leak sensitive information

### Database Features

- PostGIS spatial support for geographic queries
- Automatic timestamp tracking on record creation/updates
- Optimized indexes for common query patterns
- Statistical views for analytics
- Aggregation capabilities for reporting
- Update triggers for data consistency

### Notifications System
- Real-time toast notifications for user actions
- Success/error/info/warning notification types
- Customizable notification duration and positioning
- Integration with user feedback workflow

---

## Usage Guide

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

## Usage Guide

### Starting a New Waste Site Survey

The survey workflow is designed for field enumerators to efficiently collect comprehensive waste management data.

1. **Navigate to Dashboard**
   - Access http://localhost:3000
   - Authenticate if required

2. **Initiate New Survey**
   - Click "Start New Survey" button on the dashboard
   - System will request location permissions

3. **Grant GPS Permission**
   - Allow browser location access when prompted
   - Device must have GPS enabled and 4G/WiFi connectivity
   - GPS coordinates will be automatically captured

4. **Review Auto-Captured Location**
   - Verify latitude and longitude coordinates
   - Ensure accuracy is acceptable (typically <10 meters)
   - Can manually adjust if necessary

5. **Complete Survey Sections Sequentially**
   - Navigate through all 9 sections in order
   - Fill required fields marked with *
   - Use Next/Previous buttons for navigation
   - Save progress periodically

6. **Submit Completed Survey**
   - Final validation before submission
   - Confirmation message upon successful submission
   - Data synchronized with backend

### Viewing the Interactive Map

The map visualization provides geographic understanding of collected data.

1. **Access Map View**
   - Click "View Map" button on dashboard
   - Map loads with Kilifi Municipality boundaries

2. **Explore Waste Sites**
   - Red markers indicate collected waste sites
   - Marker clustering for dense areas
   - Zoom in/out to adjust detail level

3. **Click Marker for Details**
   - Popup appears with basic site information
   - Click to expand full details panel
   - Review all collected survey data

4. **Geographic Analysis**
   - Identify site patterns and clusters
   - Assess coverage across wards
   - Plan future survey activities

### Understanding the Data and Weighting System

The application uses a weighted suitability assessment approach.

**Waste Quantity Categories:**
- Less than 1kg per day
- 1-3kg per day
- 3-5kg per day
- Greater than 5kg per day

**Settlement Types:**
- Formal settlements (planned, service infrastructure)
- Informal settlements (unplanned, basic services)
- Peri-urban settlements (transitional areas)

**Suitability Weights (1-5 Scale):**
- 1 = Not important/not relevant
- 3 = Moderately important
- 5 = Critically important
- Weights influence the final suitability score calculation

### Multi-Select and Advanced Input

- **Hold Ctrl (Windows/Linux) or Cmd (Mac)** to select multiple options
- **GPS Accuracy**: Device positioning accuracy typically <10 meters in urban areas
- **Offline Mode**: Limited functionality if disconnected; data syncs when reconnected

---

## Troubleshooting

This section provides solutions to common issues.

### Issue 1: Cannot Get Location

**Problem:** "Failed to get location" error, GPS not capturing coordinates

**Root Causes:**
- HTTPS not enabled (browser requires secure context)
- Location permissions denied in browser
- GPS disabled on device
- No internet connectivity

**Solutions:**
```bash
# Solution 1: Ensure HTTPS or localhost (both are secure contexts)
# If running on a network IP address, enable HTTPS

# Solution 2: Check browser location permissions
# Chrome: Settings > Privacy > Site Settings > Location
# Firefox: Preferences > Privacy > Permissions > Location

# Solution 3: Enable GPS on your device
# Windows: Settings > Privacy > Location Services
# macOS: System Preferences > Security & Privacy > Location Services
# Android/iOS: Settings > Location

# Solution 4: Verify internet connectivity
ping google.com

# Solution 5: Try a different browser
# Chrome, Firefox, Safari, and Edge all support Geolocation API
```

### Issue 2: Cannot Connect to Backend API

**Problem:** Frontend shows "Cannot connect to backend" error, API requests fail

**Root Causes:**
- Backend server not running
- Wrong API URL in frontend .env
- Port 5000 already in use
- Firewall blocking connection

**Solutions:**
```bash
# Step 1: Verify backend is running on port 5000
curl http://localhost:5000/api/health

# Step 2: Check if port 5000 is in use (Windows)
netstat -ano | findstr :5000

# Step 3: Check if port 5000 is in use (macOS/Linux)
lsof -i :5000

# Step 4: Kill process using port 5000 (Windows)
taskkill /PID <PID_NUMBER> /F

# Step 5: Kill process using port 5000 (macOS/Linux)
kill -9 <PID_NUMBER>

# Step 6: Verify correct API URL in frontend/.env
cat frontend/.env | grep REACT_APP_API_URL
# Should show: REACT_APP_API_URL=http://localhost:5000/api

# Step 7: Restart backend
cd backend && npm run dev
```

### Issue 3: Database Connection Error

**Problem:** Backend fails with "Cannot connect to database" or "Connection refused"

**Root Causes:**
- PostgreSQL service not running
- Incorrect database credentials
- Database doesn't exist
- Wrong host or port configuration

**Solutions:**
```bash
# Step 1: Verify PostgreSQL is running and respond
psql -U postgres -c "SELECT version();"

# Windows: If not running, start with
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start

# macOS: Start PostgreSQL
brew services start postgresql

# Linux: Start PostgreSQL
sudo service postgresql start

# Step 2: Verify database exists
psql -U postgres -l | grep geowaste_kilifi

# Step 3: Test connection with correct credentials
psql -U postgres -h localhost -d geowaste_kilifi -c "SELECT 1;"

# Step 4: Check backend/.env for correct values
cat backend/.env | grep DB_

# Step 5: Verify PostGIS extension
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Step 6: If PostGIS missing, install it
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION postgis;"
```

### Issue 4: PostGIS Extension Not Found

**Problem:** Error saying PostGIS extension does not exist

**Solution:**
```bash
# Install PostGIS extension in the database
psql -U postgres -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify installation
psql -U postgres -d geowaste_kilifi -c "SELECT PostGIS_version();"

# Expected output: POSTGIS="3.x.x" ...

# If still fails, ensure PostGIS is installed on system
# Windows: Reinstall PostgreSQL and select PostGIS during installation
# macOS: brew install postgis
# Linux: sudo apt-get install postgis
```

### Issue 5: Port Already in Use

**Problem:** "Address already in use" error when starting server

#### Frontend (Port 3000)
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux - Find and kill process
lsof -i :3000
kill -9 <PID>

# Run on different port
PORT=3001 npm start
```

#### Backend (Port 5000)
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux - Find and kill process
lsof -i :5000
kill -9 <PID>

# Run on different port
PORT=5001 npm run dev
```

### Issue 6: npm install Fails

**Problem:** Installation errors, missing dependencies, network issues

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete existing node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try updating npm
npm install -g npm@latest

# Check npm and Node versions
npm --version
node --version

# Try installing with verbose logging
npm install --verbose
```

### Issue 7: Build Fails with TypeScript Errors

**Problem:** Compilation errors, TypeScript type mismatches

**Solutions:**
```bash
# Verify TypeScript is installed
npm list typescript

# Global TypeScript installation
npm install -g typescript

# Check for type errors directly
tsc --noEmit

# Build verbose output
npm run build -- --verbose

# Review frontend/tsconfig.json and backend/tsconfig.json
cat backend/tsconfig.json
```

### Issue 8: Form Submission Fails

**Problem:** Survey form submission returns errors or doesn't complete

**Solutions:**
```bash
# Check browser console for JavaScript errors
# F12 or Cmd+Option+I to open Developer Tools
# Look in Console tab for error messages

# Verify all required fields are filled
# Fields marked with * are required

# Check network tab to see API request/response
# Network tab shows POST request to /api/waste

# Ensure backend received data correctly
# Check backend console logs for errors

# Verify database has space and is not read-only
psql -U postgres -d geowaste_kilifi -c "SELECT pg_database_size('geowaste_kilifi');"
```

### Getting More Help

If issues persist:

1. **Check backend logs** - Review terminal where backend is running
2. **Check browser console** - F12/Cmd+Option+I, look in Console tab
3. **Check network requests** - Network tab in Developer Tools
4. **Review project documentation** - Check relevant .md files
5. **Database logs** - PostgreSQL error logs in data directory

---

## Data Export & Analysis

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
**Status:** Production Ready
#   g e o w a s t e k i l i f 
 
 #   g e o w a s t e k i l i f i 
 
 

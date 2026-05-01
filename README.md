# 🗺️ GeoWaste Kilifi MVP

> A comprehensive geospatial data collection system for field research and analysis of solid waste disposal suitability in Kilifi Municipality. Features include web & mobile apps, real-time notifications, OTP authentication, custom surveys, and advanced versioning controls.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.2-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Backend](https://img.shields.io/badge/Backend-1.0.0-green)
![Frontend](https://img.shields.io/badge/Frontend-1.0.2-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#-system-architecture)
- [📱 Mobile App (NEW!)](#-mobile-app-new)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Features](#features)
- [Release Notes](#-release-notes-v102)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Data Export & Analysis](#data-export--analysis)
- [Database Backup & Restore](#database-backup--restore)
- [Production Deployment](#production-deployment)
- [Academic Context](#academic-context)

---

## 📱 Mobile App (NEW!)

GeoWaste Kilifi now has a **native Android app** built with Capacitor! 

### Download the Mobile App

Web users can download the Android APK directly from the application:

1. **Open Profile** → Click on your profile icon in the sidebar
2. **Go to General Settings** → Click "General Settings" button
3. **Download APK** → Click the blue "Download APK" button
4. **Install on Your Phone** → Follow the on-screen installation guide

### Why Use the Mobile App?

✅ **Better Performance** - Optimized for mobile devices
✅ **Offline Support** - Work without internet connection
✅ **Native Features** - Direct access to camera and GPS
✅ **Same Data** - Syncs with web version automatically
✅ **Secure** - All data encrypted and secure

### For Developers

- **Build Guide**: See [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)
- **Build Script**: Run `.\build-apk.ps1` to build APK
- **Implementation Details**: See [ANDROID_APP_IMPLEMENTATION.md](./ANDROID_APP_IMPLEMENTATION.md)
- **User Guide**: See [MOBILE_APP_USER_GUIDE.md](./MOBILE_APP_USER_GUIDE.md)

**Quick Start**:
```powershell
# Build debug APK
.\build-apk.ps1 -BuildType debug

# Build release APK
.\build-apk.ps1 -BuildType release

# Build and deploy to device
.\build-apk.ps1 -BuildType debug -Deploy
```

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

## 🏗️ System Architecture

### Three-Tier Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│  React Frontend (Web)  │  Capacitor Mobile (Android)   │
│  • Responsive UI       │  • Native performance         │
│  • Real-time updates   │  • Offline-first design       │
└─────────────┬───────────────────────────────────────────┘
              │ HTTPS / REST API
┌─────────────▼───────────────────────────────────────────┐
│                    API LAYER                             │
│            Express.js REST Backend (1.0.0)              │
│  • Authentication & Authorization                        │
│  • Spatial data operations (PostGIS)                     │
│  • Real-time notifications                              │
│  • Version management & auto-updates                     │
│  • File uploads (Cloudinary integration)                │
└─────────────┬───────────────────────────────────────────┘
              │ SQL
┌─────────────▼───────────────────────────────────────────┐
│                   DATA LAYER                             │
│         PostgreSQL 12+ with PostGIS 3.x+                │
│  • Geospatial indexing (GiST/BRIN)                      │
│  • Waste collection sites & surveys                     │
│  • User profiles & authentication                        │
│  • Notification history & OTP records                   │
│  • Version control & update logs                        │
└─────────────────────────────────────────────────────────┘
```

### Core Services Architecture

| Service | Responsibility | Key Methods |
|---------|----------------|-------------|
| **Authentication Service** | User login, registration, role-based access | `loginUser()`, `registerUser()`, `verifyOTP()` |
| **Waste Survey Service** | CRUD operations on waste collection sites | `createSurvey()`, `updateSurvey()`, `getSurveys()` |
| **Geolocation Service** | GPS capture, coordinate validation | `captureLocation()`, `validateCoordinates()` |
| **Notification Service** | Real-time alerts & notifications | `sendNotification()`, `getNotificationHistory()` |
| **OTP Service** | One-time password generation & validation | `generateOTP()`, `verifyOTP()`, `resendOTP()` |
| **Survey Service** | Custom survey templates & management | `createSurveyTemplate()`, `updateTemplate()` |
| **Version Service** | Auto-update detection & management | `checkVersion()`, `getLatestVersion()` |
| **Email Service** | SMTP email delivery | `sendEmail()`, `sendBulkEmails()` |
| **Data Quality Service** | Validation & data quality checks | `validateSurveyData()`, `checkDataIntegrity()` |
| **Cloudinary Service** | Image upload & management | `uploadImage()`, `deleteImage()` |

---

## Tech Stack

### Frontend (React 18 + TypeScript)
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI components & form handling |
| TypeScript | 4.9.5+ | Type-safe development |
| Tailwind CSS | 3.3.0 | Responsive design system |
| Leaflet.js | 1.9.4+ | Geospatial visualization |
| Recharts | 3.8.1 | Data visualization & analytics |
| Capacitor | 8.3.1 | Mobile app framework (Android) |
| React Scripts | 5.0.1 | Build tooling |

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
GeoWaste Kilifi/                       # v1.0.2 - System Architecture
├── backend/                          # Node.js + Express REST API (v1.0.0)
│   ├── src/
│   │   ├── index.ts                  # App entry point
│   │   ├── db.ts                     # DB connection pooling
│   │   ├── routes.ts                 # API route definitions
│   │   ├── service.ts                # Business logic & spatial ops
│   │   ├── types.ts                  # TypeScript interfaces
│   │   ├── middleware.ts             # Auth & error middleware
│   │   ├── migrations.ts             # Database migrations
│   │   ├── authService.ts            # Authentication & authorization
│   │   ├── notificationService.ts    # Real-time notifications (NEW)
│   │   ├── otpService.ts             # OTP generation & verification (NEW)
│   │   ├── surveyService.ts          # Custom survey templates (NEW)
│   │   ├── versionService.ts         # Version management
│   │   ├── dataQualityService.ts     # Data validation (NEW)
│   │   ├── emailService.ts           # SMTP email delivery
│   │   ├── cloudinaryService.ts      # Image storage & CDN
│   │   └── versionRoutes.ts          # Version API endpoints
│   └── package.json
│
├── frontend/                         # React TypeScript app (v1.0.2)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── AdminDashboard.tsx    # Admin panel
│   │   │   ├── EnumeratorDashboard.tsx
│   │   │   ├── WasteSurveyForm.tsx   # 9-section survey form
│   │   │   ├── DynamicSurveyForm.tsx # Custom survey form (NEW)
│   │   │   ├── SurveyBuilder.tsx     # Survey template builder (NEW)
│   │   │   ├── NotificationPanel.tsx # Notifications UI (NEW)
│   │   │   ├── AccountSettingsPage.tsx # User settings (NEW)
│   │   │   ├── GeneralSettings.tsx   # General app settings
│   │   │   ├── ProfileTab.tsx        # User profile
│   │   │   ├── UpdateModal.tsx       # Version update prompt
│   │   │   ├── WasteMap.tsx          # Leaflet map
│   │   │   ├── ErrorBoundary.tsx     # Error handling
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Auth state
│   │   │   └── NotificationContext.tsx # Notifications state (NEW)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OTPSignupPage.tsx     # OTP verification (NEW)
│   │   │   └── SurveysManagementPage.tsx # Survey mgmt (NEW)
│   │   ├── hooks/
│   │   │   ├── useVersionCheck.ts    # Version checking hook
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── wasteApi.ts           # API client
│   │   │   ├── geolocation.ts        # GPS service
│   │   │   ├── offlineService.ts     # Offline cache
│   │   │   └── updateService.ts      # Update checking
│   │   ├── utils/                    # Utility functions
│   │   ├── context/                  # Context providers
│   │   └── locales/                  # i18n translations
│   ├── android/                      # Capacitor Android app (NEW)
│   │   ├── app/
│   │   ├── build.gradle
│   │   └── ...
│   ├── public/
│   │   ├── index.html
│   │   ├── assets/                   # Public assets
│   │   ├── downloads/                # APK downloads
│   │   └── images/
│   └── package.json
│
├── database/                         # PostgreSQL + PostGIS schemas
│   ├── schema.sql                    # Full PostGIS schema
│   ├── schema-no-postgis.sql         # Schema without spatial
│   ├── migration_001_add_enumerator_email.sql
│   ├── migration_002_add_image_url.sql
│   ├── migration_003_add_features.sql
│   ├── migration_004_fix_geom_and_quality.sql
│   ├── migration_005_add_profile_picture.sql
│   ├── migration_006_add_otp_tables.sql (NEW)
│   ├── migration_007_custom_surveys.sql (NEW)
│   ├── migration_008_notification_system.sql (NEW)
│   ├── seed-notifications.sql        # Notification templates (NEW)
│   ├── seed-survey-templates.sql     # Survey templates (NEW)
│   ├── add-drafts.sql
│   ├── fix-geom-column.sql
│   └── setup-render.sql
│
├── scripts/                          # Utility scripts
│   ├── generate-test-notifications.sh
│   ├── generate-test-notifications.bat
│   └── generate-test-notifications.js
│
├── types.ts                          # Shared frontend/backend types
├── package.json                      # Root package
├── docker-compose.yml                # Docker orchestration
│
├── Documentation/
│   ├── README.md (this file)
│   ├── VERSIONING_GUIDE.md          # Version management (NEW)
│   ├── VERSION_RELEASE_QUICK_REF.md # Release reference (NEW)
│   ├── NOTIFICATION_TESTING_GUIDE.md # Notification testing (NEW)
│   ├── TEST_NOTIFICATIONS_QUICK_START.md # Quick test guide (NEW)
│   ├── VISUAL_OVERVIEW.md
│   └── ... (other docs)
│
└── Config Files
    ├── .gitignore
    ├── docker-compose.yml
    ├── render.yaml
    └── setup scripts (.ps1, .sh files)
```

### Key Files by Feature

| Feature | Backend | Frontend | Database |
|---------|---------|----------|----------|
| **Surveys** | service.ts | WasteSurveyForm.tsx | waste_sites table |
| **Authentication** | authService.ts | AuthContext.tsx | users table |
| **Notifications** | notificationService.ts | NotificationPanel.tsx | notifications table (NEW) |
| **OTP** | otpService.ts | OTPSignupPage.tsx | otp_records table (NEW) |
| **Custom Surveys** | surveyService.ts | SurveyBuilder.tsx | survey_templates table (NEW) |
| **Versioning** | versionService.ts | UpdateModal.tsx | version_logs table |
| **Maps** | service.ts (spatial) | WasteMap.tsx | geom columns |
| **Mobile** | API layer | Capacitor | Same backend |

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

### ✨ Core Features (v1.0.2)

#### 🔐 Enhanced Authentication & Security
- **OTP Authentication** - One-Time Password verification for account security
- **Email/Username-based Tokens** - Flexible login options
- **Profile Pictures** - User account avatars & identification
- **Account Settings Page** - Comprehensive user profile management
- **Password Management** - Secure password reset & change functionality
- **Multi-role Access Control** - Enumerator & Administrator roles with different permissions

#### 📋 Survey Form — 9 Sections + Custom Surveys

**Standard Survey Sections:**
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

**NEW: Custom Survey Builder**
- 🛠️ **Dynamic Survey Templates** - Create custom survey templates without code
- 📝 **Survey Management Interface** - Full CRUD operations for survey templates
- 🔄 **Template Reusability** - Save and apply survey templates across projects
- 📊 **Field Type Support** - Text, numbers, dropdowns, multi-select, date, geolocation

#### 🔔 Real-Time Notifications System (NEW!)
- **In-app Notifications** - Real-time notification panel in UI
- **Notification History** - Complete audit trail of all notifications
- **Notification Preferences** - User-configurable notification settings
- **Auto-updates Tracking** - Notifications for new app versions
- **Admin Broadcast** - Admins can send system-wide announcements
- **Email Notifications** - Integrated email delivery for critical updates

#### 📱 Versioning & Auto-Update System (NEW!)
- **Automatic Version Detection** - Background check for new app versions
- **Semantic Versioning** - MAJOR.MINOR.PATCH versioning scheme
- **In-app Update Prompts** - User-friendly update notifications
- **Update Modal** - Download and installation guidance
- **Version History Tracking** - Complete audit of all version releases
- **Rollback Support** - Ability to revert to previous stable versions

#### 🗺️ Map Features
- Interactive Leaflet map centred on Kilifi Municipality
- Marker clustering for dense data areas
- Click-to-expand site detail panel
- Multiple basemap options (satellite, terrain)
- Real-time map updates with latest survey data

#### 📊 Data & Analytics
- Real-time dashboard with KPI metrics
- Survey completion statistics
- Spatial analysis with PostGIS
- Data quality indicators
- Waste site suitability rankings

#### ⚙️ Backend & Database
- Pagination for large datasets
- PostGIS spatial querying and bounding box filtering
- Input validation & SQL injection prevention
- CORS configuration, JWT authentication with OTP support
- Connection pooling and optimised indexes
- Email service integration (SMTP)
- Image hosting (Cloudinary)
- Comprehensive error handling & logging

#### 📱 Mobile App (Capacitor Android)
- Native Android app with React integration
- Offline-first architecture
- GPS geolocation with high precision
- Camera integration for photo capture
- Local data caching
- Background sync when connection restored

---

## 📋 Release Notes: v1.0.2

**Released**: May 1, 2026  
**Status**: Production Ready

### ✨ What's New

#### Major Features Added
- 🔔 **Real-Time Notification System** - Complete notification infrastructure with in-app panel and history
- 🔐 **OTP Authentication** - One-Time Password verification for enhanced security
- 📝 **Custom Survey Builder** - Dynamic survey template creation without code
- 📊 **Survey Management UI** - Full CRUD operations for custom survey templates
- 🔄 **Automated Version Management** - Background version checking and update prompts
- 📱 **Account Settings Page** - Comprehensive user profile management interface
- 🎨 **Enhanced Authentication** - Email/username-based flexible login system

#### Backend Services (v1.0.0)
| Service | Status | Description |
|---------|--------|-------------|
| `notificationService.ts` | ✅ NEW | Real-time notifications & delivery |
| `otpService.ts` | ✅ NEW | OTP generation and verification |
| `surveyService.ts` | ✅ NEW | Custom survey template management |
| `versionService.ts` | ✅ ENHANCED | Version tracking & update detection |
| `dataQualityService.ts` | ✅ NEW | Data validation & quality checks |

#### Database Enhancements
- **5 New Migrations**:
  - `migration_005_add_profile_picture.sql` - User profile pictures
  - `migration_006_add_otp_tables.sql` - OTP records storage
  - `migration_007_custom_surveys.sql` - Survey templates tables
  - `migration_008_notification_system.sql` - Notification tables
  - **Seed Scripts**: `seed-notifications.sql`, `seed-survey-templates.sql`

#### Frontend Components (v1.0.2)
| Component | Type | Status |
|-----------|------|--------|
| `NotificationPanel.tsx` | Feature | ✅ NEW |
| `DynamicSurveyForm.tsx` | Feature | ✅ NEW |
| `SurveyBuilder.tsx` | Feature | ✅ NEW |
| `SurveysManagementPage.tsx` | Feature | ✅ NEW |
| `AccountSettingsPage.tsx` | Feature | ✅ NEW |
| `OTPSignupPage.tsx` | Feature | ✅ NEW |
| `UpdateModal.tsx` | Component | ✅ ENHANCED |
| `ProfileTab.tsx` | Component | ✅ ENHANCED |

#### New Documentation
- `NOTIFICATION_TESTING_GUIDE.md` - Testing notification system
- `TEST_NOTIFICATIONS_QUICK_START.md` - Quick reference for testing
- `VERSIONING_GUIDE.md` - Version management strategy
- `VERSION_RELEASE_QUICK_REF.md` - Release quick reference

### 🔧 Technical Improvements
- Enhanced error handling across all services
- Improved data validation in survey processing
- Optimized database queries with better indexing
- Better logging and monitoring for production
- Complete TypeScript type safety

### 📚 Breaking Changes
None - v1.0.2 is fully backward compatible with v1.0.0

### 🐛 Bug Fixes
- Fixed profile picture handling in authentication
- Improved OTP retry logic and timing
- Enhanced notification delivery reliability

### 📦 Dependencies Updated
- Core dependencies remain stable (React 18.2.0, Express 4.x, PostgreSQL 12+)
- Added notification delivery libraries
- Enhanced email service capabilities

### 🚀 Migration Path
Users upgrading from v1.0.0 to v1.0.2:
1. Automatic database migrations run on startup
2. New OTP tables created automatically
3. Survey templates pre-populated from seed script
4. Existing user data fully preserved

---

## Usage Guide

### Starting a New Survey

1. Navigate to `http://localhost:3000`
2. Click **"Start New Survey"**
3. Allow GPS permission when prompted
4. Review auto-captured coordinates
5. Complete all 9 sections (use **Next / Previous** to navigate)
6. Submit — a confirmation message will appear on success

### Using Custom Surveys

1. Go to **"Surveys Management"** from the admin panel
2. Click **"Create New Survey Template"**
3. Use the **Survey Builder** to add custom questions
4. Configure field types (text, dropdown, date, etc.)
5. Save the template
6. Enumerators can now use this template instead of the standard survey

### Managing Notifications

1. Click the **🔔 bell icon** in the navigation bar
2. View all recent notifications in the panel
3. Click a notification to view full details
4. Notifications auto-clear after 7 days or can be manually dismissed
5. Go to **Account Settings → Notification Preferences** to configure alerts

### Checking for App Updates

1. Go to **Settings** or **Profile → General Settings**
2. The system automatically checks for new versions daily
3. When an update is available:
   - You'll see an **"Update Available"** notification
   - Click the update prompt or visit Settings to review changes
   - Download and install the new version

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

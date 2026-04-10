# Deployment Guide

Complete guide for deploying GeoWaste Kilifi to production environments.

## Local Development Setup

See [QUICKSTART.md](./QUICKSTART.md) for local development.

## Docker Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM available

### One-Command Deployment

```bash
docker-compose up -d
```

Access the app:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:5000
- **Database**: localhost:5432

### Stop Services

```bash
docker-compose down
```

### Rebuild Images

```bash
docker-compose up -d --build
```

## Azure Deployment (App Service + PostgreSQL)

### Prerequisites

- Azure subscription
- Azure CLI installed
- Resource Group created

### Step 1: Create PostgreSQL Server

```bash
# Create resource group
az group create --name geowaste-rg --location eastus

# Create PostgreSQL server
az postgres server create \
  --resource-group geowaste-rg \
  --name geowaste-db \
  --admin-user postgres \
  --admin-password <your-password> \
  --sku-name B_Gen5_1 \
  --storage-size 51200

# Enable PostGIS extension
az postgres server configuration set \
  --resource-group geowaste-rg \
  --server-name geowaste-db \
  --name shared_preload_libraries \
  --value "uuid-ossp,postgis"
```

### Step 2: Deploy Backend (App Service)

```bash
# Create App Service Plan
az appservice plan create \
  --name geowaste-plan \
  --resource-group geowaste-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group geowaste-rg \
  --plan geowaste-plan \
  --name geowaste-api \
  --runtime "node|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --resource-group geowaste-rg \
  --name geowaste-api \
  --settings \
    NODE_ENV=production \
    DB_HOST=geowaste-db.postgres.database.azure.com \
    DB_USER=postgres \
    DB_PASSWORD=<your-password> \
    DB_NAME=geowaste_kilifi \
    CORS_ORIGIN=https://geowaste.azurewebsites.net
```

### Step 3: Deploy Frontend (Static Web Apps)

```bash
# Create Static Web App
az staticwebapp create \
  --name geowaste-app \
  --resource-group geowaste-rg \
  --source https://github.com/your-repo \
  --branch main \
  --app-location "frontend" \
  --output-location "build"
```

## Heroku Deployment

### Backend

```bash
# Login to Heroku
heroku login

# Create app
heroku create geowaste-api

# Add PostgreSQL add-on
heroku addons:create heroku-postgresql:hobby-dev --app geowaste-api

# Enable PostGIS
heroku apps:info --app geowaste-api  # Get Postgres URL
# Deploy code
git push heroku main

# Run database migrations
heroku run "npm run db:init" --app geowaste-api
```

### Frontend (Netlify)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod --dir=build
```

## Environment Variables

### Backend Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=geowaste_kilifi
DB_USER=postgres
DB_PASSWORD=strong-password
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Production

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_MAP_CENTER_LAT=-3.2869
REACT_APP_MAP_CENTER_LNG=39.6568
REACT_APP_MAP_ZOOM=13
```

## SSL/TLS Certificates

### Let's Encrypt + Nginx

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Create certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

## Database Backup Strategy

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/geowaste"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### Azure Backup

```bash
# Enable automatic backups on Azure PostgreSQL
az postgres server update \
  --resource-group geowaste-rg \
  --name geowaste-db \
  --backup-retention 35
```

## Monitoring & Logging

### Application Insights (Azure)

```bash
az monitor app-insights component create \
  --app geowaste-insights \
  --location eastus \
  --resource-group geowaste-rg
```

### ELK Stack (Self-hosted)

Configure backend logging to send to Elasticsearch:

```typescript
// In backend/src/index.ts
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
});
```

## Performance Optimization

### Frontend

```bash
# Enable gzip compression in nginx
gzip on;
gzip_types text/plain application/json application/javascript;

# Serve from CDN
# Set Cache-Control headers for static assets
```

### Backend

```bash
# Use Redis for caching (optional)
npm install redis

# Enable query connection pooling
# Max connections configured in db.ts
```

## Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Set strong database password
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring & alerts
- [ ] Enable database encryption
- [ ] Use VPN/Private endpoints
- [ ] Enable audit logging

## Troubleshooting Deployment

### Backend not connecting to database

```bash
# Check database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check network security groups (Azure)
az network nsg rule list --resource-group geowaste-rg
```

### Frontend not connecting to API

```bash
# Check CORS settings
curl -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:5000/api/health

# Check API URL in frontend .env
```

### Database schema not initialized

```bash
# Manually run schema initialization
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema.sql
```

---

See [README.md](./README.md) for more information.

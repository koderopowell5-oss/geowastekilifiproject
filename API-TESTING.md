# API Testing Guide

Quick reference for testing the GeoWaste Kilifi API endpoints.

## Testing Tools

- **cURL** (command line)
- **Postman** (GUI)
- **REST Client** (VS Code extension)

## Base URL

```
http://localhost:5000/api
```

## Test Examples

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected:**200 OK

### 2. Create Waste Site (POST /waste)

```bash
curl -X POST http://localhost:5000/api/waste \
  -H "Content-Type: application/json" \
  -d '{
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
    "impacts": ["Bad odour"],
    "nearby_features": ["River/stream"],
    "recommended_distance": "500m-1km",
    "preferred_location": ["Far from settlements"],
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
    "challenges": "Poor accessibility",
    "suggested_location": "Industrial area"
  }'
```

**Expected:**  201 Created

### 3. Get All Records (GET /waste)

```bash
curl "http://localhost:5000/api/waste?limit=10&offset=0"
```

**Expected:**  200 OK

### 4. Get Single Record (GET /waste/:id)

```bash
curl http://localhost:5000/api/waste/1
```

**Expected:**  200 OK (if record exists) or 404 (if not found)

### 5. Get Statistics (GET /waste/stats/summary)

```bash
curl http://localhost:5000/api/waste/stats/summary
```

**Expected:**  200 OK

### 6. Get Records by Geographic Bounds

```bash
curl "http://localhost:5000/api/waste/bounds/-3.3/-3.2/39.5/39.7"
```

**Expected:**  200 OK

## Postman Collection

Save this as `GeoWaste.postman_collection.json`:

```json
{
  "info": {
    "name": "GeoWaste Kilifi API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:5000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Create Record",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:5000/api/waste",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "waste"]
        },
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{...}"
        }
      }
    }
  ]
}
```

## Test Scripts

### JavaScript/Node.js

```javascript
// test.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    // Test health
    const health = await axios.get(`${API_URL}/health`);
    console.log(' Health:', health.data);

    // Test create
    const created = await axios.post(`${API_URL}/waste`, {
      latitude: -3.2869,
      longitude: 39.6568,
      ward: 'Tezo',
      settlement_type: 'Formal',
      household_size: '4-6',
      waste_types: ['Organic'],
      waste_quantity: '3-5kg',
      waste_separation: true,
      // ... other fields
    });
    console.log(' Created:', created.data.data.id);

    // Test get all
    const all = await axios.get(`${API_URL}/waste`);
    console.log(' Total records:', all.data.data.pagination.total);

    // Test get one
    const one = await axios.get(`${API_URL}/waste/1`);
    console.log(' Record 1:', one.data.data.ward);

    // Test stats
    const stats = await axios.get(`${API_URL}/waste/stats/summary`);
    console.log(' Statistics:', stats.data.data);
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

runTests();
```

Run with:
```bash
node test.js
```

### Shell Script

```bash
#!/bin/bash
# test.sh

API="http://localhost:5000/api"

echo "🧪 Testing GeoWaste API..."

# Health
echo "1. Health Check..."
curl -s $API/health | jq .

# Stats
echo "2. Get Statistics..."
curl -s $API/waste/stats/summary | jq .

# Create
echo "3. Create Record..."
curl -s -X POST $API/waste \
  -H "Content-Type: application/json" \
  -d '{"latitude":-3.2869,"longitude":39.6568,...}' | jq .

# Get All
echo "4. Get All Records..."
curl -s "$API/waste?limit=5" | jq .

echo " All tests completed"
```

Run with:
```bash
chmod +x test.sh
./test.sh
```

## Error Testing

### Missing Required Fields

```bash
curl -X POST http://localhost:5000/api/waste \
  -H "Content-Type: application/json" \
  -d '{"lat": -3.2869}'
```

Expected: 400 Bad Request

```json
{
  "success": false,
  "message": "Missing required fields",
  "error": "latitude, longitude, ward, settlement_type, and household_size are required"
}
```

### Invalid ID

```bash
curl http://localhost:5000/api/waste/invalid
```

Expected: 400 Bad Request

### Not Found

```bash
curl http://localhost:5000/api/waste/99999
```

Expected: 404 Not Found

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install: apt-get install apache2-utils

# Single request
ab -n 100 -c 10 http://localhost:5000/api/health

# POST request
ab -n 100 -c 10 -p data.json -T application/json http://localhost:5000/api/waste
```

### Load Testing with AutoCannon (Node.js)

```bash
npx autocannon http://localhost:5000/api/waste
```

## Debugging

### Enable verbose curl output

```bash
curl -v http://localhost:5000/api/health
```

### Check network with grep_search

```bash
# Install Wireshark or tcpdump
tcpdump -i lo 'tcp port 5000'
```

### Backend logs

```bash
# View backend terminal for request logs
tail -f backend/logs/*.log
```

---

See [README.md](./README.md) for more information.

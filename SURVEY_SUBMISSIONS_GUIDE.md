# Survey Submissions Integration Guide

## System Overview

This guide verifies that survey submissions are properly saved to the database and can be fetched by the admin dashboard with full project context.

## Database Schema

### survey_submissions Table
```sql
CREATE TABLE survey_submissions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id),
  latitude NUMERIC,
  longitude NUMERIC,
  geom GEOMETRY(POINT, 4326),
  enumerator_email VARCHAR(255),
  enumerator_name VARCHAR(255),
  response_data JSONB,            -- Dynamic form responses
  is_draft BOOLEAN DEFAULT false,
  status VARCHAR(50),             -- 'draft' or 'submitted'
  flag_reason TEXT,
  project_id UUID REFERENCES projects(id),  -- ← Tracks which project
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX: idx_survey_submissions_project_id
);
```

## API Endpoints

### 1. Submit Survey Response
**POST** `/api/surveys/:id/submit`

**Required Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "responseData": {
    "ward": "Malindi",
    "settlement_type": "Urban",
    "waste_types": ["Organic", "Plastic"],
    "disposal_method": "Landfill",
    "household_size": 5
  },
  "latitude": -3.2667,
  "longitude": 40.1333,
  "isDraft": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "data": {
    "id": 123,
    "survey_id": 45,
    "response_data": { "ward": "Malindi", ... },
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "submitted",
    "created_at": "2026-05-18T10:30:00Z"
  }
}
```

**Key Points:**
- `project_id` is extracted from auth token (`req.user.primary_project_id`)
- `response_data` stores arbitrary JSON from dynamic form
- Both draft and submitted responses are saved

### 2. Fetch Survey Submissions
**GET** `/api/surveys/:id/submissions`

**Required Headers:**
- `Authorization: Bearer {adminToken}`
- Must be admin to fetch submissions

**Query Params (optional):**
- `status=draft|submitted`
- `enumeratorEmail=user@example.com`

**Response:**
```json
{
  "success": true,
  "message": "Submissions retrieved successfully",
  "data": [
    {
      "id": 123,
      "survey_id": 45,
      "response_data": { "ward": "Malindi", ... },
      "project_id": "550e8400-e29b-41d4-a716-446655440000",
      "enumerator_email": "enum@geowaste.com",
      "status": "submitted",
      "latitude": -3.2667,
      "longitude": 40.1333,
      "created_at": "2026-05-18T10:30:00Z"
    }
  ]
}
```

### 3. Fetch Shared Forms for Project
**GET** `/api/projects/:id/shared-forms`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "name": "Waste Collection Survey",
      "description": "...",
      "form_config": { "sections": [...] },
      "created_by": 12
    }
  ]
}
```

## Frontend Data Flow

### AdminDashboard.tsx
```typescript
// 1. Fetch shared forms for current project
const forms = await getSharedForms(currentProjectId);

// 2. Fetch submissions for each form
const submissions = await Promise.all(
  forms.map(f => getSurveySubmissions(f.id))
);

// 3. Filter to only project submissions (client-side safety check)
const projectSubmissions = submissions
  .flat()
  .filter(s => String(s.project_id) === String(currentProjectId));

// 4. Map submissions to chart-ready records
const mappedRecords = projectSubmissions.map(submission => ({
  id: submission.id,
  ward: submission.response_data?.ward,
  waste_types: submission.response_data?.waste_types,
  disposal_method: submission.response_data?.disposal_method,
  latitude: submission.latitude,
  longitude: submission.longitude,
  created_at: submission.created_at
}));

// 5. Analyze and render charts
const { wasteByType, disposalMethods, wardDistribution } = analyzeData(mappedRecords);
```

## Testing the Flow

### Quick Manual Test

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **Login to Get Token**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geowaste.com","password":"admin123"}'
```

3. **Submit a Survey**
```bash
curl -X POST http://localhost:3000/api/surveys/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseData": {"ward":"Malindi","waste_types":["Plastic"]},
    "latitude": -3.2667,
    "longitude": 40.1333,
    "isDraft": false
  }'
```

4. **Fetch Submissions**
```bash
curl -X GET http://localhost:3000/api/surveys/1/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

5. **Check Database**
```bash
psql -h localhost -U geowaste -d geowaste_kilifi -c \
  "SELECT id, project_id, status, response_data->>'ward' as ward FROM survey_submissions LIMIT 5;"
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] POST `/surveys/:id/submit` returns 201 with project_id
- [ ] Database shows project_id in survey_submissions rows
- [ ] GET `/surveys/:id/submissions` returns entries with project_id
- [ ] AdminDashboard filters submissions by currentProjectId
- [ ] Charts render with real submission data (no fallback/mock)
- [ ] Charts update when different project selected
- [ ] Draft submissions saved and fetchable
- [ ] Geolocation (latitude/longitude) preserved
- [ ] response_data JSON preserved as-is

## Troubleshooting

### Submissions not saving
- Check `survey_submissions` table exists and has `project_id` column
- Verify auth token includes `primary_project_id`
- Check backend logs for SQL errors

### Project ID is NULL
- Ensure user has `primary_project_id` set in auth token
- Check `migration_014` was applied to add project_id column
- Verify `submitSurveyResponse()` includes `project_id` parameter

### AdminDashboard shows no data
- Verify submissions exist: `SELECT COUNT(*) FROM survey_submissions WHERE project_id = 'YOUR_PROJECT_ID'`
- Check filter logic in AdminDashboard.tsx matches projects
- Ensure `getSurveySubmissions()` is returning data with project_id

### Response data not preserved
- Verify form data is passed as `responseData` in request
- Check JSON serialization in backend
- Inspect `response_data` column directly in database

## Code References

- **Backend submission logic**: `backend/src/surveyService.ts` → `submitSurveyResponse()`
- **Backend routes**: `backend/src/routes.ts` → `/surveys/:id/submit` and `/surveys/:id/submissions`
- **Frontend submission**: `frontend/src/components/DynamicSurveyForm.tsx` → `handleSubmit()`
- **Frontend fetch**: `frontend/src/services/wasteApi.ts` → `getSurveySubmissions()`
- **Admin dashboard**: `frontend/src/components/AdminDashboard.tsx` → data fetching and filtering
- **Database migrations**: `database/migration_014_add_project_id_to_surveys_and_survey_submissions.sql`

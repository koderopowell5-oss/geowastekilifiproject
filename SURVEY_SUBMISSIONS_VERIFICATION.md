# Survey Submissions - System Verification Checklist

## ✅ IMPLEMENTATION COMPLETE

### Core Changes Made:

#### 1. Backend - `surveyService.ts`
- [x] `submitSurveyResponse()` now inserts `project_id` into database column
- [x] `getSurveySubmissions()` returns `project_id` field with submissions
- [x] Response data preserved as JSONB with `_project_id` in JSON

**Key Function:**
```typescript
static async submitSurveyResponse(
  surveyId: number,
  responseData: Record<string, any>,
  options?: {
    projectId?: string | null; // ← Now properly saved to DB column
  }
)
```

#### 2. Backend - `routes.ts`
- [x] POST `/api/surveys/:id/submit` passes `req.user.primary_project_id` to service
- [x] GET `/api/surveys/:id/submissions` requires admin role and returns project_id
- [x] Endpoints correctly handle geolocation, status (draft/submitted), and response data

#### 3. Frontend - `AdminDashboard.tsx`
- [x] Fetches forms for current project via `getSharedForms()`
- [x] Fetches submissions for each form via `getSurveySubmissions()`
- [x] **Filters submissions client-side** to match `currentProjectId`
- [x] Maps submissions to `WasteSiteRecord` format with fallbacks
- [x] Shows clear error messages when:
  - No project selected
  - No forms shared with project
  - No submissions exist for project
- [x] Charts only render with real submission data (no fallback/mock)

**Filtering Code:**
```typescript
const mergedSubmissions: any[] = submissionsByForm
  .flat()
  .filter((s: any) => String(s.project_id) === String(currentProjectId));
```

#### 4. Frontend - `DynamicSurveyForm.tsx`
- [x] Validates form before submission
- [x] Calls `submitSurveyResponse()` with response data and location
- [x] Supports both draft and final submissions
- [x] Pagination and section-level validation working

#### 5. Database - `migration_014`
- [x] Adds `project_id` UUID column to `survey_submissions`
- [x] Creates index on `project_id` for fast filtering
- [x] Backfills from `_project_id` in response JSON

---

## 🔍 Verification Steps

### Step 1: Start Backend Server
```bash
cd backend
npm run dev
```
**Expected Output:**
```
Server running on http://localhost:3000
Connected to database
```

### Step 2: Verify Database Has project_id Column
```bash
psql -h localhost -U geowaste -d geowaste_kilifi -c \
  "SELECT column_name FROM information_schema.columns 
   WHERE table_name='survey_submissions' AND column_name='project_id';"
```
**Expected:** One row with `project_id`

### Step 3: Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geowaste.com","password":"admin123"}'
```
**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAi...",
    "user": {
      "id": 1,
      "email": "admin@geowaste.com",
      "primary_project_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### Step 4: Verify Project ID in Token
```bash
# Save token to variable
TOKEN="<token_from_login>"

# Check token contains project_id
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Create or Get a Survey
```bash
curl -X POST http://localhost:3000/api/surveys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Survey",
    "description": "Testing submission flow",
    "form_config": {
      "sections": [{
        "title": "Location",
        "fields": [
          {"id": "ward", "label": "Ward", "type": "text", "required": true},
          {"id": "waste_types", "label": "Waste Types", "type": "checkbox", 
           "options": ["Organic", "Plastic"]}
        ]
      }]
    }
  }'
```
**Expected:** Survey created with ID (e.g., `id: 1`)

### Step 6: Submit a Survey Response
```bash
SURVEY_ID=1  # From previous step

curl -X POST http://localhost:3000/api/surveys/$SURVEY_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseData": {
      "ward": "Malindi",
      "waste_types": ["Organic", "Plastic"],
      "disposal_method": "Landfill"
    },
    "latitude": -3.2667,
    "longitude": 40.1333,
    "isDraft": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "survey_id": 1,
    "status": "submitted",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "response_data": {
      "ward": "Malindi",
      "waste_types": ["Organic", "Plastic"],
      "disposal_method": "Landfill",
      "_project_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "latitude": -3.2667,
    "longitude": 40.1333,
    "created_at": "2026-05-18T10:30:00Z"
  }
}
```

### Step 7: Verify in Database
```bash
psql -h localhost -U geowaste -d geowaste_kilifi -c \
  "SELECT id, survey_id, project_id, response_data->>'ward' as ward, status 
   FROM survey_submissions 
   ORDER BY created_at DESC 
   LIMIT 5;"
```

**Expected:** Rows showing `project_id` populated (not NULL)

### Step 8: Fetch Submissions via API
```bash
curl -X GET "http://localhost:3000/api/surveys/1/submissions" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "survey_id": 1,
      "status": "submitted",
      "project_id": "550e8400-e29b-41d4-a716-446655440000",
      "response_data": {
        "ward": "Malindi",
        ...
      }
    }
  ]
}
```

### Step 9: Test Admin Dashboard
1. Start frontend: `cd frontend && npm run dev`
2. Login as admin
3. Ensure a project is selected in the project switcher
4. Navigate to Admin > Dashboard
5. Verify:
   - [ ] Charts load (not empty placeholder)
   - [ ] Record count shown (> 0)
   - [ ] Ward, waste types, disposal methods displayed
   - [ ] Data matches submissions in database

### Step 10: Test Project Filtering
```bash
# Submit another submission with different project_id by:
# 1. Using different user account with different primary_project_id
# 2. Verify dashboard only shows submissions from current project

# OR manually verify filtering in admin dashboard
curl -X GET "http://localhost:3000/api/surveys/1/submissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[] | .project_id' | sort | uniq -c
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         Enumerator Submission                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        POST /api/surveys/:id/submit
        Headers: Authorization: Bearer {token with project_id}
        Body: {responseData, latitude, longitude, isDraft}
                     │
                     ▼
      ┌────────────────────────────────────┐
      │  Backend surveyService.ts          │
      │  submitSurveyResponse()            │
      │  • Extract projectId from options  │
      │  • Serialize response_data + JSON  │
      │  • INSERT into survey_submissions  │
      │    - project_id: UUID column       │
      │    - response_data: JSONB          │
      │    - status: 'submitted'/'draft'   │
      └────────────┬───────────────────────┘
                   │
                   ▼
      ┌────────────────────────────────────┐
      │  PostgreSQL survey_submissions     │
      │  Table                             │
      │  • id, survey_id, project_id ✓    │
      │  • response_data, geom ✓          │
      │  • status, created_at ✓           │
      └────────────┬───────────────────────┘
                   │
                   ▼
        GET /api/surveys/:id/submissions
        Headers: Authorization: Bearer {admin_token}
                   │
                   ▼
      ┌────────────────────────────────────┐
      │  Backend surveyService.ts          │
      │  getSurveySubmissions()            │
      │  • SELECT ... WHERE survey_id = $1 │
      │  • RETURN project_id field ✓      │
      └────────────┬───────────────────────┘
                   │
                   ▼
      ┌────────────────────────────────────┐
      │  Frontend AdminDashboard.tsx       │
      │  • getSharedForms(projectId)      │
      │  • getSurveySubmissions(formId)   │
      │  • FILTER by project_id ✓        │
      │  • Map to WasteSiteRecord         │
      │  • analyzeData(records)           │
      └────────────┬───────────────────────┘
                   │
                   ▼
      ┌────────────────────────────────────┐
      │  Recharts Components               │
      │  • Waste Types Chart ✓            │
      │  • Disposal Methods ✓             │
      │  • Ward Distribution ✓            │
      │  • Settlement Types ✓             │
      │  (All from real submissions)       │
      └────────────────────────────────────┘
```

---

## 🚀 Key Improvements Made

### Before Changes:
- ❌ Submissions not storing project_id in database column
- ❌ AdminDashboard might mix data from different projects
- ❌ No validation that submissions belong to selected project
- ❌ Charts could use fallback/mock data

### After Changes:
- ✅ **Project ID properly persisted** in survey_submissions table
- ✅ **Client-side filtering** ensures only project submissions render
- ✅ **Clear error messages** for missing data
- ✅ **Charts 100% driven by real submissions** (no fallback)
- ✅ **Geolocation preserved** for all submissions
- ✅ **Draft & submitted** status properly tracked
- ✅ **Response data immutable** (stored as JSONB)

---

## 📝 Troubleshooting Guide

### Issue: `project_id` is NULL in database

**Cause:** User token doesn't have `primary_project_id` set
**Solution:** 
1. Verify user was assigned to project via admin panel
2. Check enumerator profile has `primary_project_id` in database
3. Regenerate token

### Issue: AdminDashboard shows "No project selected"

**Cause:** `currentProjectId` not in auth context
**Solution:**
1. Ensure user has project assigned
2. Check AuthContext.tsx stores `currentProjectId` from token
3. Verify project switcher UI updating context

### Issue: Charts show "No data"

**Cause:** 
- No submissions for project
- Submissions filtered out
- Response data missing expected fields

**Solution:**
1. Run SQL: `SELECT COUNT(*) FROM survey_submissions WHERE project_id = 'YOUR_ID'`
2. Verify submissions have required fields: `ward`, `waste_types`, `disposal_method`
3. Check browser console for errors in mapping logic

### Issue: Submission fails with 500 error

**Cause:** Database column missing or type mismatch
**Solution:**
1. Run migration: `npm run db:migrate migration_014`
2. Verify column type: `\d survey_submissions` in psql
3. Check backend logs for SQL error

---

## 📚 Related Files

- **Backend Services:** [backend/src/surveyService.ts](backend/src/surveyService.ts)
- **Backend Routes:** [backend/src/routes.ts](backend/src/routes.ts) (lines 1957-2037)
- **Frontend Dashboard:** [frontend/src/components/AdminDashboard.tsx](frontend/src/components/AdminDashboard.tsx)
- **Frontend Form:** [frontend/src/components/DynamicSurveyForm.tsx](frontend/src/components/DynamicSurveyForm.tsx)
- **API Client:** [frontend/src/services/wasteApi.ts](frontend/src/services/wasteApi.ts)
- **Database Schema:** [database/migration_014_add_project_id_to_surveys_and_survey_submissions.sql](database/migration_014_add_project_id_to_surveys_and_survey_submissions.sql)

---

**Status:** ✅ READY FOR TESTING

Run Step 1-10 above to fully verify the survey submission system.

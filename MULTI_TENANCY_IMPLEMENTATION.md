# Multi-Tenancy Architecture - Implementation Summary

## ✅ PHASE 1: BACKEND INFRASTRUCTURE (COMPLETE)

### What Was Done
1. **Created ProjectService** (`backend/src/projectService.ts`)
   - 12 comprehensive methods for managing projects, roles, permissions, invitations, and form sharing
   - Handles both numeric (from enumerators.id) and string (from projects.id) identifiers
   - All methods include proper error handling and logging

2. **Added 10 API Routes** (`backend/src/routes.ts`)
   - `POST /api/projects` - Create new project (admin auto-assigned)
   - `GET /api/projects` - List user's projects with roles
   - `GET /api/projects/:id` - Get project details
   - `GET /api/projects/:id/enumerators` - List team members (manage_team permission required)
   - `POST /api/projects/:id/invite` - Invite enumerator (manage_team permission required)
   - `POST /api/projects/invite/:code/accept` - Accept invitation
   - `GET /api/projects/pending-invites` - Get pending invites for user's email
   - `POST /api/projects/:id/forms/:formId/share` - Share form/waste site (share_forms permission required)
   - `GET /api/projects/:id/shared-forms` - Get forms shared with user
   - `POST /api/auth/switch-project` - Change active project

3. **Updated Authentication Endpoints**
   - `POST /api/auth/login` - Now returns: `{ user, projects[], current_project_id }`
   - `POST /api/auth/otp/verify` - Accepts optional `project_id` and `role_id`; auto-creates default project if not provided

4. **Database Migration Applied** (`database/migration_010_multi_tenancy.sql`)
   - ✅ **Projects table**: UUID id, name, description, admin_id (FK), timestamps
   - ✅ **Roles table**: 3 default roles with JSONB permissions
     - `admin`: Full access (submit, view, edit, manage_team, share_forms, delete)
     - `supervisor`: Team oversight (submit, view_aggregate, share_forms)
     - `data_collector`: Basic submission only
   - ✅ **Enumerator_roles table**: Junction table with composite PK
   - ✅ **Form_sharing table**: Share waste_sites with specific enumerators
   - ✅ **Project_invites table**: Invitation codes that expire and can be accepted
   - ✅ **Column additions**:
     - `enumerators.primary_project_id` (UUID FK)
     - `waste_sites.project_id` (UUID FK)
     - `waste_site_drafts.project_id` (UUID FK)
   - ✅ **Helper functions**: grant_enumerator_project_access(), share_form_with_enumerator()

### Build Status
- ✅ Backend: Compiles with ZERO TypeScript errors
- ✅ Frontend: Compiles successfully (only minor ESLint warnings about unused variables)
- ✅ Database: All migrations applied successfully in production

### Git Commits
- **0f97d4b**: feat: Multi-tenancy backend infrastructure with projects, roles, and permissions
- **5a44409**: fix: Correct multi-tenancy migration schema for actual database structure

---

## 📋 PHASE 2: FRONTEND IMPLEMENTATION (NEXT)

### Overview
The frontend needs to be redesigned to:
1. Allow users to work with multiple projects
2. Show projects on login/signup
3. Enable project switching
4. Enforce role-based permissions on UI elements
5. Isolate data per project in local storage

### Components to Create

#### 1. ProjectSwitcher Component
**File:** `frontend/src/components/ProjectSwitcher.tsx`
**Purpose:** Dropdown/modal to switch between projects
**Features:**
- Display current project name
- List all user's projects with their roles
- Click to switch project (calls `POST /api/auth/switch-project`)
- Update local state with new current_project_id
- Re-fetch project-scoped data after switch

**Implementation Strategy:**
```typescript
interface ProjectSwitcherProps {
  projects: EnumeratorProject[];
  currentProjectId: string | null;
  onProjectChange: (projectId: string) => void;
}
```

#### 2. ProjectSetup Wizard Component
**File:** `frontend/src/components/ProjectSetup.tsx`
**Purpose:** Multi-step wizard during signup to select/create project
**Steps:**
1. **Choose Project Action**: "Create New" or "Join Existing"
2. **If Create New**: 
   - Input project name and description
   - Auto-assign current user as admin
3. **If Join Existing**:
   - Show pending invitations from database
   - Let user select which project to join
4. **Confirmation**: Show selected project and role

**Integration Points:**
- Call before step 2 in SignupPage (after form details, before OTP)
- Pass `project_id` and `role_id` to OTP verification

#### 3. PermissionGate Component
**File:** `frontend/src/components/PermissionGate.tsx`
**Purpose:** Conditionally render UI elements based on role permissions
**Features:**
```typescript
interface PermissionGateProps {
  permission: string; // e.g., 'submit_data', 'manage_team'
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Usage:
<PermissionGate permission="manage_team">
  <InviteTeamButton />
</PermissionGate>

<PermissionGate permission="view_aggregate" fallback={<NoAccessMessage />}>
  <AggregateDataView />
</PermissionGate>
```

#### 4. Updated SignupPage Component
**File:** `frontend/src/pages/SignupPage.tsx`
**Changes:**
- Add project selection as Step 0 (before user details)
- Integrate ProjectSetup wizard
- Pass `project_id` to OTP request
- Store `project_id` in SignupData state
- Pass `project_id` and `role_id` to OTP verification endpoint
- Handle response that includes projects array

### Type Definitions to Add

Add to `frontend/src/types/types.ts`:
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  admin_id: number;
  created_at: string;
  updated_at: string;
}

interface EnumeratorProject {
  project: Project;
  role: Role;
  permissions: string[];
}

interface Role {
  id: number;
  name: 'admin' | 'supervisor' | 'data_collector';
  description: string;
  permissions: string[];
}

interface ProjectInvite {
  id: string;
  project_id: string;
  email: string;
  role_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
}
```

### State/Context Management

Consider adding to AppContext or Auth context:
```typescript
{
  currentProjectId: string | null;
  projects: EnumeratorProject[];
  currentProjectPermissions: string[];
  switchProject: (projectId: string) => Promise<void>;
}
```

### LocalStorage Restructuring

Current structure:
```javascript
{
  auth: { user, token },
  forms: { ... },
  submissions: { ... }
}
```

New structure (per-project isolation):
```javascript
{
  auth: { user, token },
  currentProjectId: "project-uuid",
  projects: {
    "project-uuid-1": {
      name: "Project 1",
      role: "admin",
      permissions: [...],
      forms: { "form-1": {...} },
      submissions: { "submission-1": {...} },
      drafts: { "draft-1": {...} }
    },
    "project-uuid-2": { ... }
  }
}
```

### API Integration Points

Update these services to accept project context:

1. **buildApiUrl()** enhancement
   - Option: Pass `projectId` to append as query param
   - Or: Create new `buildProjectApiUrl(endpoint, projectId)`

2. **wasteApi.ts** - All endpoints need project_id
   - GET forms: `/api/projects/:id/shared-forms`
   - POST submission: Include `project_id` in request body
   - GET submissions: Filter by `project_id`

3. **Authentication flow**
   - After login: Store projects array and current_project_id
   - During signup: Get selected project from ProjectSetup
   - After signup success: Redirect to project's data entry page

---

## 🔧 PHASE 3: BACKEND API UPDATES (AFTER FRONTEND)

These endpoint updates are needed once frontend starts sending project context:

### Endpoints to Modify
1. `POST /api/waste` - Add `project_id` requirement
2. `GET /api/forms/blank` - Filter by `project_id` + user permissions
3. `GET /api/submissions` - Filter by `project_id`
4. `GET /api/waste` - Filter by `project_id`

### Middleware to Add
- Add `projectIdMiddleware` to verify user has access to requested project
- Add permission checking before sensitive operations

---

## 🗂️ DATA MIGRATION

Once everything is deployed, need to run:

```sql
-- Assign all existing enumerators to a default project
WITH default_proj AS (
  SELECT id FROM projects ORDER BY created_at LIMIT 1
)
INSERT INTO enumerator_roles (enumerator_id, project_id, role_id)
SELECT e.id, (SELECT id FROM default_proj), 3 -- role_id 3 = data_collector
FROM enumerators e
WHERE e.id NOT IN (
  SELECT enumerator_id FROM enumerator_roles
)
ON CONFLICT DO NOTHING;

-- Assign all existing waste_sites to default project
UPDATE waste_sites SET project_id = (SELECT id FROM projects ORDER BY created_at LIMIT 1)
WHERE project_id IS NULL;

UPDATE waste_site_drafts SET project_id = (SELECT id FROM projects ORDER BY created_at LIMIT 1)
WHERE project_id IS NULL;
```

---

## ✅ DEPLOYMENT CHECKLIST

- [x] Backend code implemented (ProjectService, routes, types)
- [x] Backend compiles without errors
- [x] Database migration created and applied
- [x] Git commits pushed to GitHub
- [x] Production Render deployment triggered
- [ ] Frontend ProjectSwitcher component created
- [ ] Frontend ProjectSetup wizard created
- [ ] Frontend PermissionGate component created
- [ ] SignupPage updated with project selection
- [ ] API client updated to include project context
- [ ] LocalStorage restructured per project
- [ ] Login/logout to handle project state
- [ ] Data migration job run
- [ ] Test multi-project workflows
- [ ] Update user documentation

---

## 📊 ARCHITECTURE SUMMARY

### Multi-Tenancy Model: Project-Based Isolation

```
User Account (enumerators table)
  ↓ (can belong to multiple)
Projects (one workspace per project)
  ├── Enumerators (with roles: admin, supervisor, data_collector)
  ├── Forms/Waste Sites (isolated per project)
  ├── Submissions (isolated per project)
  └── Permissions (role-based access control)
```

### Permission Model

| Action | Admin | Supervisor | Data Collector |
|--------|-------|-----------|-----------------|
| Submit Data | ✅ | ✅ | ✅ |
| View Own Submissions | ✅ | ✅ | ✅ |
| View All Submissions | ✅ | ✅ | ❌ |
| View Aggregate Data | ✅ | ✅ | ❌ |
| Edit Forms | ✅ | ❌ | ❌ |
| Manage Team | ✅ | ❌ | ❌ |
| Share Forms | ✅ | ✅ | ❌ |
| Delete Submissions | ✅ | ❌ | ❌ |

### Invitation Flow

1. Team Lead invites enumerator via `POST /api/projects/:id/invite` (sends email - TODO)
2. Email contains link with invite code: `/accept-invite/{code}`
3. Enumerator clicks link and calls `POST /api/projects/invite/:code/accept`
4. System verifies code hasn't expired and enumerator is registered
5. Access granted, user added to project with specified role

---

## 🚀 IMMEDIATE NEXT STEPS

1. Create ProjectSwitcher component and integrate into dashboard
2. Create ProjectSetup wizard component
3. Create PermissionGate component
4. Update SignupPage with project selection step
5. Update API calls to include project context
6. Test full signup-to-data-entry flow with project selection
7. Run data migration for existing users


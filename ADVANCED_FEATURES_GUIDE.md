# GeoWaste Kilifi - Advanced Features Implementation Guide

## Overview

This document outlines the 10 advanced features being added to GeoWaste Kilifi. Each feature is organized by implementation phase for systematic rollout.

---

## Phase 1: Foundation (Weeks 1-2)

### 1. Role-Based Access Control (RBAC)
**Status:** Schema Ready | Backend Pending | Frontend Pending

**What's Done:**
- ✅ Database schema updated with `role` column and `permissions` JSONB field
- ✅ Default permissions set for Admin, Supervisor, and Enumerator roles
- ✅ Type definitions created (`UserRole` interface)

**What's Needed:**
1. **Backend Routes & Middleware**
   - Create authentication middleware to check permissions
   - Add role-based route protection
   - Implement permission validation on all endpoints

2. **Frontend Components**
   - Update Dashboard to show role-specific data
   - Hide/show features based on user role
   - Restrict navigation based on permissions

**Database Tables Used:**
- `enumerators` (role, permissions columns)

---

### 2. Email Notifications (Google SMTP)
**Status:** Service Ready | Backend Integration Pending | Notifications DB Ready

**What's Done:**
- ✅ `emailService.ts` created with Google SMTP integration
- ✅ Pre-built email templates for: assignments, flags, comments, approvals
- ✅ Notifications table in database
- ✅ Type definitions created

**What's Needed:**
1. **Environment Setup**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

2. **Backend Integration**
   - Integrate emailService into routes
   - Trigger emails on key events (assignment, flag, comment)
   - Store notification records in DB

3. **Frontend UI**
   - Add notifications bell icon in header
   - Create notifications dropdown
   - Mark as read/unread functionality

**Database Tables Used:**
- `notifications`

---

### 3. Multi-language UI (English/Swahili)
**Status:** Translations Ready | Context Ready | Frontend Integration Pending

**What's Done:**
- ✅ Complete English translations (`en.ts`)
- ✅ Complete Swahili translations (`sw.ts`)
- ✅ I18n Context (`I18nContext.tsx`) with localStorage persistence
- ✅ All UI strings covered

**What's Needed:**
1. **Wrap App with Provider**
   ```tsx
   <I18nProvider>
     <App />
   </I18nProvider>
   ```

2. **Update Components**
   - Replace hardcoded strings with `useTranslation()` hook
   - Add language toggle in settings/header

3. **Example Usage**
   ```tsx
   const { t } = useTranslation();
   return <h1>{t('dashboardTitle')}</h1>;
   ```

**Database Tables Used:**
- None (stored in localStorage)

---

## Phase 2: Data Management (Weeks 3-4)

### 4. Data Quality Scoring
**Status:** Service Ready | Backend Integration Pending | Frontend Display Pending

**What's Done:**
- ✅ `dataQualityService.ts` with scoring algorithm
- ✅ Quality scoring calculations (0-100)
- ✅ Issue detection logic
- ✅ Database columns: `quality_score`, `quality_issues`, `is_flagged`

**Scoring Breakdown:**
- Completeness (30%) - Required fields present
- Geographic validity (15%) - Correct Kilifi coordinates
- Data validity (10%) - Valid waste types, methods
- Image presence (5 points) - Bonus for images
- Suspicious patterns (10%) - Unrealistic data combinations
- Text field quality (10%) - Minimum length checks

**What's Needed:**
1. **Backend Integration**
   - Run scoring when record is submitted
   - Update waste_sites with quality_score
   - Flag records with score < 60
   - Auto-trigger review queue

2. **Frontend Display**
   - Show quality badge on record rows
   - Display quality issues tooltip
   - Show quality bar chart

**Database Tables Used:**
- `waste_sites` (quality_score, quality_issues, is_flagged columns)

---

### 5. Comment System
**Status:** Database Ready | Backend Pending | Frontend Pending

**What's Done:**
- ✅ `record_comments` table created
- ✅ Comment types: general, flag, feedback, correction
- ✅ Type definitions created
- ✅ Foreign keys and indexes

**What's Needed:**
1. **Backend API Routes**
   ```
   POST   /api/records/:id/comments - Create comment
   GET    /api/records/:id/comments - Get all comments
   DELETE /api/records/:id/comments/:commentId - Delete comment
   ```

2. **Frontend Components**
   - Create CommentThread component
   - Add comment form below record details
   - Display comments chronologically
   - Delete button for comment author/admin

3. **Email Integration**
   - Send email when comment added
   - Use `emailService.sendCommentEmail()`

**Database Tables Used:**
- `record_comments`

---

### 6. Enumerator Task Assignments
**Status:** Database Ready | Backend Pending | Frontend Pending

**What's Done:**
- ✅ `enumerator_assignments` table created
- ✅ Fields: enumerator_id, ward, target_records, status
- ✅ Type definitions created
- ✅ Unique constraint on (enumerator_id, ward)

**What's Needed:**
1. **Backend API Routes**
   ```
   POST   /api/assignments - Create assignment
   GET    /api/assignments - List all
   GET    /api/assignments?enumerator_id=X - Filter by enumerator
   PATCH  /api/assignments/:id - Update status
   DELETE /api/assignments/:id - Delete assignment
   ```

2. **Frontend Components**
   - Create AssignmentPage with table
   - Modal to create/edit assignments
   - Ward selector dropdown
   - Target record input
   - Status badges (active/paused/completed)

3. **Email Integration**
   - Send assignment email to enumerator
   - Use `emailService.sendAssignmentEmail()`

4. **Dashboard Integration**
   - Show assignment progress
   - Enumerator efficiency (records vs target)

**Database Tables Used:**
- `enumerator_assignments`

---

## Phase 3: Advanced Features (Weeks 5-6)

### 7. Advanced Filtering & Search
**Status:** Frontend Pending | Backend Ready

**What's Done:**
- ✅ Database indexes on common filter fields
- ✅ Coordinates validation
- ✅ Type definitions

**What's Needed:**
1. **Backend API Enhancement**
   ```
   GET /api/records?filters={
     ward: "Tezo",
     settlement_type: "Formal",
     quality_score_min: 70,
     date_from: "2024-01-01",
     date_to: "2024-12-31",
     is_flagged: false,
     search: "keyword"
   }
   ```

2. **Frontend Components**
   - Create AdvancedFilter component
   - Multi-select for wards, settlement types
   - Date range picker
   - Quality score slider
   - Full-text search box
   - Save filter presets

3. **API Implementation**
   - Build WHERE clause dynamically
   - Add full-text search on challenges, suggested_location
   - Implement pagination

**Database Tables Used:**
- `waste_sites` (all relevant fields)

---

### 8. Dashboard Statistics
**Status:** Type Definitions Ready | Backend Pending | Frontend Pending

**What's Done:**
- ✅ `DashboardStats` interface defined
- ✅ Statistics to track identified
- ✅ Database schema supports all metrics

**What's Needed:**
1. **Backend Endpoint**
   ```
   GET /api/dashboard/stats
   Returns: {
     total_records,
     records_this_month,
     total_enumerators,
     active_assignments,
     pending_comments,
     flagged_records,
     average_quality_score,
     records_by_ward: {},
     records_by_settlement: {},
     records_by_enumerator: {}
   }
   ```

2. **Frontend Components**
   - Update Dashboard.tsx to fetch stats
   - Create StatCard component for KPIs
   - Add Chart component (use Recharts - already installed)
   - Show: pie chart (by ward), bar chart (by enumerator), trend line (monthly)

3. **Query Optimization**
   - Use aggregation queries
   - Cache results with 5-minute TTL
   - Add database views for complex calculations

**Database Tables Used:**
- `waste_sites`, `enumerators`, `enumerator_assignments`, `record_comments`

---

### 9. PDF Report Export
**Status:** Frontend Pending | Backend Library Needed

**What's Needed:**
1. **Add Library**
   ```bash
   npm install pdfkit --save
   ```

2. **Backend Route**
   ```
   POST /api/reports/generate-pdf
   Body: {
     record_ids: [1, 2, 3],
     include_images: true,
     include_comments: true,
     include_stats: true
   }
   Returns: PDF file
   ```

3. **PDF Content**
   - Header with logo, date, generatedby
   - Summary statistics
   - Record details (one per page or table)
   - Images (if included)
   - Comments section
   - Quality scores

4. **Frontend**
   - Add "Export PDF" button in Records
   - Show progress/loading indicator
   - Auto-download or email option

**Database Tables Used:**
- `waste_sites`, `record_comments`, notifications

---

### 10. Offline Mode with Sync Queue
**Status:** Database Ready | Frontend Pending | Backend Pending

**What's Done:**
- ✅ `offline_queue` table created
- ✅ Queue fields: form_data, sync_status, retries
- ✅ Type definitions created

**What's Needed:**
1. **Frontend Service**
   - Detect offline status (`navigator.onLine`)
   - Queue forms in localStorage when offline
   - Show sync status indicator
   - Manual retry button

2. **Sync Logic**
   - On online, start syncing queued items
   - Batch requests if multiple queued
   - Retry failed items with exponential backoff
   - Clear successful items from queue

3. **Backend Endpoint**
   ```
   POST /api/offline/sync
   Body: { form_data: {...}, offline_id: X }
   ```

4. **UI Indicators**
   - "Offline" badge in header
   - Queue size counter
   - Sync progress bar
   - Green checkmark when synced

**Database Tables Used:**
- `offline_queue`

---

## Implementation Checklist

### Phase 1 (Weeks 1-2)
- [ ] RBAC middleware implementation
- [ ] Role-based UI hiding
- [ ] Email service testing
- [ ] Notifications UI
- [ ] Language switcher UI
- [ ] Test all translations

### Phase 2 (Weeks 3-4)
- [ ] Quality scoring integration
- [ ] Comment CRUD endpoints
- [ ] Comment UI components
- [ ] Assignment management UI
- [ ] Assignment email sending
- [ ] Dashboard updates

### Phase 3 (Weeks 5-6)
- [ ] Advanced filter backend
- [ ] Filter UI components
- [ ] Dashboard stats endpoint
- [ ] Statistics charts
- [ ] PDF export implementation
- [ ] Offline queue management
- [ ] End-to-end testing

---

## Environment Variables Needed

```env
# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Optional: for custom email sender
EMAIL_FROM_NAME=GeoWaste Kilifi
EMAIL_FROM_ADDRESS=noreply@geowaste.com

# Notification preferences
ENABLE_EMAIL_NOTIFICATIONS=true
NOTIFICATION_RETRY_ATTEMPTS=3
```

---

## Testing Strategy

### Unit Tests
- Quality scoring algorithm
- Email template rendering
- Permission checking
- Offline queue logic

### Integration Tests
- Create record → Quality score → Flag if low
- Create assignment → Send email
- Add comment → Notify author
- Filter records → Validate results

### E2E Tests
- Admin creates assignment
- Enumerator submits record
- Record flagged for low quality
- Admin reviews and approves
- Enumerator gets notification

---

## Performance Considerations

1. **Database Indexes**
   - Already created on: role, ward, quality_score, created_at
   - Add more if needed based on slow query logs

2. **Caching**
   - Cache dashboard stats (5 min TTL)
   - Cache role permissions (10 min TTL)
   - Cache filter options (1 hour TTL)

3. **Pagination**
   - Default 20 records per page
   - Support up to 100 for exports

4. **Email Queue**
   - Send emails asynchronously with queue worker
   - Implement retry logic for failed sends

---

## Security Best Practices

1. **Permissions**
   - Always validate permissions server-side
   - Never trust client-side role/permissions
   - Use middleware for all protected routes

2. **Email**
   - Don't send sensitive data in emails
   - Use unique tokens for links
   - Sanitize user content before sending

3. **Comments**
   - Implement rate limiting (max 50 comments/hour per user)
   - Auto-flag spam patterns
   - Allow deletion only by author/admin

4. **Offline Queue**
   - Encrypt sensitive data before storing locally
   - Clear queue after 7 days
   - Validate all fields on sync

---

## Next Steps

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   ```

2. **Run Database Migration**
   ```bash
   psql -U user -d geowaste_kilifi -f database/migration_003_add_features.sql
   ```

3. **Start Phase 1 Implementation**
   - Begin with RBAC middleware
   - Test email service with test credentials
   - Implement language switcher

4. **Deploy Incrementally**
   - Deploy Phase 1 first
   - Get user feedback
   - Then proceed to Phase 2, etc.

---

## Support & Questions

Refer to individual feature documentation as you implement each module. All type definitions are in `backend/src/types.ts` and `frontend types.d.ts`.

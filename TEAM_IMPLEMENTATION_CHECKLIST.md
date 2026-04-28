# Phase 2 Implementation - Team Checklist

## Pre-Implementation Setup (Do First)

### Database & Environment
- [ ] **Backup Production Database**
  ```bash
  pg_dump postgresql://geowaste:PASSWORD@... > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Create Google App Password**
  1. Go to myaccount.google.com/security
  2. Enable 2-Factor Authentication (if not already)
  3. Generate App Password for Mail
  4. Copy the 16-character password

- [ ] **Update Backend Environment Variables**
  ```env
  # Add to .env
  GMAIL_USER=your-geowaste-email@gmail.com
  GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
  ```

- [ ] **Install Backend Dependencies**
  ```bash
  cd backend
  npm install
  npm run build  # Verify compile succeeds
  ```

### Verify Files Exist
- [ ] `database/migration_003_add_features.sql`
- [ ] `backend/src/emailService.ts`
- [ ] `backend/src/dataQualityService.ts`
- [ ] `frontend/src/context/I18nContext.tsx`
- [ ] `frontend/src/locales/en.ts`
- [ ] `frontend/src/locales/sw.ts`

---

## Phase 2A: Foundation Deployment (Week 1)

### Step 1: Deploy Migration to Production

**Responsible:** Database Admin / DevOps

- [ ] **Test Migration Locally First**
  ```bash
  # Drop local database
  dropdb geowaste_kilifi_dev
  createdb geowaste_kilifi_dev
  
  # Reload schemas in order
  psql geowaste_kilifi_dev -f database/schema.sql
  psql geowaste_kilifi_dev -f database/migration_002_add_image_url.sql
  psql geowaste_kilifi_dev -f database/migration_003_add_features.sql
  
  # Run verification queries (see DATABASE_MIGRATION_DEPLOY.md)
  ```

- [ ] **Deploy to Production**
  ```bash
  psql postgresql://geowaste:PASSWORD@dpg-...frankfurt.../geowaste_kilifi \
    -f database/migration_003_add_features.sql
  ```

- [ ] **Post-Deployment Verification**
  - Run all verification queries from DATABASE_MIGRATION_DEPLOY.md
  - Check table creation: 4 new tables exist
  - Check column creation: new columns on waste_sites and enumerators
  - Verify no errors in application logs

**Time Estimate:** 30-45 minutes
**Blocker:** Nothing else can proceed until this is done

---

### Step 2: Setup Backend Email Service

**Responsible:** Backend Developer

- [ ] **Test Email Service Locally**
  ```typescript
  // Create test file: backend/src/testEmail.ts
  import { emailService } from './emailService';
  
  async function test() {
    const sent = await emailService.sendNotification(
      'test@example.com',
      'Test Subject',
      '<h1>Test Email</h1>'
    );
    console.log('Email sent:', sent);
  }
  
  test();
  ```

- [ ] **Run Test**
  ```bash
  npx ts-node backend/src/testEmail.ts
  ```

- [ ] **Verify Email Received**
  - Check spam folder if needed
  - Delete test file after verification

**Time Estimate:** 15 minutes
**Verification:** Email arrives in inbox

---

### Step 3: Wrap Frontend with I18n Provider

**Responsible:** Frontend Developer

- [ ] **Update `frontend/src/index.tsx`**
  ```tsx
  import { I18nProvider } from './context/I18nContext';
  
  root.render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
  ```

- [ ] **Add Language Switcher to Header**
  ```tsx
  // In Sidebar.tsx or Header component
  import { useTranslation } from '../context/I18nContext';
  
  export function LanguageSwitcher() {
    const { language, setLanguage, t } = useTranslation();
    
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'font-bold' : ''}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('sw')}
          className={language === 'sw' ? 'font-bold' : ''}
        >
          Kiswahili
        </button>
      </div>
    );
  }
  ```

- [ ] **Test Language Switching**
  - Switch to Swahili
  - Verify UI updates
  - Refresh page
  - Verify language persists

**Time Estimate:** 30 minutes
**Verification:** Language switcher works, translations display

---

## Phase 2B: Feature Implementation (Weeks 2-3)

### Step 4: Implement RBAC Middleware

**Responsible:** Backend Developer

- [ ] **Create Permission Checking Middleware**
  ```typescript
  // backend/src/middleware/roleMiddleware.ts
  import { Request, Response, NextFunction } from 'express';
  
  export interface AuthRequest extends Request {
    user?: { id: number; role: string; permissions: Record<string, boolean> };
  }
  
  export function requirePermission(permission: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user?.permissions[permission]) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      next();
    };
  }
  ```

- [ ] **Protect Routes in routes.ts**
  ```typescript
  app.delete('/api/auth/enumerators/:id', 
    requirePermission('manage_enumerators'),
    deleteEnumerator
  );
  ```

- [ ] **Test Permission Checking**
  - Login as admin: should succeed
  - Login as enumerator: should fail
  - Verify 403 responses

**Time Estimate:** 2-3 hours
**Verification:** Permission-based endpoint access works

---

### Step 5: Add Quality Scoring Integration

**Responsible:** Backend Developer

- [ ] **Update Service to Calculate Quality on Record Creation**
  ```typescript
  // In service.ts
  import { dataQualityService } from './dataQualityService';
  
  export async function createWasteSite(record: WasteSiteRecord) {
    const { score, issues } = dataQualityService.calculateQualityScore(record);
    const shouldFlag = dataQualityService.shouldFlag(score, issues);
    
    // Update record before saving
    record.quality_score = score;
    record.quality_issues = issues;
    record.is_flagged = shouldFlag;
    record.flag_reason = shouldFlag ? 'Auto-flagged: ' + issues[0] : null;
    
    return db.query('INSERT INTO waste_sites (...) VALUES (...)', [...]);
  }
  ```

- [ ] **Update RecordsPage to Display Quality**
  ```tsx
  const getQualityColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  // In table render
  <span className={`px-2 py-1 rounded ${getQualityColor(site.quality_score)}`}>
    {site.quality_score}%
  </span>
  ```

- [ ] **Test Quality Scoring**
  - Create record with all fields: score should be ~90-100
  - Create record missing fields: score should be lower
  - Verify flagging works

**Time Estimate:** 2-3 hours
**Verification:** Quality scores appear on record list

---

### Step 6: Build Comment System

**Responsible:** Backend + Frontend Developer (Pair)

**Backend Tasks:**
- [ ] **Create Comment API Routes**
  ```typescript
  app.post('/api/records/:id/comments', authMiddleware, createComment);
  app.get('/api/records/:id/comments', getComments);
  app.delete('/api/records/:id/comments/:commentId', authMiddleware, deleteComment);
  ```

- [ ] **Implement Comment Service Methods**
  ```typescript
  export async function createComment(recordId, authorId, content, type) {
    return db.query(
      'INSERT INTO record_comments (...) VALUES (...)',
      [recordId, authorId, content, type]
    );
  }
  ```

**Frontend Tasks:**
- [ ] **Create CommentThread Component**
  ```tsx
  export function CommentThread({ recordId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    // Load comments on mount
    // Handle add/delete comments
    // Display chronologically
  }
  ```

- [ ] **Add Comment UI to Record Details**
  - Add comments section below record details
  - Show comment count badge

**Time Estimate:** 4-5 hours
**Verification:** Can add/view/delete comments

---

### Step 7: Implement Task Assignments

**Responsible:** Backend + Frontend Developer (Pair)

**Backend Tasks:**
- [ ] **Create Assignment API Routes**
  ```typescript
  app.post('/api/assignments', authMiddleware, createAssignment);
  app.get('/api/assignments', getAssignments);
  app.get('/api/assignments/:id', getAssignmentById);
  app.patch('/api/assignments/:id', authMiddleware, updateAssignment);
  app.delete('/api/assignments/:id', authMiddleware, deleteAssignment);
  ```

**Frontend Tasks:**
- [ ] **Create AssignmentsPage Component**
  - Table showing all assignments
  - Create assignment modal
  - Edit/delete functionality
  - Status badges

- [ ] **Add Assignment Metrics to Dashboard**
  - Total active assignments
  - Assignments by status
  - Progress towards targets

**Time Estimate:** 4-5 hours
**Verification:** Can manage assignments

---

## Phase 2C: Advanced Features (Week 4)

### Step 8: Email Notifications Integration

**Responsible:** Backend + Frontend Developer

- [ ] **Trigger Emails on Key Events**
  - Assignment created: `emailService.sendAssignmentEmail()`
  - Record flagged: `emailService.sendRecordFlagEmail()`
  - Comment added: `emailService.sendCommentEmail()`

- [ ] **Track Notifications in UI**
  - Notifications bell in header
  - Mark as read/unread
  - Show recent notifications

**Time Estimate:** 2-3 hours
**Verification:** Emails sent on events

---

### Step 9: Advanced Filtering

**Responsible:** Backend Developer

- [ ] **Create Filter Query Builder**
  ```typescript
  interface FilterOptions {
    ward?: string;
    settlement_type?: string;
    quality_score_min?: number;
    date_from?: string;
    date_to?: string;
    is_flagged?: boolean;
    search?: string;
  }
  
  export async function filterRecords(filters: FilterOptions) {
    // Build WHERE clause dynamically
    // Apply pagination
  }
  ```

- [ ] **Frontend Filter UI**
  - Multi-select for wards
  - Date range picker
  - Quality score slider
  - Search box

**Time Estimate:** 3-4 hours
**Verification:** Filters work correctly

---

### Step 10: Dashboard Statistics

**Responsible:** Frontend Developer

- [ ] **Create Stats Endpoint**
  ```typescript
  app.get('/api/dashboard/stats', getStatistics);
  ```

- [ ] **Dashboard Charts**
  - Pie chart (records by ward)
  - Bar chart (records by enumerator)
  - Line chart (trend over time)

**Time Estimate:** 2-3 hours
**Verification:** Charts display correct data

---

## Phase 2D: Testing & Deployment (Week 4+)

### Step 11: Comprehensive Testing

- [ ] **Unit Tests**
  - Quality scoring algorithm
  - Permission checking
  - Email template rendering

- [ ] **Integration Tests**
  - Create record → Quality score → Flag if needed
  - Create assignment → Send email
  - Add comment → Notify author

- [ ] **E2E Tests**
  - Full workflow: Admin assigns enumerator → Enumerator submits record → Admin reviews

**Time Estimate:** 3-4 hours
**Verification:** All tests pass

---

### Step 12: Production Deployment

- [ ] **Pre-Deployment**
  - Full database backup
  - Code review complete
  - All tests passing
  - Documentation updated

- [ ] **Deployment Steps**
  1. Merge to main branch
  2. Render auto-deploys backend
  3. Render auto-deploys frontend
  4. Verify all endpoints working
  5. Monitor error logs

- [ ] **Post-Deployment Verification**
  - All features working in production
  - Performance acceptable
  - No error messages in logs

**Time Estimate:** 1-2 hours
**Verification:** All features live and working

---

## Communication & Handoff

### Daily Standups
- What did I complete?
- What am I working on?
- Any blockers?

### Weekly Reviews
- Demo completed features
- Discuss challenges
- Plan next week

### Handoff Documentation
Each feature should include:
- [ ] How to test
- [ ] Known limitations
- [ ] Future improvements
- [ ] API documentation

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Email not configured | Test early, have backup plan |
| Migration fails | Test locally first, have rollback ready |
| Performance issues | Monitor slow queries, add indexes if needed |
| Bugs in production | Comprehensive testing, staged rollout |
| Team needs training | Document everything, pair programming |

---

## Success Criteria

- [ ] All 10 features implemented
- [ ] 0 critical bugs in production
- [ ] User feedback positive
- [ ] Performance meets targets
- [ ] Documentation complete
- [ ] Team trained on new systems

---

## Quick Links

- Database Guide: `DATABASE_MIGRATION_DEPLOY.md`
- Features Guide: `ADVANCED_FEATURES_GUIDE.md`
- Status: `PHASE2_STATUS.md`
- Types: `backend/src/types.ts`

---

**Estimated Total Timeline:** 4 weeks (1 per phase + testing/deployment)

**Team Size:** 2-3 developers recommended

**Questions?** Refer to ADVANCED_FEATURES_GUIDE.md or ask tech lead.

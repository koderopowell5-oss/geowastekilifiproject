# Phase 2 Developer Quick Reference

## 🚀 Getting Started

### 1. Prerequisites
```bash
# Ensure dependencies installed
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

### 2. Environment Setup
```env
# backend/.env - Add these
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
DATABASE_URL=postgresql://...
```

### 3. Apply Database Migration
```bash
psql postgresql://geowaste:PASSWORD@... -f database/migration_003_add_features.sql
```

---

## 📚 Available Services

### Email Service
```typescript
import { emailService } from './emailService';

// Send custom email
emailService.sendNotification(email, subject, htmlContent);

// Send assignment notification
emailService.sendAssignmentEmail(email, name, ward, targetRecords);

// Send flagged record notification
emailService.sendRecordFlagEmail(email, recordId, reason);

// Send comment notification
emailService.sendCommentEmail(email, author, recordId, comment);

// Send approval notification
emailService.sendApprovalEmail(email, recordId, approvedCount);

// Send admin alert
emailService.sendAdminAlert(adminEmail, subject, message);
```

### Quality Scoring Service
```typescript
import { dataQualityService } from './dataQualityService';

// Calculate quality score
const { score, issues } = dataQualityService.calculateQualityScore(record);
// Returns: score (0-100), issues (string array)

// Check if should be flagged
const shouldFlag = dataQualityService.shouldFlag(score, issues);

// Get quality level
const level = dataQualityService.getQualityLevel(score);
// Returns: 'excellent' | 'good' | 'fair' | 'poor'

// Get quality color for UI
const color = dataQualityService.getQualityColor(score);
// Returns: hex color string
```

### i18n Service
```typescript
import { useTranslation } from './context/I18nContext';

// In React component
const { t, language, setLanguage } = useTranslation();

// Use translation
<h1>{t('dashboardTitle')}</h1>

// Change language
setLanguage('sw'); // Switch to Swahili
setLanguage('en'); // Switch to English
```

---

## 🔐 Type Definitions

### User Role
```typescript
interface UserRole {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'enumerator';
  ward?: string;
  permissions: Record<string, boolean>;
}
```

### Enumerator Assignment
```typescript
interface EnumeratorAssignment {
  id: number;
  enumerator_id: number;
  ward: string;
  status: 'active' | 'paused' | 'completed';
  target_records: number;
  description?: string;
  assigned_at: string;
  assigned_by?: number;
}
```

### Record Comment
```typescript
interface RecordComment {
  id: number;
  waste_site_id: number;
  author_id: number;
  content: string;
  comment_type: 'general' | 'feedback' | 'flag' | 'correction';
  created_at: string;
}
```

### Notification
```typescript
interface Notification {
  id: number;
  recipient_id: number;
  subject: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  sent_at?: string;
}
```

### Offline Queue Item
```typescript
interface OfflineQueueItem {
  id: number;
  enumerator_email: string;
  form_data: Record<string, any>;
  sync_status: 'pending' | 'synced' | 'failed';
  retries: number;
  created_at: string;
  synced_at?: string;
}
```

### Dashboard Stats
```typescript
interface DashboardStats {
  total_records: number;
  records_this_month: number;
  total_enumerators: number;
  active_assignments: number;
  pending_comments: number;
  flagged_records: number;
  average_quality_score: number;
  records_by_ward: Record<string, number>;
  records_by_settlement: Record<string, number>;
  records_by_enumerator: Record<string, number>;
}
```

---

## 🛠️ Common Implementation Patterns

### 1. Protect Route with Permission Check
```typescript
import { requirePermission } from './middleware/roleMiddleware';

app.delete(
  '/api/records/:id',
  requirePermission('delete_records'),
  deleteRecord
);
```

### 2. Calculate Quality & Auto-Flag Record
```typescript
const { score, issues } = dataQualityService.calculateQualityScore(record);
const isFlagged = dataQualityService.shouldFlag(score, issues);

await db.query(
  'INSERT INTO waste_sites (..., quality_score, quality_issues, is_flagged, flag_reason) VALUES (...)',
  [..., score, issues, isFlagged, isFlagged ? issues[0] : null]
);

if (isFlagged) {
  // Send flag notification
  await emailService.sendRecordFlagEmail(
    record.enumerator_email,
    record.id,
    issues[0]
  );
}
```

### 3. Display Translations in Component
```tsx
import { useTranslation } from '../context/I18nContext';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboardTitle')}</h1>
      <button>{t('exportCSV')}</button>
    </div>
  );
}
```

### 4. Send Assignment Notification
```typescript
await emailService.sendAssignmentEmail(
  enumerator.email,
  enumerator.name,
  assignment.ward,
  assignment.target_records
);

// Track in database
await db.query(
  'INSERT INTO notifications (recipient_id, subject, message, notification_type) VALUES (...)',
  [enumerator.id, 'New Assignment', subject, 'assignment']
);
```

---

## 📊 Database Queries

### Get Quality Stats
```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN quality_score >= 85 THEN 1 END) as excellent,
  COUNT(CASE WHEN quality_score >= 70 AND quality_score < 85 THEN 1 END) as good,
  COUNT(CASE WHEN is_flagged THEN 1 END) as flagged,
  AVG(quality_score) as average
FROM waste_sites;
```

### Get Assignment Progress
```sql
SELECT
  ea.id,
  ea.ward,
  ea.target_records,
  COUNT(ws.id) as submitted_records,
  COUNT(CASE WHEN ws.is_flagged THEN 1 END) as flagged_records,
  AVG(ws.quality_score) as avg_quality
FROM enumerator_assignments ea
LEFT JOIN waste_sites ws ON ws.ward = ea.ward AND ws.enumerator_email = e.email
GROUP BY ea.id;
```

### Get Comment Activity
```sql
SELECT
  rc.waste_site_id,
  COUNT(*) as comment_count,
  MAX(rc.created_at) as last_comment
FROM record_comments rc
GROUP BY rc.waste_site_id
ORDER BY last_comment DESC;
```

---

## 🧪 Quick Tests

### Test Email Service
```typescript
import { emailService } from './emailService';

// Test send
const result = await emailService.sendNotification(
  'test@example.com',
  'Test Subject',
  '<h1>Test</h1>'
);
console.log(result ? '✓ Email sent' : '✗ Failed');
```

### Test Quality Scoring
```typescript
import { dataQualityService } from './dataQualityService';

const testRecord = {
  latitude: -3.2,
  longitude: 40.1,
  ward: 'Tezo',
  household_size: 5,
  waste_types: ['Organic', 'Plastics'],
  disposal_method: 'County collection',
  // ... other fields
};

const { score, issues } = dataQualityService.calculateQualityScore(testRecord);
console.log(`Score: ${score}%, Issues: ${issues.join(', ')}`);
```

### Test i18n
```typescript
import { I18nProvider, useTranslation } from './context/I18nContext';

function TestComponent() {
  const { t, setLanguage } = useTranslation();
  
  return (
    <div>
      <p>{t('dashboardTitle')}</p>
      <button onClick={() => setLanguage('sw')}>Kiswahili</button>
    </div>
  );
}
```

---

## 🐛 Debugging Tips

### Debug Email Issues
```typescript
// Check if service initialized
console.log(emailService['transporter']);

// Test with more verbose logging
emailService.sendNotification(email, subject, html)
  .then(r => console.log('Sent:', r))
  .catch(e => console.error('Failed:', e.message));
```

### Debug Quality Scoring
```typescript
const { score, issues } = dataQualityService.calculateQualityScore(record);
console.log('Score:', score);
console.log('Issues:', issues);
console.log('Should flag:', dataQualityService.shouldFlag(score, issues));
```

### Debug Translation Issues
```typescript
const { t, language, translations } = useTranslation();
console.log('Current language:', language);
console.log('Available keys:', Object.keys(translations));
console.log('Translated:', t('dashboardTitle'));
```

---

## 📝 Translation Keys Available

All translation keys in `frontend/src/locales/`:

**Navigation:** dashboard, records, map, enumerators, settings, profile, logout

**Dashboard:** dashboardTitle, statistics, totalRecords, activeEnumerators, averageQuality

**Records:** recordsTitle, exportCSV, exportPDF, filter, search, advancedFilter

**Quality:** qualityScore, excellent, good, fair, poor, qualityIssues, flaggedForReview

**Comments:** addComment, feedback, correction, writeComment

**Assignments:** createAssignment, assignedTo, targetRecords, status

**Notifications:** notifications, newAssignment, recordFlagged, newComment, recordApproved

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `backend/src/emailService.ts` | Email integration |
| `backend/src/dataQualityService.ts` | Quality scoring |
| `frontend/src/context/I18nContext.tsx` | i18n provider |
| `frontend/src/locales/en.ts` | English translations |
| `frontend/src/locales/sw.ts` | Swahili translations |
| `backend/src/types.ts` | All type definitions |
| `database/migration_003_add_features.sql` | Database schema |

---

## ✅ Checklist for New Feature

When implementing a new Phase 2 feature:

- [ ] Add type definitions to `backend/src/types.ts`
- [ ] Create database queries (or migration if new table)
- [ ] Create backend service/routes
- [ ] Add API endpoints
- [ ] Add translations to `en.ts` and `sw.ts`
- [ ] Create frontend component
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Get code review
- [ ] Deploy to production

---

## 🆘 Getting Help

1. Check ADVANCED_FEATURES_GUIDE.md for feature details
2. Review TEAM_IMPLEMENTATION_CHECKLIST.md for step-by-step guidance
3. Check DATABASE_MIGRATION_DEPLOY.md for database issues
4. Refer to backend/src/types.ts for type definitions
5. Look at test cases for usage examples

---

**Last Updated:** Now  
**Phase:** 2 (Advanced Features)  
**Status:** Foundation Complete, Ready for Implementation

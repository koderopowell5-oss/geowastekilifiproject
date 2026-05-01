# Testing Guide: Notification System with Dummy Data

## Quick Setup for Testing

### Step 1: Ensure Test User Exists
First, verify you have a test user with email `test@example.com`:

```sql
-- Check if test user exists
SELECT id, email, name FROM enumerators WHERE email = 'test@example.com';

-- If not, create a test user
INSERT INTO enumerators (email, name, password_hash, ward, phone, role)
VALUES (
  'test@example.com',
  'Test Enumerator',
  '$2b$10$...',  -- bcrypt hash of password
  'Jomvu',
  '+254712345678',
  'enumerator'
)
ON CONFLICT (email) DO NOTHING;
```

### Step 2: Load Dummy Notification Data
Run the seed file to populate test notifications:

```bash
# From the project root directory
psql -U postgres -d geowaste_db -f database/seed-notifications.sql
```

Expected output:
```
INSERT 0 1  (Account verification)
INSERT 0 1  (Survey reminder 1)
INSERT 0 1  (Survey reminder 2)
INSERT 0 1  (Submission confirmation 1)
INSERT 0 1  (Submission confirmation 2)
INSERT 0 1  (Security alert)
INSERT 0 1  (System notification)
INSERT 0 1  (Failed notification)
INSERT 0 1  (Secondary user notification)
```

### Step 3: Login and Test

1. **Start the frontend**:
   ```bash
   cd frontend
   npm start
   ```

2. **Login with test credentials**:
   - Email: `test@example.com`
   - Password: (whatever you set, or use default from seed)

3. **Click the bell icon** in the header to open the NotificationPanel

---

## Test Data Overview

### 📊 Notification Distribution

| Type | Count | Status | Purpose |
|------|-------|--------|---------|
| Account Verification | 1 | read | Initial setup |
| Survey Reminders | 2 | unread | Urgent action needed |
| Submission Confirmations | 2 | read | Completed actions |
| Security Alerts | 1 | unread | New notification type |
| System Notifications | 1 | read | App updates |
| Failed Notifications | 1 | failed | Error state testing |

### 🔔 Sample Notifications

#### 1. Account Verification (Read)
- **Type**: `account_verification`
- **Status**: Read
- **Age**: 2 days old
- **Purpose**: Shows how verified accounts display

#### 2. Survey Reminders (Unread) ×2
- **Type**: `survey_reminder`
- **Status**: Unread
- **Age**: Recent (6 hours & 2 hours old)
- **Purpose**: Shows urgent pending work
- **UI Impact**: Shows unread badge, different color

#### 3. Submission Confirmations (Read) ×2
- **Type**: `submission_confirmation`
- **Status**: Read/Recently read
- **Age**: 1 day & 4 hours old
- **Purpose**: Shows completed submissions
- **UI Impact**: Shows completion checkmarks

#### 4. Security Alert (Unread)
- **Type**: `security_alert`
- **Status**: Unread
- **Age**: 30 minutes old
- **Purpose**: New login alert
- **UI Impact**: Shows alert icon, prominent display

#### 5. System Notification (Read)
- **Type**: `system_notification`
- **Status**: Read
- **Age**: 3 days old
- **Purpose**: App updates
- **UI Impact**: Shows update information

#### 6. Failed Notification
- **Type**: `general`
- **Status**: Failed
- **Purpose**: Error state testing
- **UI Impact**: Shows error styling/message

---

## Testing Scenarios

### ✅ Scenario 1: View All Notifications
**Steps**:
1. Login with test@example.com
2. Click bell icon in header
3. Panel opens showing all 8 notifications
4. Unread count shows "3" (survey reminders + security alert)

**Expected UI**:
- Notification list displays all items
- Unread notifications have different styling
- Timestamps show relative time ("6 hours ago", "2 hours ago")
- Icons match notification types

### ✅ Scenario 2: Mark as Read
**Steps**:
1. View NotificationPanel
2. Click on an unread notification
3. Notification status changes

**Expected behavior**:
- Unread count decreases
- Notification styling changes (grayed out)
- `read_at` timestamp is updated in database

### ✅ Scenario 3: Clear All Notifications
**Steps**:
1. View NotificationPanel
2. Click "Clear All" button (if present)
3. All notifications are deleted

**Expected behavior**:
- Panel shows empty state
- "No notifications yet" message appears
- Database is cleaned up

### ✅ Scenario 4: Multiple Notification Types
**Steps**:
1. Scroll through notification list
2. Observe different icon types
3. Check color coding by status

**Expected UI**:
- Account verification: ✓ icon in teal
- Survey reminder: 🔔 icon in teal
- Submission confirmation: ✓ icon in teal
- Security alert: ⚠️ icon in orange/alert color
- Failed: Error icon in red

### ✅ Scenario 5: Responsive Design
**Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar
3. Test on mobile (375px width)
4. Test on tablet (768px width)

**Expected behavior**:
- Panel is full-width on mobile
- Proper padding and touch targets
- No text overflow
- Buttons are easily clickable

---

## Database Queries for Testing

### View all notifications for test user
```sql
SELECT id, notification_type, subject, status, created_at
FROM notifications
WHERE recipient_email = 'test@example.com'
ORDER BY created_at DESC;
```

### Count notifications by status
```sql
SELECT status, COUNT(*) as count
FROM notifications
WHERE recipient_email = 'test@example.com'
GROUP BY status;
```

### View unread notifications
```sql
SELECT id, subject, created_at
FROM notifications
WHERE recipient_email = 'test@example.com'
  AND status != 'read'
ORDER BY created_at DESC;
```

### Count unread notifications
```sql
SELECT COUNT(*) as unread_count
FROM notifications
WHERE recipient_email = 'test@example.com'
  AND status != 'read';
```

### View notification logs (email delivery audit)
```sql
SELECT recipient_email, notification_type, subject, status, created_at
FROM notification_logs
WHERE recipient_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Common Testing Tasks

### 🔄 Reset Test Data
```bash
# Clear old test data and reload fresh
psql -U postgres -d geowaste_db -c "DELETE FROM notifications WHERE recipient_email = 'test@example.com';"
psql -U postgres -d geowaste_db -f database/seed-notifications.sql
```

### ➕ Add More Test Notifications
```sql
INSERT INTO notifications (
  recipient_email,
  notification_type,
  subject,
  message,
  status,
  sent_at,
  created_at,
  updated_at
) VALUES (
  'test@example.com',
  'survey_reminder',
  '⏰ Survey Reminder: Custom Survey',
  'Custom test notification for testing purposes.',
  'unread',
  NOW(),
  NOW(),
  NOW()
);
```

### 🗑️ Clear All Test Notifications
```sql
DELETE FROM notifications WHERE recipient_email = 'test@example.com';
```

### 📊 Generate Random Notifications
```bash
# Create a helper script to generate N random notifications
# This is useful for testing pagination and performance
# Run from backend:
# node scripts/generate-test-notifications.js 100
```

---

## Testing Checklist

### Visual Testing
- [ ] Bell icon displays in header
- [ ] Bell icon is clickable
- [ ] NotificationPanel opens smoothly
- [ ] Notifications list displays all items
- [ ] Unread count badge shows correct number
- [ ] Icons match notification types
- [ ] Timestamps display correctly
- [ ] Text is not truncated
- [ ] Read/unread styling is distinct

### Functionality Testing
- [ ] Click bell opens panel
- [ ] Click X closes panel
- [ ] Click outside closes panel
- [ ] Mark as read updates status
- [ ] Unread count decrements
- [ ] Clear all removes notifications
- [ ] No errors in console
- [ ] API calls succeed

### Responsive Testing
- [ ] Mobile (375px): Full-width, properly spaced
- [ ] Tablet (768px): Readable, touch-friendly
- [ ] Desktop (1024px): Drawer animation smooth
- [ ] Landscape orientation works
- [ ] No horizontal scrolling

### Edge Cases
- [ ] No notifications (empty state)
- [ ] Many notifications (100+)
- [ ] Very long notification text
- [ ] Special characters in text
- [ ] Failed notifications display
- [ ] Pending notifications display

---

## Troubleshooting

### Seed file fails to load
```bash
# Check syntax
psql -U postgres -d geowaste_db -f database/seed-notifications.sql

# If foreign key fails:
# Ensure test@example.com exists in enumerators table first
SELECT * FROM enumerators WHERE email = 'test@example.com';
```

### No notifications appear
1. Verify user logged in with correct email
2. Check database has data: `SELECT COUNT(*) FROM notifications WHERE recipient_email = 'test@example.com';`
3. Check API endpoint: `curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/notifications`
4. Check browser console for errors
5. Verify token is valid

### Unread count is wrong
```sql
-- Check actual unread count in database
SELECT COUNT(*) FROM notifications 
WHERE recipient_email = 'test@example.com' 
  AND status != 'read';

-- Update UI by refreshing the panel
-- Close and reopen the panel
```

### Bell icon not visible
1. Check EnumeratorDashboard.tsx has NotificationPanel imported
2. Verify bell icon CSS is loaded
3. Check NotificationPanel component exists
4. Look for JavaScript errors in console

---

## Next Steps

After testing with dummy data:

1. **Remove test data** before production:
   ```sql
   DELETE FROM notifications WHERE recipient_email IN ('test@example.com', 'enumerator@example.com');
   ```

2. **Test with real data**:
   - Create actual accounts
   - Perform real actions (signup, delete, submit surveys)
   - Verify notifications are created correctly

3. **Add more scenarios**:
   - Bulk notifications (100+)
   - Performance testing
   - Real-time updates (WebSocket)
   - Notification preferences UI

4. **Implement additional features**:
   - Push notifications (Firebase)
   - SMS notifications (Twilio)
   - Email preferences
   - Notification scheduling

---

## File Reference

- **Seed file**: `database/seed-notifications.sql`
- **Component**: `frontend/src/components/NotificationPanel.tsx`
- **Dashboard**: `frontend/src/components/EnumeratorDashboard.tsx`
- **Service**: `backend/src/notificationService.ts`
- **Routes**: `backend/src/routes.ts`
- **Migration**: `database/migration_008_notification_system.sql`

---

**Testing Date**: April 30, 2026
**Status**: Ready for testing ✅

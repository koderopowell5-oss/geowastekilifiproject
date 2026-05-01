# Quick Start: Testing Notifications with Dummy Data

## 🚀 30-Second Setup

### 1. Load Basic Test Data
```bash
# Navigate to project root
cd e:\desktop\GeoWaste Kilifi

# Load seed data into database
psql -U postgres -d geowaste_db -f database/seed-notifications.sql
```

### 2. Login & Test
- **Email**: `test@example.com`
- **Password**: (use your test password)
- Click the **bell icon** 🔔 in the header

---

## 🎯 Quick Testing Methods

### Method 1: SQL Seed File (Easiest)
**Best for**: Initial setup, quick testing, specific data

```bash
# Load predefined test notifications
psql -U postgres -d geowaste_db -f database/seed-notifications.sql

# Login and click bell icon to see all 11 notifications
```

**Data included**:
- ✓ 2 Account verification (different statuses)
- ✓ 3 Survey reminders (all unread)
- ✓ 2 Submission confirmations (read)
- ✓ 1 Security alert (unread)
- ✓ 1 System notification (read)
- ✓ 1 Failed notification (error state)

---

### Method 2: Windows Batch Script
**Best for**: Windows users, custom counts

```batch
# Generate 10 test notifications
cd E:\desktop\GeoWaste Kilifi
scripts\generate-test-notifications.bat 10

# Or use default (5 notifications)
scripts\generate-test-notifications.bat
```

---

### Method 3: Bash Script
**Best for**: Linux/Mac users, quick generation

```bash
# Generate 10 test notifications
cd ~/GeoWaste\ Kilifi
bash scripts/generate-test-notifications.sh 10

# Or use default (5 notifications)
bash scripts/generate-test-notifications.sh
```

---

### Method 4: Node.js Script (Recommended)
**Best for**: Most flexible, better output, cross-platform

```bash
# From project root
cd backend

# Generate 10 notifications for test@example.com
node ../scripts/generate-test-notifications.js 10

# Generate 5 notifications for custom user
node ../scripts/generate-test-notifications.js 5 custom@example.com

# Default (5 notifications for test@example.com)
node ../scripts/generate-test-notifications.js
```

---

## 📊 What Gets Created

Each test notification includes:
- ✅ Unique ID
- ✅ Notification type (account_verification, survey_reminder, etc.)
- ✅ Subject line
- ✅ Message content
- ✅ Status (read, unread, failed)
- ✅ Timestamps (created_at, sent_at, read_at)
- ✅ Recipient email

---

## 🧪 Testing Scenarios

### View All Notifications
```bash
# 1. Load test data
psql -U postgres -d geowaste_db -f database/seed-notifications.sql

# 2. Login with test@example.com
# 3. Click bell icon in header
# 4. See all notifications in panel
```

### Test Mark as Read
```
1. View notification panel
2. Click unread notification
3. See status change
4. Unread count decreases
```

### Test Clear All
```
1. View notification panel
2. Click "Clear All" button
3. All notifications deleted
4. See empty state
```

### Test Responsive Design
```
1. Open DevTools (F12)
2. Toggle device toolbar
3. Resize to mobile (375px)
4. Check layout and spacing
```

---

## 🔧 Useful Database Queries

### View all test notifications
```sql
SELECT id, notification_type, subject, status, created_at
FROM notifications
WHERE recipient_email = 'test@example.com'
ORDER BY created_at DESC;
```

### Count by status
```sql
SELECT status, COUNT(*) 
FROM notifications
WHERE recipient_email = 'test@example.com'
GROUP BY status;
```

### Get unread count
```sql
SELECT COUNT(*) as unread
FROM notifications
WHERE recipient_email = 'test@example.com'
AND status != 'read';
```

### Clear test data
```sql
DELETE FROM notifications 
WHERE recipient_email = 'test@example.com';
```

### Reset and reload
```bash
# From psql:
psql -U postgres -d geowaste_db << SQL
DELETE FROM notifications WHERE recipient_email = 'test@example.com';
SQL

# Then reload:
psql -U postgres -d geowaste_db -f database/seed-notifications.sql
```

---

## 📋 Checklist

After loading test data, verify:

- [ ] Bell icon visible in header
- [ ] Panel opens when clicked
- [ ] All notifications display
- [ ] Unread count shows (should be 3-4)
- [ ] Icons match notification types
- [ ] Timestamps display correctly
- [ ] Can mark as read
- [ ] Can clear all
- [ ] Panel closes smoothly
- [ ] No console errors

---

## 🚨 Troubleshooting

### "User not found" error
```sql
-- Verify test user exists:
SELECT * FROM enumerators WHERE email = 'test@example.com';

-- If missing, create:
INSERT INTO enumerators (email, name, password_hash, ward, phone, role)
VALUES ('test@example.com', 'Test User', '[PASSWORD_HASH]', 'Jomvu', '+254712345678', 'enumerator');
```

### No notifications appear
```bash
# Check database has data:
psql -U postgres -d geowaste_db -c "SELECT COUNT(*) FROM notifications WHERE recipient_email = 'test@example.com';"

# If 0, reload seed data:
psql -U postgres -d geowaste_db -f database/seed-notifications.sql
```

### Wrong email in notifications
```bash
# Update email in seed file or use custom email:
node scripts/generate-test-notifications.js 5 your-email@example.com
```

---

## 📁 File Reference

| File | Purpose | Usage |
|------|---------|-------|
| `database/seed-notifications.sql` | SQL seed data | `psql -f seed-notifications.sql` |
| `scripts/generate-test-notifications.bat` | Windows generator | `.\generate-test-notifications.bat 10` |
| `scripts/generate-test-notifications.sh` | Bash generator | `bash generate-test-notifications.sh 10` |
| `scripts/generate-test-notifications.js` | Node.js generator | `node generate-test-notifications.js 10` |
| `NOTIFICATION_TESTING_GUIDE.md` | Detailed guide | Full testing documentation |

---

## 💡 Pro Tips

1. **Quick reset**: Delete old data and reload fresh seed
   ```bash
   psql -U postgres -d geowaste_db -c "DELETE FROM notifications WHERE recipient_email = 'test@example.com';"
   psql -U postgres -d geowaste_db -f database/seed-notifications.sql
   ```

2. **Multiple users**: Generate data for different test accounts
   ```bash
   node scripts/generate-test-notifications.js 5 user1@example.com
   node scripts/generate-test-notifications.js 5 user2@example.com
   ```

3. **Bulk testing**: Generate lots of notifications for performance testing
   ```bash
   node scripts/generate-test-notifications.js 100
   ```

4. **Monitor in real-time**: Watch notifications in database
   ```bash
   watch -n 1 "psql -U postgres -d geowaste_db -c 'SELECT COUNT(*) FROM notifications WHERE recipient_email = \"test@example.com\";'"
   ```

---

## 🎉 Success

When everything works, you should see:
- ✅ Bell icon in header (top-right)
- ✅ Click opens notification panel
- ✅ All test notifications display
- ✅ Unread count badge shows
- ✅ Can interact with notifications
- ✅ No errors in console

---

**Ready to test?** Pick a method above and get started! 🚀

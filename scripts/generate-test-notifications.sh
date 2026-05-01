#!/bin/bash

# Test Notification Generator Script
# Quickly generate dummy notifications for testing the notification system
# Usage: ./generate-test-notifications.sh <count>

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-geowaste_db}
TEST_EMAIL=${TEST_EMAIL:-test@example.com}

# Number of notifications to generate
COUNT=${1:-5}

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Notification Generator${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Generating ${BLUE}${COUNT}${NC} test notifications..."
echo "Target email: ${BLUE}${TEST_EMAIL}${NC}"
echo ""

# Arrays of notification types and messages
TYPES=(
  "account_verification"
  "survey_reminder"
  "submission_confirmation"
  "security_alert"
  "system_notification"
  "general"
)

SUBJECTS=(
  "✓ Account Verified"
  "⏰ Survey Reminder: Waste Management"
  "✓ Survey Submitted Successfully"
  "🔒 Security Alert: New Login"
  "📢 App Update Available"
  "📨 New Message"
)

MESSAGES=(
  "Your account has been verified successfully."
  "You have a pending survey waiting for completion."
  "Your survey submission has been received."
  "Your account was accessed from a new device."
  "A new version of the app is available."
  "You have a new notification."
)

# Generate SQL statements
SQL_FILE="/tmp/test_notifications_$$.sql"

echo "-- Auto-generated test notifications ($(date))" > "$SQL_FILE"
echo "" >> "$SQL_FILE"

for i in $(seq 1 $COUNT); do
  # Pick random type/subject/message
  TYPE_IDX=$((RANDOM % ${#TYPES[@]}))
  STATUS_IDX=$((RANDOM % 2))
  STATUS=("unread" "read")
  HOURS=$((RANDOM % 24 + 1))
  
  TYPE="${TYPES[$TYPE_IDX]}"
  SUBJECT="${SUBJECTS[$TYPE_IDX]}"
  MESSAGE="${MESSAGES[$TYPE_IDX]}"
  STATUS="${STATUS[$STATUS_IDX]}"
  
  # Build INSERT statement
  cat >> "$SQL_FILE" << EOF
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
  '$TEST_EMAIL',
  '$TYPE',
  '$SUBJECT',
  '$MESSAGE',
  '$STATUS',
  NOW() - INTERVAL '$HOURS hours',
  NOW() - INTERVAL '$HOURS hours',
  NOW() - INTERVAL '$HOURS hours'
);

EOF
done

# Execute the SQL
echo -e "${BLUE}Executing SQL...${NC}"
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ Successfully generated ${COUNT} test notifications${NC}"
  echo ""
  
  # Show summary
  echo -e "${BLUE}Summary:${NC}"
  psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" << SQL
SELECT notification_type, status, COUNT(*) as count
FROM notifications
WHERE recipient_email = '$TEST_EMAIL'
GROUP BY notification_type, status
ORDER BY notification_type;
SQL
  
  echo ""
  echo -e "${BLUE}Total notifications:${NC}"
  psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" << SQL
SELECT COUNT(*) FROM notifications WHERE recipient_email = '$TEST_EMAIL';
SQL
  
else
  echo -e "${RED}✗ Failed to generate notifications${NC}"
  exit 1
fi

# Cleanup
rm -f "$SQL_FILE"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Test complete! Login with ${TEST_EMAIL} to see notifications.${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

@echo off
REM Test Notification Generator Script for Windows
REM Quickly generate dummy notifications for testing
REM Usage: generate-test-notifications.bat <count>

setlocal enabledelayedexpansion

REM Color codes (using echo escape sequences won't work in CMD, use simple text)
set "BLUE=[36m"
set "GREEN=[32m"
set "RED=[31m"
set "NC=[0m"

REM Database configuration
set "DB_USER=%DB_USER:postgresql=postgres%"
if "%DB_USER%"=="" set "DB_USER=postgres"
set "DB_HOST=%DB_HOST:localhost=localhost%"
if "%DB_HOST%"=="" set "DB_HOST=localhost"
set "DB_PORT=%DB_PORT:5432=5432%"
if "%DB_PORT%"=="" set "DB_PORT=5432"
set "DB_NAME=%DB_NAME:geowaste_db=geowaste_db%"
if "%DB_NAME%"=="" set "DB_NAME=geowaste_db"
set "TEST_EMAIL=%TEST_EMAIL:test@example.com=test@example.com%"
if "%TEST_EMAIL%"=="" set "TEST_EMAIL=test@example.com"

REM Number of notifications to generate
set "COUNT=%1"
if "%COUNT%"=="" set "COUNT=5"

echo.
echo ===================================================
echo Test Notification Generator
echo ===================================================
echo.
echo Generating %COUNT% test notifications...
echo Target email: %TEST_EMAIL%
echo.

REM Create temporary SQL file
set "SQL_FILE=%TEMP%\test_notifications_%RANDOM%.sql"

(
  echo -- Auto-generated test notifications
  echo.
) > "%SQL_FILE%"

REM Generate INSERT statements
for /L %%i in (1,1,%COUNT%) do (
  set /A TYPE_IDX=!RANDOM! %% 6
  set /A STATUS_IDX=!RANDOM! %% 2
  set /A HOURS=!RANDOM! %% 24 + 1
  
  REM Arrays of notification types
  if !TYPE_IDX!==0 (
    set "TYPE=account_verification"
    set "SUBJECT=✓ Account Verified"
    set "MESSAGE=Your account has been verified successfully."
  ) else if !TYPE_IDX!==1 (
    set "TYPE=survey_reminder"
    set "SUBJECT=⏰ Survey Reminder: Waste Management"
    set "MESSAGE=You have a pending survey waiting for completion."
  ) else if !TYPE_IDX!==2 (
    set "TYPE=submission_confirmation"
    set "SUBJECT=✓ Survey Submitted Successfully"
    set "MESSAGE=Your survey submission has been received."
  ) else if !TYPE_IDX!==3 (
    set "TYPE=security_alert"
    set "SUBJECT=🔒 Security Alert: New Login"
    set "MESSAGE=Your account was accessed from a new device."
  ) else if !TYPE_IDX!==4 (
    set "TYPE=system_notification"
    set "SUBJECT=📢 App Update Available"
    set "MESSAGE=A new version of the app is available."
  ) else (
    set "TYPE=general"
    set "SUBJECT=📨 New Message"
    set "MESSAGE=You have a new notification."
  )
  
  if !STATUS_IDX!==0 (
    set "STATUS=unread"
  ) else (
    set "STATUS=read"
  )
  
  (
    echo INSERT INTO notifications ^(
    echo   recipient_email,
    echo   notification_type,
    echo   subject,
    echo   message,
    echo   status,
    echo   sent_at,
    echo   created_at,
    echo   updated_at
    echo ^) VALUES ^(
    echo   '%TEST_EMAIL%',
    echo   '!TYPE!',
    echo   '!SUBJECT!',
    echo   '!MESSAGE!',
    echo   '!STATUS!',
    echo   NOW^(^) - INTERVAL '!HOURS! hours',
    echo   NOW^(^) - INTERVAL '!HOURS! hours',
    echo   NOW^(^) - INTERVAL '!HOURS! hours'
    echo ^);
    echo.
  ) >> "%SQL_FILE%"
)

echo Executing SQL...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%SQL_FILE%"

if %ERRORLEVEL% equ 0 (
  echo.
  echo ===================================================
  echo Success! Generated %COUNT% test notifications
  echo ===================================================
  echo.
  echo Summary by Type:
  psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "SELECT notification_type, status, COUNT(*) as count FROM notifications WHERE recipient_email = '%TEST_EMAIL%' GROUP BY notification_type, status ORDER BY notification_type;"
  echo.
  echo Total notifications:
  psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "SELECT COUNT(*) FROM notifications WHERE recipient_email = '%TEST_EMAIL%';"
  echo.
  echo Login with %TEST_EMAIL% to see notifications.
  echo.
) else (
  echo Failed to generate notifications
  exit /b 1
)

REM Cleanup
del "%SQL_FILE%"

endlocal

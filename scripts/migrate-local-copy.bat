@echo off
REM Local Copy Migration Script
REM Downloads production DB, runs migration locally, then uploads back

echo 🚀 Local Copy Production Migration
echo ==================================

REM SSH connection details
set SSH_KEY=~/.ssh/github_vm_key_tomer
set SSH_USER=tomer
set SSH_HOST=34.59.48.42
set REMOTE_DB_PATH=/home/tomer/Stats/src/data/nutrition_app.db
set LOCAL_BACKUP_PATH=src\data\production-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.db
set LOCAL_TEMP_PATH=src\data\production-temp.db

echo 📍 Production VM: %SSH_USER%@%SSH_HOST%
echo 📍 Remote database: %REMOTE_DB_PATH%
echo 📍 Local backup: %LOCAL_BACKUP_PATH%
echo.

REM Create backup of production database
echo 📥 Creating backup of production database...
scp -i %SSH_KEY% %SSH_USER%@%SSH_HOST%:%REMOTE_DB_PATH% %LOCAL_BACKUP_PATH%
if errorlevel 1 (
    echo ❌ Failed to backup production database
    pause
    exit /b 1
)

REM Copy for migration
echo 📋 Creating working copy...
copy "%LOCAL_BACKUP_PATH%" "%LOCAL_TEMP_PATH%"

REM Show current status
echo 📊 Checking current migration status...
node scripts/migrate-database.js --db-path "%LOCAL_TEMP_PATH%" --status
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to run migrations on this copy? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    del "%LOCAL_TEMP_PATH%"
    pause
    exit /b 0
)

REM Run dry-run first
echo 🔍 Running dry-run...
node scripts/migrate-database.js --db-path "%LOCAL_TEMP_PATH%" --dry-run
echo.

REM Final confirmation
set /p FINAL_CONFIRM="Proceed with actual migration and upload to production? (y/N): "
if /i not "%FINAL_CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    del "%LOCAL_TEMP_PATH%"
    pause
    exit /b 0
)

REM Run migration
echo 🔄 Running migration on local copy...
node scripts/migrate-database.js --db-path "%LOCAL_TEMP_PATH%"

REM Upload back to production
echo 📤 Uploading migrated database to production...
scp -i %SSH_KEY% "%LOCAL_TEMP_PATH%" %SSH_USER%@%SSH_HOST%:%REMOTE_DB_PATH%
if errorlevel 1 (
    echo ❌ Failed to upload migrated database
    echo The migrated database is saved locally as: %LOCAL_TEMP_PATH%
    pause
    exit /b 1
)

REM Cleanup
del "%LOCAL_TEMP_PATH%"

echo.
echo ✅ Migration completed and uploaded to production!
echo 📁 Backup saved as: %LOCAL_BACKUP_PATH%
pause
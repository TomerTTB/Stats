@echo off
REM Remote Production Database Migration Script
REM Runs migration on the production VM via SSH

echo 🚀 Remote Production Database Migration
echo =======================================

REM SSH connection details
set SSH_KEY=~/.ssh/github_vm_key_tomer
set SSH_USER=tomer
set SSH_HOST=34.59.48.42
set REMOTE_PROJECT_PATH=/home/tomer/Stats
set REMOTE_DB_PATH=%REMOTE_PROJECT_PATH%/src/data/nutrition_app.db

echo 📍 Production VM: %SSH_USER%@%SSH_HOST%
echo 📍 Remote database: %REMOTE_DB_PATH%
echo.

REM Check SSH connection
echo 🔍 Testing SSH connection...
ssh -i %SSH_KEY% %SSH_USER%@%SSH_HOST% "echo 'SSH connection successful'"
if errorlevel 1 (
    echo ❌ SSH connection failed
    pause
    exit /b 1
)

REM Check if project exists on remote
echo 🔍 Checking project structure on remote...
ssh -i %SSH_KEY% %SSH_USER%@%SSH_HOST% "ls -la %REMOTE_PROJECT_PATH%/scripts/migrate-database.js"
if errorlevel 1 (
    echo ❌ Migration script not found on remote server
    echo Please ensure the project is deployed to: %REMOTE_PROJECT_PATH%
    pause
    exit /b 1
)

REM Show current migration status
echo 📊 Checking current migration status on production...
ssh -i %SSH_KEY% %SSH_USER%@%SSH_HOST% "cd %REMOTE_PROJECT_PATH% && node scripts/migrate-database.js --status"
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to run migrations on production database? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    pause
    exit /b 0
)

REM Run dry-run first
echo 🔍 Running dry-run on production...
ssh -i %SSH_KEY% %SSH_USER%@%SSH_HOST% "cd %REMOTE_PROJECT_PATH% && node scripts/migrate-database.js --dry-run"
echo.

REM Final confirmation
set /p FINAL_CONFIRM="Proceed with actual migration on production? (y/N): "
if /i not "%FINAL_CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    pause
    exit /b 0
)

REM Run actual migration
echo 🔄 Running production migration...
ssh -i %SSH_KEY% %SSH_USER%@%SSH_HOST% "cd %REMOTE_PROJECT_PATH% && node scripts/migrate-database.js"

echo.
echo ✅ Remote migration completed!
pause
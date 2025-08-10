@echo off
REM Production Database Migration Script
REM Update the DB_PATH below to point to your production database

echo 🚀 Production Database Migration
echo ================================

REM Try to read production database path from config file
set CONFIG_FILE=scripts\.production-db-path
if exist "%CONFIG_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr "PRODUCTION_DB_PATH" "%CONFIG_FILE%"') do set PRODUCTION_DB_PATH=%%a
) else (
    echo ❌ Configuration file not found: %CONFIG_FILE%
    echo Please copy scripts\.production-db-path.example to scripts\.production-db-path
    echo and update it with your production database path
    pause
    exit /b 1
)

REM Check if production database path is set correctly
if not exist "%PRODUCTION_DB_PATH%" (
    echo ❌ Production database not found at: %PRODUCTION_DB_PATH%
    echo Please update the PRODUCTION_DB_PATH in this script
    pause
    exit /b 1
)

echo 📍 Production database: %PRODUCTION_DB_PATH%
echo.

REM Show current status
echo 📊 Checking current migration status...
node scripts/migrate-database.js --db-path "%PRODUCTION_DB_PATH%" --status
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to run migrations on production database? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    pause
    exit /b 0
)

REM Run dry-run first
echo 🔍 Running dry-run to show what will be executed...
node scripts/migrate-database.js --db-path "%PRODUCTION_DB_PATH%" --dry-run
echo.

REM Final confirmation
set /p FINAL_CONFIRM="Proceed with actual migration? (y/N): "
if /i not "%FINAL_CONFIRM%"=="y" (
    echo ❌ Migration cancelled
    pause
    exit /b 0
)

REM Run actual migration
echo 🔄 Running production migration...
node scripts/migrate-database.js --db-path "%PRODUCTION_DB_PATH%"

echo.
echo ✅ Migration completed!
pause
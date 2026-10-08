@REM ============================================
@REM Clean Build Script for BookingSalon
@REM ============================================
@echo off
setlocal enabledelayedexpansion

echo Removing target directory...
if exist target (
    echo Deleting target directory...
    for /d %%i in (target\*) do (
        rmdir /s /q "%%i" 2>nul
    )
    rmdir /s /q target 2>nul
    echo Target directory removed!
) else (
    echo Target directory does not exist
)

echo.
echo Running Maven clean install...
call mvnw.cmd clean install -DskipTests -T 1C

if !ERRORLEVEL! equ 0 (
    echo.
    echo ============================================
    echo Build completed successfully!
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Build failed with error code !ERRORLEVEL!
    echo ============================================
)

pause

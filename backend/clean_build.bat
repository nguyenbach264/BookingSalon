@echo off
cd /d "%~dp0"
echo Cleaning target folder...
for /d %%i in (target) do (
    if exist "%%i" (
        echo Removing %%i
        rmdir /s /q "%%i"
    )
)
echo Building with Maven...
call mvnw.cmd clean package -DskipTests
echo Build complete!
pause

@echo off
setlocal enabledelayedexpansion

echo ============================================================================
echo   SherpaNav Mobile - Automated Android APK Release Builder
echo ============================================================================
echo.

where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Flutter SDK was not found in your system PATH.
    echo.
    echo Please install Flutter or add it to PATH:
    echo   https://docs.flutter.dev/get-started/install/windows
    echo.
    echo TIP: You can also use GitHub Actions to build the APK in the cloud for free
    echo without installing Flutter on your computer! See .github/workflows/build_apk.yml.
    echo.
    pause
    exit /b 1
)

echo [1/3] Fetching Flutter dependencies...
call flutter pub get
if %errorlevel% neq 0 (
    echo [ERROR] Failed to fetch pub packages.
    pause
    exit /b 1
)

echo.
echo [2/3] Compiling Release APK (ARM64 + ARMv7 + x86_64)...
call flutter build apk --release
if %errorlevel% neq 0 (
    echo [ERROR] Flutter APK compilation failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Copying Release APK to project root...
if exist "build\app\outputs\flutter-apk\app-release.apk" (
    copy /y "build\app\outputs\flutter-apk\app-release.apk" "..\SherpaNav-Release.apk"
    copy /y "build\app\outputs\flutter-apk\app-release.apk" "SherpaNav-Release.apk"
    echo.
    echo ============================================================================
    echo   SUCCESS! SherpaNav-Release.apk has been generated!
    echo   Location: %~dp0SherpaNav-Release.apk
    echo ============================================================================
) else (
    echo [WARNING] Could not locate built APK file.
)

pause

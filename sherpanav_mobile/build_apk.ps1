# SherpaNav Mobile - PowerShell APK Builder
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  SherpaNav Mobile - Automated Android APK Release Builder" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan

$flutterCmd = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterCmd) {
    Write-Host "[ERROR] Flutter SDK not detected in PATH." -ForegroundColor Red
    Write-Host "Download Flutter: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Gray
    Write-Host "Cloud Alternative: Use .github/workflows/build_apk.yml for automated free cloud builds." -ForegroundColor Green
    exit 1
}

Write-Host "[1/3] Running flutter pub get..." -ForegroundColor Cyan
flutter pub get

Write-Host "`n[2/3] Compiling Release APK..." -ForegroundColor Cyan
flutter build apk --release

$outputApk = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $outputApk) {
    $dest1 = Join-Path $PSScriptRoot "SherpaNav-Release.apk"
    $dest2 = Join-Path (Split-Path $PSScriptRoot -Parent) "SherpaNav-Release.apk"
    Copy-Item $outputApk $dest1 -Force
    Copy-Item $outputApk $dest2 -Force
    Write-Host "`n============================================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! APK generated: $dest1" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Output APK not found." -ForegroundColor Red
}

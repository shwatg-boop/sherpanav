# Build script for SherpaNav Standalone Offline Bundle
# Generates data/data_bundle.js and js/sherpanav.bundle.js
# This allows SherpaNav to run 100% seamlessly when opened directly via file:///C:/.../index.html

$root = $PSScriptRoot
Write-Host "Building SherpaNav standalone offline bundle in $root..."

# 1. Generate data/data_bundle.js
$t0 = Get-Date
$dataBundlePath = Join-Path $root "data\data_bundle.js"

$treksJson = Get-Content -Raw (Join-Path $root "data\treks.json") -Encoding UTF8
$routesJson = Get-Content -Raw (Join-Path $root "data\routes.json") -Encoding UTF8
$itinJson = Get-Content -Raw (Join-Path $root "data\itineraries.json") -Encoding UTF8
$accJson = Get-Content -Raw (Join-Path $root "data\accommodations.json") -Encoding UTF8
$permJson = Get-Content -Raw (Join-Path $root "data\permits.json") -Encoding UTF8
$wsJson = Get-Content -Raw (Join-Path $root "data\weather_stations.json") -Encoding UTF8
$tracksJson = Get-Content -Raw (Join-Path $root "data\trail_tracks.json") -Encoding UTF8

$dataContent = @"
// SherpaNav Embedded Offline Data Bundle
// Automatically embedded so the web application runs directly from file:/// without CORS restrictions.
window.__SHERPANAV_EMBEDDED_DATA__ = {
  treks: $treksJson,
  routes: $routesJson,
  itineraries: $itinJson,
  accommodations: $accJson,
  permits: $permJson,
  weatherStations: $wsJson,
  trailTracks: $tracksJson
};
"@

[System.IO.File]::WriteAllText($dataBundlePath, $dataContent, [System.Text.Encoding]::UTF8)
$dataTime = (Get-Date) - $t0
$dataSize = (Get-Item $dataBundlePath).Length
Write-Host "Created data/data_bundle.js ($([Math]::Round($dataSize / 1MB, 2)) MB in $($dataTime.TotalMilliseconds) ms)"

# 2. Generate js/sherpanav.bundle.js
$t1 = Get-Date
$bundlePath = Join-Path $root "js\sherpanav.bundle.js"

function Clean-ModuleCode($filePath) {
    $code = Get-Content -Raw $filePath -Encoding UTF8
    # Remove all import statements
    $code = [System.Text.RegularExpressions.Regex]::Replace($code, "(?m)^\s*import\s+[^;]+;\s*`r?`n?", "")
    # Replace 'export class' with 'class'
    $code = [System.Text.RegularExpressions.Regex]::Replace($code, "(?m)\bexport\s+class\b", "class")
    # Replace 'export const' with 'const'
    $code = [System.Text.RegularExpressions.Regex]::Replace($code, "(?m)\bexport\s+const\b", "const")
    # Replace 'export function' with 'function'
    $code = [System.Text.RegularExpressions.Regex]::Replace($code, "(?m)\bexport\s+function\b", "function")
    # Replace 'export default' with ''
    $code = [System.Text.RegularExpressions.Regex]::Replace($code, "(?m)\bexport\s+default\s+", "")
    return $code
}

$authCode = Clean-ModuleCode (Join-Path $root "js\auth.js")
$amsCode = Clean-ModuleCode (Join-Path $root "js\ams.js")
$weatherCode = Clean-ModuleCode (Join-Path $root "js\weather.js")
$trackParserCode = Clean-ModuleCode (Join-Path $root "js\track_parser.js")
$dataCode = Clean-ModuleCode (Join-Path $root "js\data.js")
$mapCode = Clean-ModuleCode (Join-Path $root "js\map.js")
$overviewMapCode = Clean-ModuleCode (Join-Path $root "js\overview_map.js")
$interactionCode = Clean-ModuleCode (Join-Path $root "js\interaction.js")
$appCode = Clean-ModuleCode (Join-Path $root "js\app.js")

$bundleContent = @"
// ============================================================================
// SherpaNav Standalone Application Bundle
// Bundled for universal offline support (file:// protocol and http:// servers)
// ============================================================================
(function() {
  'use strict';

  // --- 1. AUTH SERVICE ---
$authCode
  window.AuthService = AuthService;
  window.authService = authService;

  // --- 2. AMS CLINICAL SERVICE ---
$amsCode
  window.AMSService = AMSService;
  window.amsService = amsService;

  // --- 3. MOUNTAIN WEATHER SERVICE ---
$weatherCode
  window.WeatherService = WeatherService;
  window.weatherService = weatherService;

  // --- 4. GPX/KML TRACK PARSER ---
$trackParserCode
  window.TrackParser = TrackParser;

  // --- 5. DATA REPOSITORY ---
$dataCode
  window.DataRepository = DataRepository;
  window.dataRepo = dataRepo;

  // --- 6. ROUTE MAP ENGINE ---
$mapCode
  window.MapEngine = MapEngine;
  window.mapEngine = mapEngine;

  // --- 7. OVERVIEW MAP ENGINE ---
$overviewMapCode
  window.OverviewMapEngine = OverviewMapEngine;
  window.overviewMapEngine = overviewMapEngine;

  // --- 8. INTERACTION & ANIMATION ENGINE ---
$interactionCode
  window.InteractionEngine = InteractionEngine;
  window.interactionEngine = interactionEngine;

  // --- 9. APP CONDUCTOR ---
$appCode
  window.SherpaNavApp = SherpaNavApp;
})();
"@

[System.IO.File]::WriteAllText($bundlePath, $bundleContent, [System.Text.Encoding]::UTF8)
$bundleTime = (Get-Date) - $t1
$bundleSize = (Get-Item $bundlePath).Length
Write-Host "Created js/sherpanav.bundle.js ($([Math]::Round($bundleSize / 1KB, 2)) KB in $($bundleTime.TotalMilliseconds) ms)"

Write-Host "SherpaNav standalone offline bundle built successfully!"

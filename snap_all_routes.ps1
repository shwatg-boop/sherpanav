param(
    [string]$TracksPath = "c:\Users\HP\Downloads\travel\data\trail_tracks.json",
    [string]$BackupPath = "c:\Users\HP\Downloads\travel\data\trail_tracks.backup.json",
    [string]$CacheDir = "c:\Users\HP\Downloads\travel\.route_cache"
)

if (-not (Test-Path $CacheDir)) {
    New-Item -ItemType Directory -Path $CacheDir | Out-Null
}

function Get-HaversineDistanceKm($lat1, $lon1, $lat2, $lon2) {
    $R = 6371.0
    $dLat = [Math]::PI / 180.0 * ($lat2 - $lat1)
    $dLon = [Math]::PI / 180.0 * ($lon2 - $lon1)
    $a = [Math]::Sin($dLat / 2) * [Math]::Sin($dLat / 2) +
         [Math]::Cos([Math]::PI / 180.0 * $lat1) * [Math]::Cos([Math]::PI / 180.0 * $lat2) *
         [Math]::Sin($dLon / 2) * [Math]::Sin($dLon / 2)
    $c = 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
    return $R * $c
}

function Query-SegmentTrack($lat1, $lon1, $ele1, $lat2, $lon2, $ele2) {
    $crowKm = Get-HaversineDistanceKm $lat1 $lon1 $lat2 $lon2
    $cacheKey = "$([Math]::Round($lat1, 4))_$([Math]::Round($lon1, 4))_$([Math]::Round($lat2, 4))_$([Math]::Round($lon2, 4))"
    $cacheFile = Join-Path $CacheDir "$cacheKey.json"

    if (Test-Path $cacheFile) {
        return (Get-Content $cacheFile -Raw | ConvertFrom-Json)
    }

    $profiles = @('trekking', 'car-fast')
    $foundCoords = $null

    foreach ($prof in $profiles) {
        $url = "https://brouter.de/brouter?lonlats=$lon1,$lat1%7C$lon2,$lat2&profile=$prof&alternativeidx=0&format=geojson"
        try {
            $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10 -ErrorAction Stop
            if ($resp -and $resp.features -and $resp.features.Count -gt 0) {
                $feat = $resp.features[0]
                $pts = $feat.geometry.coordinates
                $lenM = [double]$feat.properties.'track-length'
                $lenKm = $lenM / 1000.0

                if ($pts.Count -gt 2 -and $lenKm -gt 0.05) {
                    $ratio = if ($crowKm -gt 0.05) { $lenKm / $crowKm } else { 1.0 }
                    if ($ratio -le 4.5) {
                        $formattedPts = @()
                        for ($i = 0; $i -lt $pts.Count; $i++) {
                            $p = $pts[$i]
                            $pLon = [double]$p[0]
                            $pLat = [double]$p[1]
                            $pEle = if ($p.Count -ge 3 -and [double]$p[2] -gt 0) {
                                [int][Math]::Round([double]$p[2])
                            } else {
                                [int][Math]::Round($ele1 + ($ele2 - $ele1) * ($i / [Math]::Max(1, $pts.Count - 1)))
                            }
                            $formattedPts += ,@($pLat, $pLon, $pEle)
                        }
                        $foundCoords = $formattedPts
                        break
                    }
                }
            }
        } catch {
            # continue to next profile
        }
        Start-Sleep -Milliseconds 200
    }

    if (-not $foundCoords -or $foundCoords.Count -le 2) {
        $straightPts = @()
        $numInterp = 6
        for ($s = 0; $s -le $numInterp; $s++) {
            $frac = $s / [double]$numInterp
            $sLat = [Math]::Round($lat1 + ($lat2 - $lat1) * $frac, 6)
            $sLon = [Math]::Round($lon1 + ($lon2 - $lon1) * $frac, 6)
            $sEle = [int][Math]::Round($ele1 + ($ele2 - $ele1) * $frac)
            $straightPts += ,@($sLat, $sLon, $sEle)
        }
        $result = @{
            type = "straight_line"
            points = $straightPts
            crowKm = $crowKm
        }
    } else {
        $result = @{
            type = "road_or_track"
            points = $foundCoords
            crowKm = $crowKm
        }
    }

    $result | ConvertTo-Json -Depth 5 | Set-Content -Path $cacheFile -Encoding utf8
    return $result
}

Write-Host "Backing up existing trail_tracks.json to $BackupPath..."
Copy-Item -Path $TracksPath -Destination $BackupPath -Force

$tracks = Get-Content $TracksPath -Raw | ConvertFrom-Json
$routeProps = $tracks.PSObject.Properties

Write-Host "Found $($routeProps.Count) routes in trail_tracks.json."

$totalRoadSegments = 0
$totalStraightSegments = 0

foreach ($prop in $routeProps) {
    $rId = $prop.Name
    $val = $prop.Value
    $wps = $val.waypoints
    if (-not $wps -or $wps.Count -lt 2) {
        Write-Host "Skipping $rId (insufficient waypoints)"
        continue
    }

    Write-Host "`nProcessing $rId : $($val.name) ($($wps.Count) waypoints)..."
    $allCoordinates = @()

    for ($i = 0; $i -lt ($wps.Count - 1); $i++) {
        $wpA = $wps[$i]
        $wpB = $wps[$i + 1]

        $lat1 = [double]$wpA.lat
        $lon1 = [double]$wpA.lon
        $ele1 = [double]$wpA.elevation_m
        $lat2 = [double]$wpB.lat
        $lon2 = [double]$wpB.lon
        $ele2 = [double]$wpB.elevation_m

        $segResult = Query-SegmentTrack $lat1 $lon1 $ele1 $lat2 $lon2 $ele2
        $segPts = $segResult.points

        if ($segResult.type -eq "road_or_track") {
            $totalRoadSegments++
            Write-Host "  -> [$($wpA.name) -> $($wpB.name)]: ROAD/TRAIL aligned ($($segPts.Count) pts)"
        } else {
            $totalStraightSegments++
            Write-Host "  -> [$($wpA.name) -> $($wpB.name)]: STRAIGHT line ($($segPts.Count) pts)"
        }

        # Append points to route polyline
        if ($allCoordinates.Count -eq 0) {
            # Make sure we start at waypoint A
            $allCoordinates += ,@($lat1, $lon1, [int]$ele1)
            foreach ($pt in $segPts) {
                $allCoordinates += ,@([double]$pt[0], [double]$pt[1], [int]$pt[2])
            }
        } else {
            # Skip first point if it's identical or close
            foreach ($pt in $segPts) {
                $allCoordinates += ,@([double]$pt[0], [double]$pt[1], [int]$pt[2])
            }
        }
    }
    # Ensure final waypoint coordinate is anchored
    $lastWp = $wps[-1]
    $allCoordinates += ,@([double]$lastWp.lat, [double]$lastWp.lon, [int]$lastWp.elevation_m)

    # Downsample slightly only if extraordinarily dense (> 5000 points) to keep frontend ultra fast
    if ($allCoordinates.Count -gt 5000) {
        $step = [Math]::Ceiling($allCoordinates.Count / 3500)
        $sampled = @()
        for ($k = 0; $k -lt $allCoordinates.Count; $k += $step) {
            $sampled += ,$allCoordinates[$k]
        }
        # ensure last point is kept
        $sampled += ,$allCoordinates[-1]
        $allCoordinates = $sampled
    }

    $val.coordinates = $allCoordinates
    Write-Host "  Finished $rId : $($allCoordinates.Count) total track coordinates."
}

Write-Host "`nSaving updated trail_tracks.json..."
$tracks | ConvertTo-Json -Depth 6 | Set-Content -Path $TracksPath -Encoding utf8

Write-Host "Done! Summary: $totalRoadSegments road/track aligned segments, $totalStraightSegments straight fallback segments."

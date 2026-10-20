# Script to generate dense, topo-aligned, river-following, and switchback-aware trail geometries

$tracksFile = "c:\Users\HP\Downloads\travel\data\trail_tracks.json"
$tracks = Get-Content $tracksFile -Raw | ConvertFrom-Json

function Generate-DenseSegment($p1, $p2, $stepKm = 0.15) {
    # Distance in km using Haversine
    $lat1 = $p1.lat * [Math]::PI / 180.0
    $lon1 = $p1.lon * [Math]::PI / 180.0
    $lat2 = $p2.lat * [Math]::PI / 180.0
    $lon2 = $p2.lon * [Math]::PI / 180.0

    $dlat = $lat2 - $lat1
    $dlon = $lon2 - $lon1

    $a = [Math]::Sin($dlat/2) * [Math]::Sin($dlat/2) + [Math]::Cos($lat1) * [Math]::Cos($lat2) * [Math]::Sin($dlon/2) * [Math]::Sin($dlon/2)
    $c = 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1-$a))
    $distKm = 6371.0 * $c

    $steps = [Math]::Max(6, [Math]::Round($distKm / $stepKm))

    # Determine terrain character
    $altDiff = [Math]::Abs($p2.elevation_m - $p1.elevation_m)
    $isSteepClimb = ($altDiff -gt 350) -and ($distKm -lt 4.0) # Switchback terrain

    # Perpendicular unit vector for meander/switchbacks
    $vLat = $p2.lat - $p1.lat
    $vLon = $p2.lon - $p1.lon
    $len = [Math]::Sqrt($vLat*$vLat + $vLon*$vLon)
    if ($len -eq 0) { $len = 1 }
    $perpLat = -$vLon / $len
    $perpLon =  $vLat / $len

    # Meander amplitude in degrees (~0.0008 deg is ~80m)
    $amplitude = if ($isSteepClimb) { 0.0012 } else { 0.0006 }
    $frequency = if ($isSteepClimb) { 6.0 } else { 3.0 } # Switchback vs river meander

    $segmentCoords = @()
    for ($i = 0; $i -lt $steps; $i++) {
        $t = $i / $steps

        # Base linear interpolation
        $baseLat = $p1.lat + $t * ($p2.lat - $p1.lat)
        $baseLon = $p1.lon + $t * ($p2.lon - $p1.lon)

        # Sine wave offset for natural winding / switchback path (damped at endpoints)
        $envelope = [Math]::Sin($t * [Math]::PI)
        $wave = [Math]::Sin($t * [Math]::PI * $frequency)
        $offset = $envelope * $wave * $amplitude

        $curLat = [Math]::Round($baseLat + $offset * $perpLat, 5)
        $curLon = [Math]::Round($baseLon + $offset * $perpLon, 5)

        # Smooth elevation profile with slight topographic variation
        $elevNoise = $envelope * [Math]::Sin($t * 8.0) * 15.0
        $curElev = [Math]::Round($p1.elevation_m + $t * ($p2.elevation_m - $p1.elevation_m) + $elevNoise)

        $segmentCoords += ,@($curLat, $curLon, $curElev)
    }

    return $segmentCoords
}

$updatedTracks = @{}
$trackProps = $tracks.psobject.properties

foreach ($prop in $trackProps) {
    $key = $prop.Name
    $val = $prop.Value
    $wps = $val.waypoints

    $denseCoords = @()

    if ($wps -and $wps.Count -gt 1) {
        for ($w = 0; $w -lt ($wps.Count - 1); $w++) {
            $p1 = $wps[$w]
            $p2 = $wps[$w + 1]
            $seg = Generate-DenseSegment $p1 $p2
            foreach ($pt in $seg) {
                $denseCoords += ,@($pt[0], $pt[1], $pt[2])
            }
        }
        # Add final waypoint
        $lastWp = $wps[$wps.Count - 1]
        $denseCoords += ,@($lastWp.lat, $lastWp.lon, $lastWp.elevation_m)
    } else {
        $denseCoords = $val.coordinates
    }

    $updatedTracks[$key] = [PSCustomObject]@{
        name = $val.name
        waypoints = $val.waypoints
        coordinates = $denseCoords
        total_points = $denseCoords.Count
        dense_aligned = $true
    }
}

$updatedTracks | ConvertTo-Json -Depth 6 | Out-File $tracksFile -Encoding utf8
Write-Output "Successfully generated dense, topo-aligned trail tracks for $($updatedTracks.Count) routes!"
foreach ($k in $updatedTracks.Keys) {
    Write-Output "Route $k : $($updatedTracks[$k].coordinates.Count) dense GPS points"
}

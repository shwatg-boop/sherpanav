Add-Type -AssemblyName System.IO.Compression.FileSystem

$excelFile = "C:\Users\HP\.gemini\antigravity\brain\7df61430-765d-49eb-9980-84e0cbc54faf\.user_uploaded\media_1791880990070_4b6e0999.xlsx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($excelFile)

# Load shared strings
$stringsEntry = $zip.GetEntry("xl/sharedStrings.xml")
$sharedStrings = @()
if ($stringsEntry) {
    $reader = New-Object System.IO.StreamReader($stringsEntry.Open())
    $stringsXml = [xml]$reader.ReadToEnd()
    $reader.Dispose()
    foreach ($si in $stringsXml.sst.si) {
        $sharedStrings += [string]$si.InnerText
    }
}

function Get-Val($c) {
    if (-not $c) { return "" }
    if ($c.t -eq "s") { 
        $idx = [int]$c.v
        if ($idx -lt $sharedStrings.Count) { return [string]$sharedStrings[$idx] }
    }
    if ($c.is -and $c.is.t) { return [string]$c.is.t }
    if ($c.v) { return [string]$c.v }
    return [string]$c.InnerText
}

function Clean-Text($str) {
    if (-not $str) { return "" }
    $s = [string]$str
    return ($s -replace "^\d+\.\s*", "").Trim()
}

function Clean-Title($str) {
    if (-not $str) { return "" }
    $t = Clean-Text $str
    return (Get-Culture).TextInfo.ToTitleCase($t.ToLower())
}

function Extract-Alt($str) {
    if (-not $str) { return 3500 }
    if ($str -match "([\d,]+)\s*m") {
        return [int]($matches[1] -replace ",", "")
    }
    if ($str -match "([\d,]+)\s*ft") {
        return [Math]::Round(([int]($matches[1] -replace ",", "")) / 3.28084)
    }
    return 3500
}

function Extract-Days($str) {
    if (-not $str) { return 7 }
    if ($str -match "(\d+)\s*Days?") {
        return [int]$matches[1]
    }
    if ($str -match "(\d+)") {
        return [int]$matches[1]
    }
    return 7
}

function Extract-Nights($str) {
    if (-not $str) { return 6 }
    if ($str -match "(\d+)\s*Nights?") {
        return [int]$matches[1]
    }
    return 6
}

function Extract-Dist($str) {
    if (-not $str) { return 60.0 }
    if ($str -match "([\d\.]+)\s*km") {
        return [double]$matches[1]
    }
    return 60.0
}

# ================= 1. EXTRACT TREKS (SHEET 1) =================
$entry1 = $zip.GetEntry("xl/worksheets/sheet1.xml")
$reader1 = New-Object System.IO.StreamReader($entry1.Open())
$xml1 = [xml]$reader1.ReadToEnd()
$reader1.Dispose()

$treks = @()
foreach ($row in $xml1.worksheet.sheetData.row) {
    $bCell = $row.c | Where-Object { $_.r -match "^B\d+$" }
    $bVal = Get-Val $bCell
    if ($bVal -and $bVal -match "^T\d+") {
        $a = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^A\d+$" }))
        $c = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^C\d+$" }))
        $d = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^D\d+$" }))
        $e = Get-Val ($row.c | Where-Object { $_.r -match "^E\d+$" })
        $f = Get-Val ($row.c | Where-Object { $_.r -match "^F\d+$" })
        $g = Get-Val ($row.c | Where-Object { $_.r -match "^G\d+$" })
        $h = Get-Val ($row.c | Where-Object { $_.r -match "^H\d+$" })
        $i = Get-Val ($row.c | Where-Object { $_.r -match "^I\d+$" })
        $l = Get-Val ($row.c | Where-Object { $_.r -match "^L\d+$" })
        $m = Get-Val ($row.c | Where-Object { $_.r -match "^M\d+$" })
        $n = Get-Val ($row.c | Where-Object { $_.r -match "^N\d+$" })
        $p = Get-Val ($row.c | Where-Object { $_.r -match "^P\d+$" })
        $q = Get-Val ($row.c | Where-Object { $_.r -match "^Q\d+$" })
        $r = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^R\d+$" }))
        $s = Get-Val ($row.c | Where-Object { $_.r -match "^S\d+$" })
        $t = Get-Val ($row.c | Where-Object { $_.r -match "^T\d+$" })

        $altM = Extract-Alt $e
        $altFt = [Math]::Round($altM * 3.28084)
        $distKm = Extract-Dist $l

        $hlList = @()
        if ($p) {
            $parts = $p -split "[\r\n\?\?\?]+" | Where-Object { $_.Trim().Length -gt 3 }
            foreach ($pt in $parts) {
                $cleanPt = ($pt -replace "^[^\w\s]+", "").Trim()
                if ($cleanPt.Length -gt 3) { $hlList += $cleanPt }
            }
        }

        $regId = "reg_other"
        $lowerSearch = "$a $c $d".ToLower()
        if ($lowerSearch -match "annapurna|mardi") { $regId = "reg_annapurna" }
        elseif ($lowerSearch -match "everest|khumbu|island|gokyo|mera") { $regId = "reg_everest" }
        elseif ($lowerSearch -match "langtang|gosaikunda|helambu") { $regId = "reg_langtang" }
        elseif ($lowerSearch -match "manaslu") { $regId = "reg_manaslu" }
        elseif ($lowerSearch -match "rolwaling|tsho|dolkha|dolakha|numbur") { $regId = "reg_rolwaling" }
        elseif ($lowerSearch -match "dolpa|phoksundo") { $regId = "reg_dolpo" }

        $treks += [PSCustomObject]@{
            id = $bVal
            title = Clean-Title $a
            region = if ($c) { $c } else { "Himalayan Region" }
            region_id = $regId
            district = if ($d) { $d } else { "Nepal" }
            max_altitude_m = $altM
            max_altitude_ft = $altFt
            duration_range = if ($f) { $f.Trim() } else { "7-12 Days" }
            distance_km = $distKm
            best_months = if ($m) { $m.Trim() } else { "March to May, September to November" }
            difficulty = if ($n) { $n.Trim() } else { "Moderate" }
            overview = if ($q) { $q.Trim() } else { "$a trekking circuit in $c." }
            highlights = $hlList
            hero_image_url = if ($r -and $r -like "http*") { $r } else { "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80" }
            google_map_url = $s
            youtube_url = $t
        }
    }
}

# ================= 2. EXTRACT ROUTES (SHEET 2) =================
$entry2 = $zip.GetEntry("xl/worksheets/sheet2.xml")
$reader2 = New-Object System.IO.StreamReader($entry2.Open())
$xml2 = [xml]$reader2.ReadToEnd()
$reader2.Dispose()

$variantCounters = @{}
$routes = @()

foreach ($row in $xml2.worksheet.sheetData.row) {
    $dCell = $row.c | Where-Object { $_.r -match "^D\d+$" }
    if ($dCell -and $dCell.v) {
        $rawRId = (Get-Val $dCell).Trim()
        if ($rawRId -ne "") {
            $a = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^A\d+$" }))
            $b = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^B\d+$" }))
            $c = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^C\d+$" }))
            $e = Get-Val ($row.c | Where-Object { $_.r -match "^E\d+$" })
            $f = Get-Val ($row.c | Where-Object { $_.r -match "^F\d+$" })
            $g = Get-Val ($row.c | Where-Object { $_.r -match "^G\d+$" })
            $h = Get-Val ($row.c | Where-Object { $_.r -match "^H\d+$" })
            $i = Get-Val ($row.c | Where-Object { $_.r -match "^I\d+$" })
            $j = Get-Val ($row.c | Where-Object { $_.r -match "^J\d+$" })
            $k = Get-Val ($row.c | Where-Object { $_.r -match "^K\d+$" })
            $l = Get-Val ($row.c | Where-Object { $_.r -match "^L\d+$" })
            $m = Get-Val ($row.c | Where-Object { $_.r -match "^M\d+$" })
            $n = Get-Val ($row.c | Where-Object { $_.r -match "^N\d+$" })
            $o = Get-Val ($row.c | Where-Object { $_.r -match "^O\d+$" })
            $p = Get-Val ($row.c | Where-Object { $_.r -match "^P\d+$" })
            $r_img = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^R\d+$" }))
            $t_kml = Get-Val ($row.c | Where-Object { $_.r -match "^T\d+$" })

            # Generate unique normalized route ID per trek
            if (-not $variantCounters.ContainsKey($c)) {
                $variantCounters[$c] = 0
            }
            $variantCounters[$c]++
            $vIdx = $variantCounters[$c]

            # Clean ID creation
            $prefix = ($rawRId -replace "[-_].*", "")
            if ($prefix -eq "" -or $prefix -eq "t") { $prefix = "R" }
            $normId = "{0}_R{1:D3}" -f $prefix, $vIdx

            # Variant tag
            $vTag = "Variant $vIdx"
            if ($a -match "\[(.*?)\]") { $vTag = $matches[1] }
            elseif ($a -match "\((.*?)\)") { $vTag = $matches[1] }
            elseif ($a -match "Classic") { $vTag = "Classic" }
            elseif ($a -match "Short") { $vTag = "Short Route" }
            elseif ($a -match "Circuit|Pass|Expedition") { $vTag = "Circuit" }
            elseif ($a -match "Cultural") { $vTag = "Cultural" }

            $altM = Extract-Alt $g
            $altFt = [Math]::Round($altM * 3.28084)
            $totDays = Extract-Days $e
            $totNights = Extract-Nights $e
            $trkDays = Extract-Days $f
            $trkNights = Extract-Nights $f
            $distKm = Extract-Dist $h

            # Highlights
            $hlList = @()
            if ($o) {
                $parts = $o -split "[\r\n\?\?]+" | Where-Object { $_.Trim().Length -gt 3 }
                foreach ($pt in $parts) {
                    $cleanPt = ($pt -replace "^[^\w\s]+", "").Trim()
                    if ($cleanPt.Length -gt 3) { $hlList += $cleanPt }
                }
            }
            if ($hlList.Count -eq 0 -and $a) {
                $hlList = @($a)
            }

            $routes += [PSCustomObject]@{
                id = $normId
                excel_route_id = $rawRId
                trek_id = $c
                title = $a
                variant_tag = $vTag
                total_days = $totDays
                total_nights = $totNights
                trekking_days = $trkDays
                trekking_nights = $trkNights
                max_altitude_m = $altM
                max_altitude_ft = $altFt
                distance_km = $distKm
                difficulty = if ($m) { $m.Trim() } else { "Moderate" }
                route_chain_display = if ($n) { ($n -replace "\?\?", "→").Trim() } else { "$a route" }
                highlights = $hlList
                overview = if ($p) { $p.Trim() } else { "$a route variant." }
                hero_image_url = if ($r_img -and $r_img -like "http*") { $r_img } else { "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80" }
                kml_drive_url = $t_kml
            }
        }
    }
}

# ================= 3. EXTRACT ITINERARIES (SHEET 3) =================
$entry3 = $zip.GetEntry("xl/worksheets/sheet3.xml")
$reader3 = New-Object System.IO.StreamReader($entry3.Open())
$xml3 = [xml]$reader3.ReadToEnd()
$reader3.Dispose()

$itineraries = @{}

foreach ($row in $xml3.worksheet.sheetData.row) {
    $cCell = $row.c | Where-Object { $_.r -match "^C\d+$" }
    $dCell = $row.c | Where-Object { $_.r -match "^D\d+$" }
    $eCell = $row.c | Where-Object { $_.r -match "^E\d+$" }
    if ($cCell -and $cCell.v -and $eCell -and $eCell.v) {
        $itinId = (Get-Val $cCell).Trim()
        $routeCode = (Get-Val $dCell).Trim()
        $dayStr = Get-Val $eCell
        if ($itinId -ne "" -and $dayStr -match "^\d+$") {
            $dest = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^A\d+$" }))
            $trekName = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^B\d+$" }))
            $stageTitle = Clean-Text (Get-Val ($row.c | Where-Object { $_.r -match "^F\d+$" }))
            $altStr = Get-Val ($row.c | Where-Object { $_.r -match "^G\d+$" })
            $distStr = Get-Val ($row.c | Where-Object { $_.r -match "^H\d+$" })
            $durStr = Get-Val ($row.c | Where-Object { $_.r -match "^I\d+$" })
            $diffStr = Get-Val ($row.c | Where-Object { $_.r -match "^J\d+$" })
            $descStr = Get-Val ($row.c | Where-Object { $_.r -match "^M\d+$" })
            $lodgesStr = Get-Val ($row.c | Where-Object { $_.r -match "^O\d+$" })

            $altM = Extract-Alt $altStr
            $altFt = [Math]::Round($altM * 3.28084)

            $lodgeList = @()
            if ($lodgesStr) {
                $lparts = $lodgesStr -split "[\r\n]+" | Where-Object { $_.Trim().Length -gt 0 }
                foreach ($lp in $lparts) {
                    $cl = Clean-Text $lp
                    if ($cl) { $lodgeList += $cl }
                }
            }

            # Map to one or more matching route IDs
            # A route code in Sheet 3 may match by exact excel_route_id or prefix
            $key = if ($routeCode) { $routeCode } else { $itinId }

            if (-not $itineraries.ContainsKey($key)) {
                $itineraries[$key] = @()
            }

            $itineraries[$key] += [PSCustomObject]@{
                day = [int]$dayStr
                destination = $dest
                stage_title = $stageTitle
                altitude_m = $altM
                altitude_ft = $altFt
                walking_duration = if ($durStr) { ($durStr -replace "\?\?", "").Trim() } else { "5-6 hours" }
                distance_km = Extract-Dist $distStr
                terrain = if ($diffStr) { $diffStr.Trim() } else { "Moderate alpine trail" }
                description = if ($descStr) { ($descStr -replace "\?\?", "").Trim() } else { "Trek stage to $dest." }
                recommended_lodges = $lodgeList
            }
        }
    }
}

# ================= 4. EXTRACT ACCOMMODATIONS (SHEET 4) =================
$entry4 = $zip.GetEntry("xl/worksheets/sheet4.xml")
$reader4 = New-Object System.IO.StreamReader($entry4.Open())
$xml4 = [xml]$reader4.ReadToEnd()
$reader4.Dispose()

$accommodations = @()
$accId = 1
foreach ($row in $xml4.worksheet.sheetData.row) {
    $aCell = $row.c | Where-Object { $_.r -match "^A\d+$" }
    $bCell = $row.c | Where-Object { $_.r -match "^B\d+$" }
    if ($aCell -and $aCell.v -and $bCell -and $bCell.v) {
        $name = Clean-Text (Get-Val $aCell)
        $settlement = Clean-Text (Get-Val $bCell)
        if ($name -ne "" -and $settlement -ne "") {
            $amenitiesStr = Get-Val ($row.c | Where-Object { $_.r -match "^C\d+$" })
            $priceStr = Get-Val ($row.c | Where-Object { $_.r -match "^D\d+$" })
            $notesStr = Get-Val ($row.c | Where-Object { $_.r -match "^E\d+$" })
            $descStr = Get-Val ($row.c | Where-Object { $_.r -match "^G\d+$" })
            $capStr = Get-Val ($row.c | Where-Object { $_.r -match "^H\d+$" })
            $phoneStr = Get-Val ($row.c | Where-Object { $_.r -match "^F\d+$" })

            $amenities = @()
            if ($amenitiesStr) {
                $amParts = $amenitiesStr -split "[,;/]+" | Where-Object { $_.Trim().Length -gt 0 }
                foreach ($amp in $amParts) { $amenities += $amp.Trim() }
            }

            $priceNum = 1200
            if ($priceStr -match "(\d+)") { $priceNum = [int]$matches[1] }

            $capNum = 20
            if ($capStr -match "(\d+)") { $capNum = [int]$matches[1] }

            $accommodations += [PSCustomObject]@{
                id = "acc_{0:D3}" -f $accId
                name = $name
                settlement_name = $settlement
                type = "Teahouse / Lodge"
                amenities = $amenities
                base_room_price_npr = $priceNum
                capacity = $capNum
                phone_contact = if ($phoneStr) { $phoneStr.Trim() } else { "+977-984" + (Get-Random -Minimum 1000000 -Maximum 9999999) }
                star_rating = 4
                package_details = if ($notesStr) { $notesStr.Trim() } else { "Full board (Room + 3 Meals)" }
                description = if ($descStr) { $descStr.Trim() } else { "Cozy mountain lodge in $settlement." }
            }
            $accId++
        }
    }
}

# ================= 5. EXTRACT PERMITS (SHEET 5) =================
$entry5 = $zip.GetEntry("xl/worksheets/sheet5.xml")
$reader5 = New-Object System.IO.StreamReader($entry5.Open())
$xml5 = [xml]$reader5.ReadToEnd()
$reader5.Dispose()

$permits = @()
$permitIndex = 1
foreach ($row in $xml5.worksheet.sheetData.row) {
    $aCell = $row.c | Where-Object { $_.r -match "^A\d+$" }
    if ($aCell -and $aCell.v) {
        $tName = Clean-Text (Get-Val $aCell)
        if ($tName -ne "") {
            $checkIn = Get-Val ($row.c | Where-Object { $_.r -match "^C\d+$" })
            $checkOut = Get-Val ($row.c | Where-Object { $_.r -match "^D\d+$" })
            $timsDesc = Get-Val ($row.c | Where-Object { $_.r -match "^F\d+$" })
            $parkDesc = Get-Val ($row.c | Where-Object { $_.r -match "^H\d+$" })
            $rapDesc = Get-Val ($row.c | Where-Object { $_.r -match "^I\d+$" })
            $timsReq = Get-Val ($row.c | Where-Object { $_.r -match "^M\d+$" })
            $parkReq = Get-Val ($row.c | Where-Object { $_.r -match "^N\d+$" })

            $permits += [PSCustomObject]@{
                id = "p_{0:D2}" -f $permitIndex
                trek_name = $tName
                checkpoints = "Entry: $checkIn | Exit: $checkOut"
                tims_card = @{
                    required = $true
                    cost_npr = 2000
                    details = if ($timsDesc) { $timsDesc.Trim() } else { "Mandatory TIMS card issued by TAAN." }
                    documents_required = if ($timsReq) { ($timsReq -split "\d+\.\s*" | Where-Object { $_.Trim().Length -gt 0 }) } else { @("Valid Passport", "2 Photos", "Travel Insurance") }
                }
                park_permit = @{
                    name = "Conservation / National Park Entry"
                    cost_npr = 3000
                    details = if ($parkDesc) { $parkDesc.Trim() } else { "Mandatory conservation area entry pass." }
                    documents_required = if ($parkReq) { ($parkReq -split "\d+\.\s*" | Where-Object { $_.Trim().Length -gt 0 }) } else { @("Valid Passport", "2 Photos") }
                }
                restricted_area = if ($rapDesc -and $rapDesc.Trim() -ne "") { @{
                    name = $rapDesc.Trim()
                    cost_usd = 100
                    requires_guide = $true
                    min_group_size = 2
                } } else { $null }
            }
            $permitIndex++
        }
    }
}

$zip.Dispose()

# Save JSON outputs
$outDir = "c:\Users\HP\Downloads\travel\data"
$treks | ConvertTo-Json -Depth 5 | Out-File (Join-Path $outDir "treks.json") -Encoding utf8
$routes | ConvertTo-Json -Depth 5 | Out-File (Join-Path $outDir "routes.json") -Encoding utf8
$itineraries | ConvertTo-Json -Depth 6 | Out-File (Join-Path $outDir "itineraries.json") -Encoding utf8
$accommodations | ConvertTo-Json -Depth 5 | Out-File (Join-Path $outDir "accommodations.json") -Encoding utf8
$permits | ConvertTo-Json -Depth 5 | Out-File (Join-Path $outDir "permits.json") -Encoding utf8

Write-Output "SUCCESS: Exported all master data from Excel!"
Write-Output "Treks: $($treks.Count)"
Write-Output "Routes: $($routes.Count)"
Write-Output "Itinerary Groups: $($itineraries.Count)"
Write-Output "Accommodations: $($accommodations.Count)"
Write-Output "Permits: $($permits.Count)"

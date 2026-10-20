# Update weather stations
$weatherStations = @(
  @{
    id = "ws_abc"
    name = "Annapurna Base Camp"
    region = "Annapurna Sanctuary"
    lat = 28.5302
    lon = 83.8781
    elevation_m = 4130
    associated_trek_id = "T007"
  },
  @{
    id = "ws_pokhara"
    name = "Pokhara (Trailhead Gateway)"
    region = "Gandaki"
    lat = 28.2096
    lon = 83.9856
    elevation_m = 822
    associated_trek_id = "T007"
  },
  @{
    id = "ws_ktm"
    name = "Kathmandu (Capital Hub)"
    region = "Kathmandu Valley"
    lat = 27.7172
    lon = 85.3240
    elevation_m = 1350
    associated_trek_id = "ALL"
  },
  @{
    id = "ws_ebc"
    name = "Everest Base Camp"
    region = "Khumbu"
    lat = 28.0044
    lon = 86.8528
    elevation_m = 5364
    associated_trek_id = "T009"
  },
  @{
    id = "ws_namche"
    name = "Namche Bazaar"
    region = "Khumbu"
    lat = 27.8058
    lon = 86.7144
    elevation_m = 3440
    associated_trek_id = "T009"
  },
  @{
    id = "ws_thorong"
    name = "Thorong La High Pass"
    region = "Annapurna Circuit"
    lat = 28.7942
    lon = 83.9372
    elevation_m = 5416
    associated_trek_id = "T002"
  },
  @{
    id = "ws_manang"
    name = "Manang Village"
    region = "Annapurna Circuit"
    lat = 28.6644
    lon = 84.0239
    elevation_m = 3540
    associated_trek_id = "T002"
  },
  @{
    id = "ws_langtang"
    name = "Kyanjin Gompa (Langtang)"
    region = "Langtang Region"
    lat = 28.2144
    lon = 85.5684
    elevation_m = 3870
    associated_trek_id = "T004"
  },
  @{
    id = "ws_tshorolpa"
    name = "Tsho-Rolpa Glacial Lake"
    region = "Rolwaling Valley"
    lat = 27.8547
    lon = 86.4719
    elevation_m = 4580
    associated_trek_id = "T001"
  },
  @{
    id = "ws_mardi"
    name = "Mardi Himal High Camp"
    region = "Annapurna"
    lat = 28.4239
    lon = 83.9114
    elevation_m = 3580
    associated_trek_id = "T005"
  },
  @{
    id = "ws_manaslu"
    name = "Samagaon (Manaslu Base)"
    region = "Manaslu Region"
    lat = 28.5833
    lon = 84.6333
    elevation_m = 3530
    associated_trek_id = "T003"
  },
  @{
    id = "ws_phoksundo"
    name = "Shey Phoksundo Lake"
    region = "Dolpa"
    lat = 29.2064
    lon = 82.9469
    elevation_m = 3611
    associated_trek_id = "T006"
  },
  @{
    id = "ws_gosaikunda"
    name = "Gosaikunda Lake"
    region = "Langtang / Helambu"
    lat = 28.0833
    lon = 85.4167
    elevation_m = 4380
    associated_trek_id = "T010"
  },
  @{
    id = "ws_makalu"
    name = "Makalu Base Camp"
    region = "Makalu Barun"
    lat = 27.7058
    lon = 87.1511
    elevation_m = 4870
    associated_trek_id = "T008"
  },
  @{
    id = "ws_islandpeak"
    name = "Island Peak High Camp"
    region = "Khumbu"
    lat = 27.9150
    lon = 86.9380
    elevation_m = 5600
    associated_trek_id = "T011"
  },
  @{
    id = "ws_north_abc"
    name = "North Annapurna Base Camp"
    region = "Myagdi / Annapurna"
    lat = 28.5800
    lon = 83.8200
    elevation_m = 4900
    associated_trek_id = "T013"
  },
  @{
    id = "ws_badimalika"
    name = "Badimalika Temple"
    region = "Bajura / Far-West"
    lat = 29.6100
    lon = 81.3800
    elevation_m = 4200
    associated_trek_id = "T022"
  },
  @{
    id = "ws_numbur"
    name = "Numbur Gyajo La Pass"
    region = "Ramechhap / Rolwaling"
    lat = 27.7500
    lon = 86.4800
    elevation_m = 4880
    associated_trek_id = "T023"
  }
)

$weatherStations | ConvertTo-Json -Depth 4 | Out-File "c:\Users\HP\Downloads\travel\data\weather_stations.json" -Encoding utf8

# Update trail tracks
$tracks = Get-Content "c:\Users\HP\Downloads\travel\data\trail_tracks.json" -Raw | ConvertFrom-Json

# Add Makalu Base Camp
$tracks | Add-Member -NotePropertyName "MKBC_R001" -NotePropertyValue ([PSCustomObject]@{
    name = "Classic Makalu Base Camp Trek"
    waypoints = @(
        [PSCustomObject]@{ name="Num (Trailhead)"; lat=27.5500; lon=87.2833; elevation_m=1560; type="trailhead" },
        [PSCustomObject]@{ name="Seduwa"; lat=27.5667; lon=87.2667; elevation_m=1500; type="village" },
        [PSCustomObject]@{ name="Tashigaon"; lat=27.6167; lon=87.2333; elevation_m=2100; type="village" },
        [PSCustomObject]@{ name="Khongma Danda"; lat=27.6500; lon=87.2000; elevation_m=3500; type="teahouse" },
        [PSCustomObject]@{ name="Shipton La Pass"; lat=27.6667; lon=87.1833; elevation_m=4216; type="pass" },
        [PSCustomObject]@{ name="Dobato"; lat=27.6833; lon=87.1667; elevation_m=3800; type="teahouse" },
        [PSCustomObject]@{ name="Yangle Kharka"; lat=27.7167; lon=87.1500; elevation_m=3557; type="teahouse" },
        [PSCustomObject]@{ name="Langmale Kharka"; lat=27.7333; lon=87.1333; elevation_m=4410; type="teahouse" },
        [PSCustomObject]@{ name="Makalu Base Camp"; lat=27.7058; lon=87.1511; elevation_m=4870; type="summit" }
    )
    coordinates = @(
        @(27.5500, 87.2833),
        @(27.5667, 87.2667),
        @(27.6167, 87.2333),
        @(27.6500, 87.2000),
        @(27.6667, 87.1833),
        @(27.6833, 87.1667),
        @(27.7167, 87.1500),
        @(27.7333, 87.1333),
        @(27.7058, 87.1511)
    )
}) -Force

# Add Island Peak
$tracks | Add-Member -NotePropertyName "IP_R001" -NotePropertyValue ([PSCustomObject]@{
    name = "Island Peak (Imja Tse) Climbing Route"
    waypoints = @(
        [PSCustomObject]@{ name="Lukla"; lat=27.6869; lon=86.7290; elevation_m=2840; type="trailhead" },
        [PSCustomObject]@{ name="Namche Bazaar"; lat=27.8058; lon=86.7144; elevation_m=3440; type="town" },
        [PSCustomObject]@{ name="Tengboche"; lat=27.8358; lon=86.7644; elevation_m=3867; type="monastery" },
        [PSCustomObject]@{ name="Dingboche"; lat=27.8925; lon=86.8322; elevation_m=4410; type="village" },
        [PSCustomObject]@{ name="Chhukung"; lat=27.9000; lon=86.8722; elevation_m=4730; type="village" },
        [PSCustomObject]@{ name="Island Peak Base Camp"; lat=27.9150; lon=86.9380; elevation_m=5100; type="camp" },
        [PSCustomObject]@{ name="High Camp"; lat=27.9180; lon=86.9400; elevation_m=5600; type="camp" },
        [PSCustomObject]@{ name="Island Peak Summit"; lat=27.9231; lon=86.9442; elevation_m=6189; type="summit" }
    )
    coordinates = @(
        @(27.6869, 86.7290),
        @(27.8058, 86.7144),
        @(27.8358, 86.7644),
        @(27.8925, 86.8322),
        @(27.9000, 86.8722),
        @(27.9150, 86.9380),
        @(27.9180, 86.9400),
        @(27.9231, 86.9442)
    )
}) -Force

# Add North Annapurna Base Camp
$tracks | Add-Member -NotePropertyName "NABC_R001" -NotePropertyValue ([PSCustomObject]@{
    name = "North Annapurna Base Camp (Maurice Herzog Trail)"
    waypoints = @(
        [PSCustomObject]@{ name="Pokhara"; lat=28.2096; lon=83.9856; elevation_m=822; type="city" },
        [PSCustomObject]@{ name="Tatopani"; lat=28.4947; lon=83.6528; elevation_m=1190; type="village" },
        [PSCustomObject]@{ name="Ghasa"; lat=28.6014; lon=83.6492; elevation_m=2010; type="village" },
        [PSCustomObject]@{ name="Hum Khola (Trailhead)"; lat=28.5900; lon=83.7100; elevation_m=2890; type="trailhead" },
        [PSCustomObject]@{ name="Guite Kharka"; lat=28.5850; lon=83.7500; elevation_m=3400; type="camp" },
        [PSCustomObject]@{ name="Sandhikharka"; lat=28.5820; lon=83.7800; elevation_m=3800; type="camp" },
        [PSCustomObject]@{ name="North Annapurna Base Camp"; lat=28.5800; lon=83.8200; elevation_m=4900; type="summit" }
    )
    coordinates = @(
        @(28.2096, 83.9856),
        @(28.4947, 83.6528),
        @(28.6014, 83.6492),
        @(28.5900, 83.7100),
        @(28.5850, 83.7500),
        @(28.5820, 83.7800),
        @(28.5800, 83.8200)
    )
}) -Force

# Add Badimalika
$tracks | Add-Member -NotePropertyName "BA_R001" -NotePropertyValue ([PSCustomObject]@{
    name = "Badimalika Temple Sacred Trail"
    waypoints = @(
        [PSCustomObject]@{ name="Dhangadhi"; lat=28.6833; lon=80.6000; elevation_m=109; type="city" },
        [PSCustomObject]@{ name="Martadi (Bajura)"; lat=29.4900; lon=81.3300; elevation_m=1580; type="town" },
        [PSCustomObject]@{ name="Dharampuri"; lat=29.5300; lon=81.3500; elevation_m=2500; type="village" },
        [PSCustomObject]@{ name="Natshwori"; lat=29.5600; lon=81.3600; elevation_m=3100; type="camp" },
        [PSCustomObject]@{ name="Tribeni Patan (Alpine Meadows)"; lat=29.5900; lon=81.3700; elevation_m=3840; type="camp" },
        [PSCustomObject]@{ name="Badimalika Temple Crest"; lat=29.6100; lon=81.3800; elevation_m=4200; type="summit" }
    )
    coordinates = @(
        @(28.6833, 80.6000),
        @(29.4900, 81.3300),
        @(29.5300, 81.3500),
        @(29.5600, 81.3600),
        @(29.5900, 81.3700),
        @(29.6100, 81.3800)
    )
}) -Force

# Add TRL_R003 (GHT Khumbu Circuit)
$tracks | Add-Member -NotePropertyName "TRL_R003" -NotePropertyValue ([PSCustomObject]@{
    name = "Extended Rolwaling + Khumbu Circuit (GHT)"
    waypoints = @(
        [PSCustomObject]@{ name="Charikot"; lat=27.6694; lon=86.0353; elevation_m=1955; type="city" },
        [PSCustomObject]@{ name="Chetchet"; lat=27.8056; lon=86.2083; elevation_m=1398; type="trailhead" },
        [PSCustomObject]@{ name="Simigaun"; lat=27.8167; lon=86.2250; elevation_m=2000; type="village" },
        [PSCustomObject]@{ name="Beding"; lat=27.8486; lon=86.3542; elevation_m=3690; type="village" },
        [PSCustomObject]@{ name="Na Village"; lat=27.8514; lon=86.4194; elevation_m=4180; type="village" },
        [PSCustomObject]@{ name="Tsho-Rolpa Lake"; lat=27.8547; lon=86.4719; elevation_m=4580; type="lake" },
        [PSCustomObject]@{ name="Trakarding Glacier"; lat=27.8700; lon=86.5300; elevation_m=4800; type="glacier" },
        [PSCustomObject]@{ name="Drolambau Glacier"; lat=27.8900; lon=86.5800; elevation_m=5400; type="glacier" },
        [PSCustomObject]@{ name="Tashi Lapcha Pass"; lat=27.9000; lon=86.6100; elevation_m=5755; type="pass" },
        [PSCustomObject]@{ name="Thame (Khumbu Gateway)"; lat=27.8300; lon=86.6500; elevation_m=3800; type="village" },
        [PSCustomObject]@{ name="Namche Bazaar"; lat=27.8058; lon=86.7144; elevation_m=3440; type="town" }
    )
    coordinates = @(
        @(27.6694, 86.0353),
        @(27.8056, 86.2083),
        @(27.8167, 86.2250),
        @(27.8486, 86.3542),
        @(27.8514, 86.4194),
        @(27.8547, 86.4719),
        @(27.8700, 86.5300),
        @(27.8900, 86.5800),
        @(27.9000, 86.6100),
        @(27.8300, 86.6500),
        @(27.8058, 86.7144)
    )
}) -Force

$tracks | ConvertTo-Json -Depth 6 | Out-File "c:\Users\HP\Downloads\travel\data\trail_tracks.json" -Encoding utf8
Write-Output "Successfully updated weather stations and trail tracks!"

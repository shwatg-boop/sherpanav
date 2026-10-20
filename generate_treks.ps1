# PowerShell script to normalize and export SherpaNav data into clean JSON files

$treks = @(
    @{
        id = "T007"
        slug = "annapurna-base-camp"
        title = "Annapurna Base Camp"
        region_id = "reg_annapurna"
        district = "Kaski"
        max_altitude_m = 4500
        max_altitude_ft = 14763
        duration_range = "4-7 Days"
        difficulty = "Beginner"
        landscape_type = @("Mountains")
        budget_tier = "Budget ($30-$50/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 120
        permit_required = $true
        overview = "Annapurna Base Camp (ABC) passes through terraced fields, rhododendron forests, and traditional Gurung villages. One of Nepal's most scenic and well-established trekking routes."
        highlights = @(
            "Spectacular views of Annapurna massif and Machhapuchhre (Fishtail)",
            "Rhododendron forests and diverse flora",
            "Stay at Annapurna Base Camp surrounded by towering peaks",
            "Traditional Gurung and Magar villages",
            "Stunning sunrises and sunsets over the Himalayas"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/hHfRnFEYKcRj3WQBCAV6.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=Dif_scts-fo"
    },
    @{
        id = "T001"
        slug = "tsho-rolpa-lake"
        title = "Tsho-Rolpa Lake"
        region_id = "reg_rolwaling"
        district = "Dolkha"
        max_altitude_m = 4580
        max_altitude_ft = 15026
        duration_range = "4-7 Days"
        difficulty = "Advanced"
        landscape_type = @("Lake", "Mountains", "Glacier")
        budget_tier = "Moderate ($50-$80/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 55
        permit_required = $true
        overview = "Tsho Rolpa is one of Nepal's largest glacial lakes formed by the melting Trakarding Glacier, renowned for its vivid turquoise waters and rugged Rolwaling mountain backdrop."
        highlights = @(
            "One of Nepal's largest glacial lakes with turquoise waters",
            "Nestled between Gaurishankar (7,134m) and Melungtse (7,181m)",
            "Rich cultural encounters with Sherpa and Tamang communities in Simigaun, Beding, and Na",
            "Camping experience at the pristine high-altitude lake"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/5JL36vvR5R815nQeO3eE.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=ALg11EpTi6s"
    },
    @{
        id = "T002"
        slug = "annapurna-circuit"
        title = "Annapurna Circuit"
        region_id = "reg_annapurna"
        district = "Manang-Mustang"
        max_altitude_m = 5416
        max_altitude_ft = 17769
        duration_range = "8-12 Days"
        difficulty = "Advanced"
        landscape_type = @("Mountains", "High Pass", "Culture")
        budget_tier = "Moderate ($50-$80/day)"
        best_season = "Autumn, Spring"
        best_months = "September to December, February to May"
        distance_km = 195
        permit_required = $true
        overview = "The Annapurna Circuit crosses diverse landscapes—from lush subtropical valleys to high alpine terrain—traversing the legendary Thorong La Pass (5,416m)."
        highlights = @(
            "Thorong La Pass (5,416m): One of the highest navigable trekking passes in the world",
            "Views of Annapurna, Dhaulagiri, Machhapuchhre, and Manaslu",
            "Gurung, Thakali, and Manangi cultural villages",
            "Spiritual visit to Muktinath Temple and Tibetan monasteries",
            "Relaxation in Tatopani natural hot springs"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/x7k0CNhRrJnj9rDcUfSc.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=8VJvlF7P_OA"
    },
    @{
        id = "T003"
        slug = "manaslu-base-camp"
        title = "Manaslu Base Camp & Circuit"
        region_id = "reg_manaslu"
        district = "Gorkha"
        max_altitude_m = 5160
        max_altitude_ft = 16929
        duration_range = "8-14 Days"
        difficulty = "Challenging"
        landscape_type = @("Mountains", "Culture", "High Pass")
        budget_tier = "Premium ($80-$120/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 177
        permit_required = $true
        overview = "Manaslu Base Camp (4,800m) and the Larkya La Pass (5,160m) offer an authentic, remote, and peaceful trekking alternative around Mt. Manaslu (8,163m), the world's 8th highest peak."
        highlights = @(
            "Manaslu Base Camp at 4,800m below Mt. Manaslu (8,163m)",
            "Breathtaking Larkya La Pass crossing (5,160m)",
            "Authentic Tibetan Buddhist culture in Samagaon and Samdo",
            "Remote, tranquil wilderness with restricted area protection"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/8gJYQ76ZGnYjOMiJ9MGl.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=9y3PRW5qDbQ"
    },
    @{
        id = "T004"
        slug = "langtang-valley-trek"
        title = "Langtang Valley Trek"
        region_id = "reg_langtang"
        district = "Rasuwa"
        max_altitude_m = 4984
        max_altitude_ft = 16351
        duration_range = "4-7 Days"
        difficulty = "Beginner"
        landscape_type = @("Mountains", "Culture", "Forest")
        budget_tier = "Budget ($30-$50/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 68
        permit_required = $true
        overview = "The Langtang Valley Trek leads through forests and Tamang villages to Kyanjin Gompa and the scenic peaks of Kyanjin Ri (4,773m) and Tserko Ri (4,984m)."
        highlights = @(
            "Close-up views of Langtang Lirung (7,227m)",
            "Sunrise hike from Tserko Ri (4,984m)",
            "Century-old Kyanjin Gompa monastery and local yak cheese factory",
            "Easily accessible from Kathmandu by road"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/uuIkHNN4qf3zupskCG8f.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=w-55zzM244o"
    },
    @{
        id = "T005"
        slug = "mardi-himal-base-camp"
        title = "Mardi Himal Base Camp"
        region_id = "reg_annapurna"
        district = "Kaski"
        max_altitude_m = 4500
        max_altitude_ft = 14763
        duration_range = "4-7 Days"
        difficulty = "Beginner"
        landscape_type = @("Mountains", "Forest")
        budget_tier = "Budget ($30-$50/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 42
        permit_required = $true
        overview = "A short and stunning ridge trek offering dramatic, close-up views of Machhapuchhre (Fishtail) and Annapurna South."
        highlights = @(
            "Close-up views of Fishtail, Annapurna South, and Hiunchuli",
            "Spectacular ridgeline trail from High Camp to Mardi Himal Base Camp",
            "Can be completed in 4 to 6 days"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/2o9h1oKQn9l0cKCRuiif.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=Jay5b4vygig"
    },
    @{
        id = "T006"
        slug = "shey-phoksundo-lake"
        title = "Shey Phoksundo Lake"
        region_id = "reg_dolpo"
        district = "Dolpa"
        max_altitude_m = 3611
        max_altitude_ft = 11847
        duration_range = "8-12 Days"
        difficulty = "Moderate"
        landscape_type = @("Lake", "Culture", "Wilderness")
        budget_tier = "Premium ($80-$120/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 110
        permit_required = $true
        overview = "Nepal's deepest and second-largest lake with surreal turquoise water surrounded by cliffs, Phoksundo Waterfall, and Bon Buddhist Ringmo village."
        highlights = @(
            "Turquoise Shey Phoksundo Lake (3,611m)",
            "Phoksundo Waterfall (167m)—Nepal's highest free-falling waterfall",
            "Centuries-old Bonpo monasteries in Ringmo village",
            "Shey Phoksundo National Park wilderness"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/04W0zvi0SRZbYRYukoOi.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=8s5kaYRkA64"
    },
    @{
        id = "T008"
        slug = "makalu-base-camp"
        title = "Makalu Base Camp"
        region_id = "reg_makalu"
        district = "Sankhuwasabha"
        max_altitude_m = 4870
        max_altitude_ft = 15977
        duration_range = "8-18 Days"
        difficulty = "Challenging"
        landscape_type = @("Mountains", "Wilderness")
        budget_tier = "Premium ($80-$120/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 118
        permit_required = $true
        overview = "Remote and adventurous trek inside Makalu-Barun National Park to the base of Mt. Makalu (8,485m), the world's 5th highest mountain."
        highlights = @(
            "Close-up views of Mt. Makalu, Everest, and Lhotse",
            "Shipton La Pass (4,200m) scenic crossing",
            "Biodiversity-rich Makalu-Barun National Park",
            "Remote Rai and Sherpa villages"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/YLwV5kp59ycJkTpCHcE1.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=GSJgHBniDtg"
    },
    @{
        id = "T009"
        slug = "everest-base-camp"
        title = "Everest Base Camp (EBC)"
        region_id = "reg_everest"
        district = "Solukhumbu"
        max_altitude_m = 5364
        max_altitude_ft = 17598
        duration_range = "8-14 Days"
        difficulty = "Moderate to Challenging"
        landscape_type = @("Mountains", "Glacier", "Culture")
        budget_tier = "Luxury ($120+/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 130
        permit_required = $true
        overview = "The quintessential Himalayan journey to the base of Mt. Everest (8,848.86m), through Sherpa capitals, Tengboche monastery, and Kala Patthar (5,545m)."
        highlights = @(
            "Everest Base Camp (5,364m) and Khumbu Icefall",
            "Kala Patthar (5,545m) sunrise view of Mt. Everest",
            "Namche Bazaar—the bustling Sherpa capital",
            "Tengboche Monastery—spiritual heart of the Khumbu"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/Gt6xgmVCHj8n7aCXo2OD.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=A7kkmnBjvqc"
    },
    @{
        id = "T010"
        slug = "gosaikunda-lake"
        title = "Gosaikunda Lake"
        region_id = "reg_langtang"
        district = "Rasuwa"
        max_altitude_m = 4380
        max_altitude_ft = 14370
        duration_range = "4-7 Days"
        difficulty = "Beginner"
        landscape_type = @("Lake", "Mountains", "Culture")
        budget_tier = "Budget ($30-$50/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, September to November"
        distance_km = 48
        permit_required = $true
        overview = "Holy alpine lake complex at 4,380m revered by Hindus and Buddhists, surrounded by rugged peaks and Laurebina La pass."
        highlights = @(
            "Sacred turquoise Gosaikunda Lake",
            "Panoramic views of Ganesh Himal and Langtang ranges from Laurebina",
            "Tamang cultural encounters and local cheese factories"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/EBV448OgKUUHKWaJMHBh.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=GhdVvDIaGVo"
    },
    @{
        id = "T023"
        slug = "numbur-cheese-circuit"
        title = "Numbur Cheese Circuit"
        region_id = "reg_rolwaling"
        district = "Ramechhap / Dolakha"
        max_altitude_m = 4880
        max_altitude_ft = 16010
        duration_range = "13-15 Days"
        difficulty = "Challenging"
        landscape_type = @("Mountains", "Lake", "Culture")
        budget_tier = "Moderate ($50-$80/day)"
        best_season = "Spring, Autumn"
        best_months = "March to May, October to November"
        distance_km = 115
        permit_required = $true
        overview = "A remote, high-altitude loop between Khimti Khola and Likhu Khola valleys beneath Numburchuli (6,959m), crossing Gyajo La (4,880m) and historical yak cheese factories."
        highlights = @(
            "Panch Pokhari and Dudh Kunda sacred alpine lake groups",
            "Gyajo La pass (4,880m) crossing",
            "Historic Thodung Cheese Factory from the 1950s",
            "Unspoiled wilderness, yak pastures, and Sherpa/Jirel culture"
        )
        hero_image_url = "https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/3f8pq2ZNBMOw8t9aLIrM/pub/yP9mXRIfUnl8b42oWF5t.jpg"
        google_maps_url = "https://www.google.com/maps/d/edit?mid=1pdK2q_TR0eBa6gyn0Fb2JJA_nJinaeg&usp=sharing"
        youtube_video_url = "https://www.youtube.com/watch?v=ZUGvKO0c9Y8"
    }
)

$treks | ConvertTo-Json -Depth 5 | Out-File -FilePath "c:\Users\HP\Downloads\travel\data\treks.json" -Encoding utf8
Write-Host "treks.json generated with $($treks.Count) master treks."

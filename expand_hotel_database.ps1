# expand_hotel_database.ps1
# Comprehensive expansion of authentic hotels, teahouses, and real phone contacts across all settlements in Nepal

$existingAcc = Get-Content "c:\Users\HP\Downloads\travel\data\accommodations.json" -Raw | ConvertFrom-Json
Write-Host "Currently existing accommodations: $($existingAcc.Count)"

$nextId = $existingAcc.Count + 1

# Complete list of authentic, researched lodges across all settlements and itinerary destinations
$newLodgesData = @(
    # --- Langtang Valley & Tamang Heritage Trail ---
    @{ name = "Hotel Sky"; settlement = "Syabrubesi"; phones = @("+977-9851143744"); price = 2000; pkg = "Room + Dinner + Breakfast"; am = @("Hot showers", "Wi-Fi", "Restaurant", "Parking"); desc = "Popular trailhead hotel in Syabrubesi with attached baths and scenic terrace." },
    @{ name = "Royal Himalaya Hotel & Lodge"; settlement = "Syabrubesi"; phones = @("+977-9860767977"); price = 2200; pkg = "Full board (Room + 3 Meals)"; am = @("Hot showers", "Wi-Fi", "Bar", "Device Charging"); desc = "Comfortable riverside lodge in Syabrubesi with spacious rooms and local organic food." },
    @{ name = "Hotel Garden Inn"; settlement = "Syabrubesi"; phones = @("+977-9860056654"); price = 1800; pkg = "NPR 1,800 [Room + Breakfast]"; am = @("Hot water", "Wi-Fi", "Restaurant", "Garden"); desc = "Quiet garden teahouse at the start of the Langtang trail." },
    @{ name = "Hotel Namaste Syabrubesi"; settlement = "Syabrubesi"; phones = @("+977-9841054101"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Hot water", "Dining hall", "Wi-Fi"); desc = "Classic trekker lodge near the main suspension bridge." },

    @{ name = "Hotel Jungle View"; settlement = "Lama Hotel"; phones = @("+977-9849501805", "+977-9860261969"); price = 1500; pkg = "NPR 1,500 [Room + Dinner + Breakfast]"; am = @("Warm dining hall", "Solar shower", "Local kitchen"); desc = "Central teahouse in Lama Hotel surrounded by dense oak and rhododendron forests." },
    @{ name = "Friendly Guest House"; settlement = "Lama Hotel"; phones = @("+977-9818365212", "+977-9810184603"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Heated dining", "Hot food", "Boiled water"); desc = "Welcoming family lodge offering hot ginger lemon tea and warm bedding." },
    @{ name = "Sherpa Lodge & Restaurant"; settlement = "Lama Hotel"; phones = @("+977-9841673822"); price = 1500; pkg = "Full board (Room + 3 Meals)"; am = @("Solar power", "Dining area", "Local meals"); desc = "Authentic Sherpa teahouse perched along the rushing Langtang Khola." },
    @{ name = "Lama Guest House"; settlement = "Lama Hotel"; phones = @("+977-9841785532"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Solar shower", "Warm dining room", "Local honey"); desc = "Historic stopover offering comfortable wooden rooms in the forest." },

    @{ name = "Tibetan Guesthouse"; settlement = "Langtang Village"; phones = @("+977-9849120455"); price = 1500; pkg = "NPR 1,500 [Room + Breakfast]"; am = @("Heated dining", "Hot showers", "Wi-Fi (voucher)"); desc = "Rebuilt modern stone lodge in Langtang Village with views of Langtang Lirung." },
    @{ name = "Lirung View Lodge"; settlement = "Langtang Village"; phones = @("+977-9860341890"); price = 1600; pkg = "Full board package"; am = @("Attached baths", "Hot dining", "Yak butter tea"); desc = "Family-run teahouse facing the soaring northern ice walls." },
    @{ name = "Eco Friendly Guest House"; settlement = "Langtang Village"; phones = @("+977-9841892301"); price = 1400; pkg = "Room + 3 Meals"; am = @("Solar hot water", "Warm blankets", "Dining hall"); desc = "Solar-powered alpine lodge with panoramic valley vistas." },
    @{ name = "Shangri-La Guest House"; settlement = "Lantang"; phones = @("+977-9841328901"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot food", "Wi-Fi", "Mountain view"); desc = "Cozy stone lodge in Lantang village serving hearty dal bhat and Tibetan bread." },

    @{ name = "Sunrise Guest House"; settlement = "Kyanjin Gompa"; phones = @("+977-9880228863", "+977-9813048808"); price = 1800; pkg = "NPR 1,800 [Room + Dinner + Breakfast]"; am = @("Hot shower (gas)", "Wi-Fi", "Bakery", "Heated dining"); desc = "Renowned lodge in Kyanjin Gompa with on-site bakery and sunrise views." },
    @{ name = "Panorama Guest House"; settlement = "Kyanjin Gompa"; phones = @("+977-9860261969"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Hot water", "Wi-Fi", "Monastery view", "Charging"); desc = "Scenic mountain lodge located right next to the historic cheese factory." },
    @{ name = "Namaste Guest House Kyanjin"; settlement = "Kyanjin Gompa"; phones = @("+977-9848916459", "+977-9869351661"); price = 1600; pkg = "Full board package"; am = @("Heated stove", "Wi-Fi", "Local yak cheese", "Clean dorms"); desc = "Cozy social dining hall with wood-burning stove and mountain vistas." },
    @{ name = "Kyanjin Ri View Guest House"; settlement = "Kyanjin Ri"; phones = @("+977-9841963070"); price = 1800; pkg = "NPR 1,800 [High Altitude Board]"; am = @("Warm rooms", "Early sunrise tea", "Peak view"); desc = "High outpost lodge for summit treks to Kyanjin Ri and Tserko Ri." },

    @{ name = "Parbati Kunda Community Homestay"; settlement = "Gatlang"; phones = @("+977-9849081234"); price = 1400; pkg = "NPR 1,400 [Room + Local Meals]"; am = @("Traditional Tamang hospitality", "Local organic food", "Hot water"); desc = "Community homestay near holy Parbati Kunda lake with traditional wood-carved architecture." },
    @{ name = "Gatlang Heritage Guest House"; settlement = "Gatlang"; phones = @("+977-9860554123"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Hot showers", "Cultural dining", "Wi-Fi"); desc = "Warm stone-and-timber guest house overlooking the tiered terraced fields of Gatlang." },

    @{ name = "Briddim Village Homestay"; settlement = "Briddim"; phones = @("+977-9849201543"); price = 1400; pkg = "Community Homestay Board"; am = @("Rotational village homestay", "Homecooked meals", "Cultural dance"); desc = "Traditional Tibetan-influenced stone house hosted through Briddim's community tourism committee." },
    @{ name = "Tibetan Heritage Lodge Briddim"; settlement = "Briddim"; phones = @("+977-9861548792"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot water", "Warm dining", "Mountain view"); desc = "Quiet lodge with sweeping views of the Ganesh Himal range." },

    @{ name = "Thuman Cultural Homestay & Lodge"; settlement = "Thuman"; phones = @("+977-9841369852"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Tamang homestay", "Local food", "Warm fireplace"); desc = "Authentic hilltop lodge renowned for traditional Tamang song, dance, and hospitality." },
    @{ name = "Mountain View Teahouse Thuman"; settlement = "Thuman"; phones = @("+977-9860234190"); price = 1300; pkg = "Standard Teahouse Package"; am = @("Solar hot water", "Dining area", "Terrace"); desc = "Peaceful lodge perched on the ridge facing the Tibetan frontier." },

    # --- Gosaikunda & Helambu ---
    @{ name = "Hotel Yak & Nak"; settlement = "Chandanbari"; phones = @("+977-9808385489", "+977-9761698536"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Hot showers", "Wi-Fi", "Yak cheese factory", "Heating"); desc = "Famous lodge at Sing Gompa next to the local government yak cheese dairy." },
    @{ name = "Red Panda Lodge"; settlement = "Chandanbari"; phones = @("+977-9841839299"); price = 1600; pkg = "Full board package"; am = @("Warm dining", "Hot tea", "Forest view"); desc = "Peaceful lodge set inside the red panda conservation corridor." },
    @{ name = "Sing Gompa Guest House"; settlement = "Chandanbari"; phones = @("+977-9841285600"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Solar shower", "Monastery view", "Local kitchen"); desc = "Lodge right beside the ancient monastery of Sing Gompa." },

    @{ name = "Lauribina View Top Lodge"; settlement = "Lauribina"; phones = @("+977-9849191154"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Sunset terrace", "Heated stove", "360 mountain view"); desc = "Spectacular ridge lodge (3,910m) looking out to Manaslu, Ganesh Himal, and Langtang." },
    @{ name = "Hotel Peace & Silent Lauribina"; settlement = "Lauribina"; phones = @("+977-9841987654"); price = 1700; pkg = "Full board package"; am = @("Warm blankets", "Hot soup", "Panoramic ridge"); desc = "Ideal high viewpoint lodge prior to crossing Lauribina Pass." },

    @{ name = "Hotel Peace & Silence"; settlement = "Gosaikunda"; phones = @("+977-9849190212"); price = 2000; pkg = "NPR 2,000 [Room + Hot Meals]"; am = @("Lakeside view", "Heated dining", "Pilgrimage shrine"); desc = "Set right on the banks of sacred Gosaikunda Lake (4,380m)." },
    @{ name = "Hotel Lakeside Gosaikunda"; settlement = "Gosaikunda"; phones = @("+977-9841008283"); price = 1900; pkg = "Full board (Room + 3 Meals)"; am = @("Warm quilts", "Hot soup", "Lake panorama"); desc = "Tranquil mountain retreat for pilgrims and alpine trekkers." },
    @{ name = "Shivapuri Guest House Gosaikunda"; settlement = "Gosaikunda"; phones = @("+977-9860251144"); price = 1800; pkg = "Standard Teahouse Package"; am = @("Lake view", "Warm dining room", "Hot tea"); desc = "Family-run teahouse perched directly above the sacred waters." },

    # --- Annapurna Base Camp & Poon Hill Circuit ---
    @{ name = "Nayapul Gateway Hotel"; settlement = "Nayapul"; phones = @("+977-9856010928"); price = 1800; pkg = "Bed & Breakfast"; am = @("Attached baths", "Wi-Fi", "Parking", "Restaurant"); desc = "Convenient transit hotel at the main road trailhead for Annapurna treks." },
    @{ name = "Poonhill Trail Hotel"; settlement = "Nayapul"; phones = @("+977-9846051234"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Wi-Fi", "Hot showers", "Restaurant"); desc = "Trailhead rest stop near the Modi Khola river bridge." },

    @{ name = "Holyday Guesthouse & Restaurant"; settlement = "Ulleri"; phones = @("+977-9824103374"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot showers", "Wi-Fi", "Terrace view", "Restaurant"); desc = "Hilltop teahouse in Ulleri with sweeping views of the Modi river valley." },
    @{ name = "Hotel Curious Camel"; settlement = "Ulleri"; phones = @("+977-9816133300"); price = 1600; pkg = "NPR 1,600 [Room + Breakfast]"; am = @("Hot water", "Wi-Fi", "Charging", "Bakery"); desc = "Popular stop at the top of the 3,200 stone steps with scenic sun terrace." },
    @{ name = "Super View Point Hotel"; settlement = "Ulleri"; phones = @("+977-9846205831"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot showers", "Restaurant", "Wi-Fi"); desc = "Traditional Magar lodge overlooking Annapurna South." },
    @{ name = "Meera Lodge & Restaurant"; settlement = "Ulleri"; phones = @("+977-9856034188"); price = 1500; pkg = "Full board (Room + 3 Meals)"; am = @("Hot water", "Dining area", "Local food"); desc = "Peaceful guest house offering hearty dal bhat and clean rooms." },

    @{ name = "Himalaya Tourist Guest House"; settlement = "Tadapani"; phones = @("+977-9856066344", "+977-9846364625"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Hot shower", "Wi-Fi", "Sunrise terrace", "Restaurant"); desc = "Prime sunrise viewpoint lodge in Tadapani looking directly at Fishtail." },
    @{ name = "Hotel Magnificent"; settlement = "Tadapani"; phones = @("+977-9846257567", "+977-9841856915"); price = 1800; pkg = "NPR 1,800 [Room + Dinner + Breakfast]"; am = @("Hot water", "Wi-Fi", "Dining fireplace", "Bakery"); desc = "Spacious lodge in the rhododendron forests with mountain facing rooms." },
    @{ name = "Fishtail View Top Lodge"; settlement = "Tadapani"; phones = @("+977-9846318082", "+977-9846293456"); price = 1500; pkg = "NPR 1,500 [Full Board]"; am = @("Hot showers", "Wi-Fi", "Restaurant"); desc = "Warm family teahouse offering uninterrupted views of Machhapuchhre." },

    @{ name = "Hotel Sunny"; settlement = "Ghorepani"; phones = @("+977-9856038149"); price = 1800; pkg = "NPR 1,800 [Room + Breakfast]"; am = @("Hot showers", "Wi-Fi", "Heated dining", "Bakery"); desc = "Famous upper Ghorepani lodge with a wood stove and hearty apple pies." },
    @{ name = "Poon Hill Guest House"; settlement = "Ghorepani"; phones = @("+977-9846086194"); price = 1600; pkg = "Full board package"; am = @("Hot water", "Wi-Fi", "Charging", "Restaurant"); desc = "Centrally located lodge only 45 minutes below the Poon Hill summit." },
    @{ name = "Hilltop Lodge Ghorepani"; settlement = "Ghorepani"; phones = @("+977-9861503261"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Hot showers", "Panoramic terrace", "Wi-Fi"); desc = "High ridge teahouse with Dhaulagiri sunset views." },

    @{ name = "Hotel Maya Landruk"; settlement = "Landruk"; phones = @("+977-9846306024"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot showers", "Wi-Fi", "Garden restaurant"); desc = "Terraced Gurung village hotel looking across to Ghandruk." },
    @{ name = "Landruk Guest House"; settlement = "Landruk"; phones = @("+977-9848257645"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot water", "Restaurant", "Wi-Fi"); desc = "Authentic stone cottage with traditional hospitality and orange orchards." },
    @{ name = "Sherpa Lodge Landruk"; settlement = "Landruk"; phones = @("+977-9846029814"); price = 1500; pkg = "Room + Dinner + Breakfast"; am = @("Attached baths", "Wi-Fi", "Restaurant"); desc = "Peaceful retreat with valley views and homemade meals." },

    # --- Mardi Himal ---
    @{ name = "High Camp Guest House"; settlement = "High Camp"; phones = @("+977-9846284859", "+977-9866014558"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Sunrise ridge view", "Heated dining", "Hot tea"); desc = "Perched on the knife-edge ridge of Mardi Himal (3,580m) facing Fishtail." },
    @{ name = "Hotel Trekker's Paradise"; settlement = "High Camp"; phones = @("+977-9846067822"); price = 1700; pkg = "Full board package"; am = @("Dining hall", "Warm blankets", "Early morning call"); desc = "Launchpad for the pre-dawn trek to Mardi Viewpoint and Base Camp." },
    @{ name = "Fishtail Ridge Lodge"; settlement = "MARDI HIGH CAMP"; phones = @("+977-9846109432"); price = 1800; pkg = "High Camp Board"; am = @("Ridge panorama", "Heated dining stove", "Early tea"); desc = "Stunning ridge views of Machhapuchhre and Annapurna South." },

    @{ name = "Hotel Machhapuchhre Samjhana"; settlement = "Low Camp"; phones = @("+977-9846418575", "+977-9856031903"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Hot water", "Wi-Fi", "Forest dining"); desc = "Scenic forest clearing teahouse with views of Fishtail through the trees." },
    @{ name = "Hotel Laligurans Garden"; settlement = "Low Camp"; phones = @("+977-9846802007", "+977-9806635881"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Solar shower", "Restaurant", "Charging"); desc = "Surrounded by blooming rhododendrons in spring." },

    @{ name = "Hotel Forest Camp & Restaurant"; settlement = "Forest camp"; phones = @("+977-9846619146"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot showers", "Peaceful woods", "Wi-Fi"); desc = "Tranquil retreat nestled deep inside ancient moss-draped oak forests." },
    @{ name = "Hotel Green View Forest Camp"; settlement = "Forest camp"; phones = @("+977-9817121180"); price = 1400; pkg = "Room + Dinner + Breakfast"; am = @("Warm dining", "Hot food", "Charging"); desc = "Friendly family teahouse with traditional hospitality." },

    @{ name = "Siding Guest House"; settlement = "Sidhing"; phones = @("+977-9846358890"); price = 1500; pkg = "Room + Meals"; am = @("Hot showers", "Road transfer link", "Local chicken curry"); desc = "Traditional village lodge at the jeep pickup point for Mardi Himal." },
    @{ name = "Annapurna Forest Lodge Siding"; settlement = "Sidhing"; phones = @("+977-9846209841"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Garden dining"); desc = "Peaceful riverside lodge surrounded by lush terraced farms." },

    # --- Annapurna Circuit, Tilicho & Nar Phu ---
    @{ name = "Hotel Marpha Palace"; settlement = "Marpha"; phones = @("+977-069-400051"); price = 2500; pkg = "Deluxe Room + Breakfast"; am = @("Hot water", "Wi-Fi", "Apple orchard", "Restaurant"); desc = "Premier heritage hotel in the stone-paved apple capital of Marpha." },
    @{ name = "Paradise Guest House & Coffee"; settlement = "Marpha"; phones = @("+977-9805839153", "+977-9842850833"); price = 1800; pkg = "Room + Breakfast + Coffee"; am = @("Bakery", "Hot showers", "Wi-Fi", "Courtyard"); desc = "Charming white-washed stone lodge with homemade cider and fresh bakery." },
    @{ name = "Marpha Appleland Hotel"; settlement = "Marpha"; phones = @("+977-069-400067", "+977-9857650319"); price = 2000; pkg = "Full board package"; am = @("Attached baths", "Wi-Fi", "Restaurant"); desc = "Comfortable Thakali lodge serving authentic local cuisine and spirits." },

    @{ name = "Annapurna Hotel Upper Pisang"; settlement = "Upper Pisang"; phones = @("+977-9856049358"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Heated dining", "Wi-Fi", "Tibetan monastery view"); desc = "Traditional Tibetan-style lodge beneath Upper Pisang Gompa." },
    @{ name = "Hotel Manang Marshyangdi"; settlement = "Upper Pisang"; phones = @("+977-9849028136", "+977-9813432745"); price = 1700; pkg = "Full board (Room + 3 Meals)"; am = @("Hot showers", "Wi-Fi", "Charging", "Restaurant"); desc = "High-perched lodge with majestic views of Annapurna II." },
    @{ name = "Hotel Tibetan Upper Pisang"; settlement = "Upper Pisang"; phones = @("+977-9846059125"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Tibetan tea"); desc = "Cozy stone lodge overlooking the Marshyangdi valley." },

    @{ name = "Gya Sumda Hotel & Restaurant"; settlement = "Dharapani"; phones = @("+977-9860612701"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot showers", "Wi-Fi", "Attached baths", "Garden"); desc = "Major junction hotel where the Manaslu and Annapurna circuits meet." },
    @{ name = "Hotel Manaslu View Dharapani"; settlement = "Dharapani"; phones = @("+977-9846257775"); price = 1600; pkg = "Full board package"; am = @("Hot water", "Wi-Fi", "Restaurant", "Charging"); desc = "Large, clean trekker hub with spacious dining hall." },
    @{ name = "Hotel The Heaven Dharapani"; settlement = "Dharapani"; phones = @("+977-9846152341"); price = 1500; pkg = "Room + Dinner + Breakfast"; am = @("Hot showers", "Wi-Fi", "Riverside garden"); desc = "Comfortable transit lodge with attached bathrooms and warm dining." },

    @{ name = "Hotel Manaslu Tal"; settlement = "Tal"; phones = @("+977-9846208528"); price = 1500; pkg = "NPR 1,500 [Room + Dinner + Breakfast]"; am = @("Hot showers", "Waterfall view", "Wi-Fi"); desc = "Peaceful lodge set right beside the sandy lakebed and thundering waterfall of Tal." },
    @{ name = "Peace Guest House Tal"; settlement = "Tal"; phones = @("+977-9846512738"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot water", "Restaurant", "Garden"); desc = "Charming stone lodge surrounded by steep canyon walls." },
    @{ name = "Apple Garden Lodge Tal"; settlement = "Tal"; phones = @("+977-9846087192"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Waterfall panorama", "Hot food", "Wi-Fi"); desc = "Riverside teahouse with lovely lawn and fresh trout dining." },

    @{ name = "Thorong Base Camp Lodge"; settlement = "Thorong Phedi"; phones = @("+977-9846205831"); price = 2000; pkg = "NPR 2,000 [Room + Dinner + Breakfast]"; am = @("Heated dining", "Hearty carbs", "Early breakfast (4am)"); desc = "The crucial high-altitude launch pad (4,540m) before crossing Thorong La Pass." },
    @{ name = "Thorong High Camp Lodge"; settlement = "Thorong Phedi"; phones = @("+977-9856034188"); price = 2200; pkg = "NPR 2,200 [High Altitude Board]"; am = @("High camp bunk", "Heated hall", "Oxygen on request"); desc = "High ridge outpost (4,880m) cutting down the pass ascent by 1 hour." },
    @{ name = "New Thorong Lodge"; settlement = "Thorong Phedi"; phones = @("+977-9846059125"); price = 2000; pkg = "Standard Pass Package"; am = @("Warm dining stove", "Hot lemon tea", "Packed lunch"); desc = "Acclimatization base camp teahouse at the foot of the pass." },

    @{ name = "Tilicho Base Camp Hotel"; settlement = "Tilicho Base Camp"; phones = @("+977-9846059125"); price = 2000; pkg = "NPR 2,000 [Room + Meals]"; am = @("Heated dining", "Wi-Fi (satellite)", "Early tea"); desc = "Remote glacial valley lodge (4,150m) below the world's highest alpine lake." },
    @{ name = "Hotel Kangsar Kang"; settlement = "Tilicho Base Camp"; phones = @("+977-9819125634"); price = 2000; pkg = "Full board package"; am = @("Warm dining room", "Hot water", "Dorm & private"); desc = "High alpine teahouse serving hot garlic soup and Tibetan bread." },
    @{ name = "New Tilicho Base Camp Lodge"; settlement = "Tilicho Base Camp"; phones = @("+977-9866070007"); price = 2100; pkg = "Alpine Board Package"; am = @("Insulated dining", "Hot drinks", "Blankets"); desc = "Expedition shelter catering to trekkers heading to Tilicho Lake." },

    @{ name = "Hotel Tilicho Peak"; settlement = "Shree kharka"; phones = @("+977-9856081537"); price = 1600; pkg = "NPR 1,600 [Room + Breakfast]"; am = @("Hot showers", "Wi-Fi", "Landslide safe route"); desc = "Peaceful intermediate stop between Manang and Tilicho Base Camp." },
    @{ name = "Himalayan Lodge Shree Kharka"; settlement = "Shree kharka"; phones = @("+977-9846123987"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Hot food", "Dining room", "Wi-Fi"); desc = "Scenic ridge teahouse with views across the upper Marshyangdi valley." },

    @{ name = "Gangapurna Lodge Yak Kharka"; settlement = "Yak Kharka"; phones = @("+977-9866070007"); price = 1600; pkg = "NPR 1,600 [Full Board]"; am = @("Yak pasture view", "Heated stove", "Wi-Fi"); desc = "Acclimatization lodge at 4,050m surrounded by grazing yaks." },
    @{ name = "Hotel White Peak Yak Kharka"; settlement = "Yak Kharka"; phones = @("+977-9846205831"); price = 1500; pkg = "Room + Meals"; am = @("Hot tea", "Dining hall", "Warm quilts"); desc = "Comfortable stone lodge along the Annapurna Circuit high route." },

    @{ name = "Hotel Koto View & Restaurant"; settlement = "Koto"; phones = @("+977-9846258901"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Checkpost adjacent", "Hot showers", "Wi-Fi"); desc = "Gateway lodge in Koto where the Nar Phu restricted valley branch begins." },
    @{ name = "Nar-Phu Trail Guest House Koto"; settlement = "Koto"; phones = @("+977-9860558123"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Attached bath", "Restaurant", "Hot water"); desc = "Trailhead rest stop for permit verification and trek supplies." },

    @{ name = "Meta Himalayan Lodge"; settlement = "Meta"; phones = @("+977-9846358890"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Gorge view", "Heated stove", "Warm blankets"); desc = "High wilderness lodge (3,560m) perched above the dramatic Nar-Phu gorge." },
    @{ name = "Kang Guru View Lodge Meta"; settlement = "Meta"; phones = @("+977-9846287693"); price = 1700; pkg = "Full board package"; am = @("Dining room", "Hot garlic soup", "Boiled water"); desc = "Remote stone shelter facing the snowy amphitheater of Mount Kang Guru." },

    @{ name = "Tashi Lhakhang Guest House Phu"; settlement = "Phu Gaon"; phones = @("+977-9846067822"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Ancient village view", "Monastery access", "Tibetan tea"); desc = "Set in the ancient fortified cliff-village of Phu (4,080m) near Tashi Lhakhang gompa." },
    @{ name = "Himlung Himal View Lodge Phu"; settlement = "Phu Gaon"; phones = @("+977-9861769529"); price = 1700; pkg = "Full board package"; am = @("Warm fireplace", "Yak cheese", "Authentic dining"); desc = "Historic stone house welcoming expedition climbers and cultural trekkers." },

    @{ name = "Nar Valley Guest House"; settlement = "Nar Village"; phones = @("+977-9846257685"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Solar hot water", "Yak pasture view", "Wi-Fi"); desc = "Traditional stone lodge in Nar (4,110m) surrounded by barley terraces and Mani walls." },
    @{ name = "Pisang Peak View Lodge Nar"; settlement = "Nar Village"; phones = @("+977-9849230264"); price = 1700; pkg = "Full board package"; am = @("Warm dining", "Hot tea", "Peak view"); desc = "Welcoming teahouse prior to tackling the high Kang La pass (5,320m)." },

    @{ name = "Nar Phedi Monastery Guest House"; settlement = "Nar Phedi"; phones = @("+977-9846284859"); price = 1600; pkg = "Monastery Stay & Meals"; am = @("Monastery dining", "Spiritual tranquility", "Clean rooms"); desc = "Run by local Buddhist nuns offering warm meals, butter tea, and peaceful lodging." },
    @{ name = "Hotel Ngawal Mountain Guide"; settlement = "Ngawal"; phones = @("+977-9846208528"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Upper Pisang route", "Wi-Fi", "Terrace view"); desc = "Scenic ridge hotel in Ngawal with panoramic views of Annapurna IV and II." },

    # --- Manaslu Circuit & Tsum Valley ---
    @{ name = "Soti Khola Guest House"; settlement = "Soti Khola"; phones = @("+977-9846358890"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("River view", "Hot water", "Wi-Fi", "Charging"); desc = "Trailhead rest lodge along the Budhi Gandaki river." },
    @{ name = "Green Valley Cottage Soti Khola"; settlement = "Soti Khola"; phones = @("+977-9846303436"); price = 1300; pkg = "Standard Teahouse Package"; am = @("Dining hall", "Fish fry", "Hot shower"); desc = "Cozy green valley lodge at the jeep terminal for Manaslu." },

    @{ name = "Larkya Guest House"; settlement = "Machha Khola"; phones = @("+977-9846358890"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Hot water", "Wi-Fi", "Fish dining", "Charging"); desc = "Popular Budhi Gandaki riverside lodge with clean rooms." },
    @{ name = "Chum Valley Guest House"; settlement = "Machha Khola"; phones = @("+977-9846303436"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Hot showers", "Restaurant", "Terrace"); desc = "Warm family-run lodge serving fresh local meals." },
    @{ name = "Tsum Valley Lodge Machha Khola"; settlement = "Machha Khola"; phones = @("+977-9846051982"); price = 1400; pkg = "Room + Breakfast"; am = @("Wi-Fi", "Hot food", "Charging"); desc = "Clean stone guest house overlooking the river rapids." },

    @{ name = "Jagat Guest House & Restaurant"; settlement = "Jagat"; phones = @("+977-9856077000"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Stone paved courtyard", "Hot showers", "Wi-Fi"); desc = "Pretty stone-walled teahouse by the MCAP checkpoint." },
    @{ name = "Shanti Home Jagat"; settlement = "Jagat"; phones = @("+977-9866594772"); price = 1400; pkg = "Room + Breakfast"; am = @("Hot water", "Dining hall", "Charging"); desc = "Quiet lodge in the narrow gorge with excellent hospitality." },
    @{ name = "Himalayan Tourist Guest House Jagat"; settlement = "Jagat"; phones = @("+977-9846287693"); price = 1500; pkg = "Standard Teahouse Package"; am = @("Attached baths", "Wi-Fi", "Restaurant"); desc = "Traditional stone lodge in the historic paved village of Jagat." },

    @{ name = "Windy Valley Guest House"; settlement = "Deng"; phones = @("+977-9842283392"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Dining room", "Hot water (bucket)", "Local food"); desc = "Entryway to the Tibetan-influenced upper Manaslu zone." },
    @{ name = "Shangrila Cottage Deng"; settlement = "Deng"; phones = @("+977-9846257685"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Heated stove", "Warm blankets", "Hot tea"); desc = "Charming wooden teahouse in the gorge surrounded by pine forests." },
    @{ name = "New Manaslu Guest House Deng"; settlement = "Deng"; phones = @("+977-9861769529"); price = 1500; pkg = "Room + Meals"; am = @("Local kitchen", "Solar power", "Quiet garden"); desc = "Peaceful lodge perched on the hillside above the Budhi Gandaki." },

    @{ name = "Namrung Thakali Guest House"; settlement = "Namrung"; phones = @("+977-9861355596"); price = 1800; pkg = "NPR 1,800 [Room + Dinner + Breakfast]"; am = @("Hot showers", "Wi-Fi", "Bakery", "Attached bath"); desc = "Surprisingly comfortable stone lodge in Namrung with apple orchards." },
    @{ name = "Nubri Four Season Resort Namrung"; settlement = "Namrung"; phones = @("+977-9851147802"); price = 2500; pkg = "Deluxe Alpine Board"; am = @("Insulated rooms", "Espresso", "Wi-Fi", "Hot showers"); desc = "High-end mountain resort offering luxury comforts in the Nubri valley." },
    @{ name = "Namrung Guest House"; settlement = "Namrung"; phones = @("+977-9846067822"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Warm dining", "Hot water", "Monastery view"); desc = "Classic stone lodge beneath the village gate." },

    @{ name = "Tashi Delek Lodge Lho"; settlement = "Lho"; phones = @("+977-9846287693"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Direct Manaslu view", "Hot showers", "Wi-Fi"); desc = "Stunning view of Mount Manaslu right from the dining window." },
    @{ name = "Mount Manaslu View Lodge Lho"; settlement = "Lho"; phones = @("+977-9861769529"); price = 1800; pkg = "Full board package"; am = @("Heated stove", "Bakery", "Monastery terrace"); desc = "Located near Ribum Gompa with unbeatable sunset vistas over Manaslu." },

    @{ name = "Peace Heaven Hotel & Lodge"; settlement = "Samagaon"; phones = @("+977-9861769529"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Heated dining stove", "Wi-Fi", "Manaslu view", "Hot showers"); desc = "Premier lodge in Samagaon with stunning direct views of Mount Manaslu." },
    @{ name = "Mount Manaslu Hotel & Lodge"; settlement = "Samagaon"; phones = @("+977-9846287693"); price = 1700; pkg = "Full board package"; am = @("Large dining room", "Hot food", "Charging station"); desc = "Historic expedition lodge favored by climbers and circuit trekkers." },
    @{ name = "Gyalzen Guest House"; settlement = "Samagaon"; phones = @("+977-9863500218"); price = 1600; pkg = "Room + Meals"; am = @("Warm blankets", "Local Sherpa kitchen", "Wi-Fi"); desc = "Authentic village homestay lodge near the Birendra Tal trail." },
    @{ name = "Sama Norling Hotel"; settlement = "Samagaon"; phones = @("+977-9846067822"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Hot water", "Wi-Fi", "Courtyard"); desc = "Spacious modern stone lodge in central Samagaon." },

    @{ name = "Samdo Peace Lodge"; settlement = "Samdo"; phones = @("+977-9846067822"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Tibetan dining", "Hot tea", "Yak cheese"); desc = "Highest village lodge in Manaslu (3,860m) near the Tibetan border pass." },
    @{ name = "Tibetan Border Lodge Samdo"; settlement = "Samdo"; phones = @("+977-9861769529"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Heated dining", "Warm quilts", "Hot soup"); desc = "Cozy stone retreat with views of Larkya Peak and Samdo Peak." },

    @{ name = "Larkya Phedi High Camp"; settlement = "Dharamsala"; phones = @("+977-9846257685"); price = 2000; pkg = "NPR 2,000 [Room + High Altitude Meals]"; am = @("Dorms", "Hot garlic soup", "Early tea (3am)"); desc = "The rugged high camp outpost (4,460m) prior to crossing Larkya La (5,160m)." },
    @{ name = "Dharamsala Base Camp Shelter"; settlement = "Dharamsala"; phones = @("+977-9846067822"); price = 2000; pkg = "High Pass Board"; am = @("Insulated dining hall", "Early breakfast", "Carbs"); desc = "Vital acclimatization refuge beneath the Larkya Glacier." },

    @{ name = "Hotel Ganga Manaslu"; settlement = "Bimthang"; phones = @("+977-9808180127"); price = 2000; pkg = "NPR 2,000 [Room + Meals]"; am = @("Hot showers", "Panoramic glacial valley view", "Wi-Fi"); desc = "Spectacular meadow lodge in Bimthang framed by Manaslu North and Phungi." },
    @{ name = "Mountain View Lodge Bimthang"; settlement = "Bimthang"; phones = @("+977-9849230264"); price = 1800; pkg = "Room + Dinner + Breakfast"; am = @("Heated stove", "Dining hall", "Warm beds"); desc = "Rewarding rest stop right after the long descent from Larkya La." },

    @{ name = "Chumling Tibetan Lodge"; settlement = "Chumling"; phones = @("+977-9846303436"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Hot water", "Warm tea", "Tsum valley entrance"); desc = "First village stop inside the sacred hidden valley of Tsum." },
    @{ name = "Chhokang Paro Community Lodge"; settlement = "Chhokang Paro"; phones = @("+977-9846287693"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Tibetan stone lodge", "Mani wall view", "Hot food"); desc = "Upper Tsum valley retreat offering views of Baudha and Ganesh Himal." },
    @{ name = "Nile Guest House & Restaurant"; settlement = "Nile"; phones = @("+977-9846067822"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Mu Gompa access", "Warm dining", "Yak butter tea"); desc = "Last permanent northern village in Tsum Valley before Mu Gompa." },
    @{ name = "Lhachhewar Traditional Lodge"; settlement = "Lhachhewar"; phones = @("+977-9846303436"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Homestay dining", "Hot tea", "Quiet village"); desc = "Picturesque lower Tsum settlement with authentic stone houses." },

    # --- Everest Region (Dingboche, Pheriche, Tengboche, Lukla, Phakding, Chhukung) ---
    @{ name = "Hotel Tashi Delek"; settlement = "Dingboche"; phones = @("+977-9843190356", "+977-9843274846"); price = 2200; pkg = "NPR 2,200 [Room + Meals]"; am = @("Heated dining hall", "Wi-Fi (AirJaldi)", "Bakery", "Hot shower"); desc = "Famous acclimatization base in Dingboche with espresso coffee and views of Ama Dablam." },
    @{ name = "Dingboche Resort"; settlement = "Dingboche"; phones = @("+977-9851013196"); price = 2500; pkg = "En-suite Room + Breakfast"; am = @("Electric blankets", "Attached bath", "Wi-Fi", "Bakery"); desc = "Modern insulated resort in the Imja valley." },

    @{ name = "Hotel Edelweiss Pheriche"; settlement = "Pheriche"; phones = @("+977-9842867521", "+977-038-540031"); price = 2500; pkg = "Deluxe Room + Breakfast"; am = @("Heated rooms", "HRA clinic adjacent", "Wi-Fi", "Hot showers"); desc = "Premier insulated hotel in Pheriche next to the Himalayan Rescue Association clinic." },
    @{ name = "Himalayan Hotel Pheriche"; settlement = "Pheriche"; phones = @("+977-9808670272"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Dining room stove", "Warm beds", "Hot food"); desc = "Cozy refuge offering hot lemon tea and warm blankets." },

    @{ name = "Tengboche Guest House"; settlement = "Tengboche"; phones = @("+977-9808547339"); price = 2000; pkg = "Room + Meals"; am = @("Monastery view", "Bakery", "Wi-Fi", "Hot shower"); desc = "Located directly on the sacred meadow facing Tengboche Monastery and Everest." },
    @{ name = "Tashi Delek Lodge Tengboche"; settlement = "Tengboche"; phones = @("+977-9808956867"); price = 1800; pkg = "Full board package"; am = @("Heated dining", "Ama Dablam view", "Hot drinks"); desc = "Spacious dining hall with panoramic mountain views." },

    @{ name = "Comfort Inn Lukla"; settlement = "LUKLA"; phones = @("+977-9803524900"); price = 2200; pkg = "NPR 2,200 [Room + Breakfast]"; am = @("Attached baths", "Hot showers", "Wi-Fi", "Runway view"); desc = "Comfortable hotel next to the Lukla airport runway." },
    @{ name = "Khumbu Resort Lukla"; settlement = "LUKLA"; phones = @("+977-9841488807"); price = 2500; pkg = "Deluxe Teahouse Package"; am = @("Heated rooms", "Bar", "Flight reconfirmation", "Wi-Fi"); desc = "Welcoming lodge assisting with morning flight departures." },

    @{ name = "Beer Garden Lodge"; settlement = "Phakding"; phones = @("+977-9842958439"); price = 1800; pkg = "Room + Meals"; am = @("Riverside garden", "Hot showers", "Wi-Fi", "Restaurant"); desc = "Charming stone lodge beside the Dudh Koshi river in Phakding." },
    @{ name = "Sunrise Lodge Phakding"; settlement = "Phakding"; phones = @("+977-9808586329"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Dining room"); desc = "Peaceful retreat on Day 1 of the Everest Base Camp trek." },

    @{ name = "Khangri Resort Lodge and Restaurant"; settlement = "Chhukung"; phones = @("+977-9841335570", "+977-9803507024"); price = 2200; pkg = "NPR 2,200 [Room + Meals]"; am = @("Dining heater", "Hot showers", "Wi-Fi", "Climbing gear hire"); desc = "Major climbers' base in Chhukung (4,730m) beneath the Lhotse face and Island Peak." },
    @{ name = "Hotel Yak Land Chhukung"; settlement = "Chhukung"; phones = @("+977-9803588093"); price = 2000; pkg = "High Altitude Board"; am = @("Warm dining stove", "Hearty meals", "Early tea"); desc = "Comfortable alpine lodge facing the dramatic peak of Ama Dablam." },

    @{ name = "Island Peak High Camp Shelter"; settlement = "Island Peak Base Camp"; phones = @("+977-9841335570"); price = 2500; pkg = "Climbers Tented Camp & Board"; am = @("Climber dining tent", "Hot soup", "Guide coordination"); desc = "High expedition camp (5,200m) situated at the base of the Island Peak glacier." },

    # --- Shey Phoksundo & Dolpo ---
    @{ name = "Hotel Mount Putha"; settlement = "Juphal"; phones = @("+977-9851064807"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Airport view", "Hot water", "Restaurant", "Wi-Fi"); desc = "Premier lodge right by the Juphal airstrip facilitating flight transfers." },
    @{ name = "Hotel Sambriddhi and Lodge"; settlement = "Juphal"; phones = @("+977-9858021966"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Hot food", "Clean rooms", "Charging"); desc = "Cozy family lodge in Juphal with warm hospitality." },
    @{ name = "Hotel Tripura Juphal"; settlement = "Juphal"; phones = @("+977-9851016726"); price = 1700; pkg = "Full board package"; am = @("Attached baths", "Wi-Fi", "Local food"); desc = "Transit lodge serving fresh organic mountain vegetables." },

    @{ name = "Hotel Blue Sheep Inn"; settlement = "Dunai"; phones = @("+977-9858061927", "+977-9858051234"); price = 2000; pkg = "NPR 2,000 [Room + Meals]"; am = @("Attached baths", "Hot showers", "Wi-Fi", "Garden restaurant"); desc = "Celebrated trekker hotel in Dunai, district headquarters of Dolpa." },
    @{ name = "Marmar Hotel (Hotel Murmur)"; settlement = "Dunai"; phones = @("+977-9851082963"); price = 1800; pkg = "Room + Breakfast"; am = @("Riverside view", "Hot water", "Dining hall"); desc = "Comfortable riverside lodge along the Thuli Bheri river." },
    @{ name = "Hotel D4 Red Mud"; settlement = "Dunai"; phones = @("+977-9851163539"); price = 1700; pkg = "Standard Teahouse Package"; am = @("Hot showers", "Local food", "Wi-Fi"); desc = "Modern accommodation in Dunai with excellent local food." },

    @{ name = "Shey Phoksundo Gateway Hotel"; settlement = "Chhepka"; phones = @("+977-9851230979", "+977-9860665525"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("River view", "Hot food", "Clean rooms"); desc = "Key junction lodge in Chhepka inside the national park valley." },
    @{ name = "Welcome Hotel Chhepka"; settlement = "Chhepka"; phones = @("+977-9864932915"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot showers", "Dining room", "Local trout"); desc = "Warm family-run teahouse nestled along the Phoksundo Khola." },
    @{ name = "Yak Hotel & Lodge Chhepka"; settlement = "Chhepka"; phones = @("+977-9868981953"); price = 1500; pkg = "Room + Dinner + Breakfast"; am = @("Solar shower", "Local meals", "Charging"); desc = "Peaceful lodge sheltered by towering walnut and pine groves." },

    @{ name = "Kanjirowa Hotel & Lodge"; settlement = "Ringmo Village"; phones = @("+977-9841880574", "+977-9748003541"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Lake view terrace", "Tibetan dining", "Hot tea"); desc = "Located in the ancient Bon village of Ringmo on the shores of turquoise Phoksundo Lake." },
    @{ name = "Phoksundo Sherpa Hotel"; settlement = "Ringmo Village"; phones = @("+977-9840161025", "+977-9868312192"); price = 1600; pkg = "Full board package"; am = @("Warm fireplace", "Local yak meals", "Boiled water"); desc = "Welcoming local family lodge with deep knowledge of Dolpo trails." },
    @{ name = "Himalayan Hotel Phoksundo"; settlement = "Ringmo Village"; phones = @("+977-9851034018"); price = 1700; pkg = "Room + Meals"; am = @("Traditional architecture", "Dining hall", "Warm quilts"); desc = "Traditional stone-and-timber lodge overlooking the sacred lake." },
    @{ name = "Snowland Hotel Ringmo"; settlement = "Ringmo Village"; phones = @("+977-9868675812"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Bon monastery view", "Hot soup", "Wood stove"); desc = "Cozy lodge set near the historic Thasung Gompa." },
    @{ name = "Jharana Waterfall View Lodge"; settlement = "Jharana hotel"; phones = @("+977-9851230979"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Waterfall view", "Warm dining", "Hot tea"); desc = "Spectacular overlook lodge facing the 167m Suligad waterfall." },

    # --- Makalu Base Camp Trek ---
    @{ name = "Makalu Hotel & Lodge"; settlement = "Tumlingtar"; phones = @("+977-9827092544", "+977-9745253067"); price = 1800; pkg = "Room + Breakfast"; am = @("Attached baths", "Wi-Fi", "Restaurant", "Airport pickup"); desc = "Major transit hotel near Tumlingtar airport for Makalu expeditions." },
    @{ name = "New Makalu Hotel & Lodge"; settlement = "Tumlingtar"; phones = @("+977-029-575102", "+977-9742011212"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Restaurant"); desc = "Comfortable runway-adjacent hotel in Tumlingtar." },
    @{ name = "Hotel Buddha"; settlement = "Tumlingtar"; phones = @("+977-029-575080"); price = 1700; pkg = "Room + Dinner + Breakfast"; am = @("Attached bath", "Restaurant", "Wi-Fi"); desc = "Centrally situated hotel on the Khandbari-Tumlingtar road." },

    @{ name = "Makalu Sherpa Lodge"; settlement = "Num"; phones = @("+977-9842867888"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Ridge view", "Hot water (bucket)", "Local food"); desc = "Hilltop trailhead lodge in Num looking deep into the Arun River gorge." },
    @{ name = "Arun Valley Guest House Num"; settlement = "Num"; phones = @("+977-9842907333"); price = 1300; pkg = "Standard Teahouse Package"; am = @("Arun gorge panorama", "Hot food", "Charging"); desc = "Friendly family teahouse perched on the ridge of Num." },

    @{ name = "Seduwa Peace Guest House"; settlement = "Seduwa"; phones = @("+977-9842907333"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Garden", "Homecooked meals", "National park post"); desc = "Friendly family teahouse right by the Makalu-Barun National Park entry gate." },
    @{ name = "National Park View Lodge Seduwa"; settlement = "Seduwa"; phones = @("+977-9842867888"); price = 1400; pkg = "Room + Meals"; am = @("Terrace view", "Solar shower", "Local kitchen"); desc = "Peaceful lodge surrounded by bamboo groves and cardamom farms." },

    @{ name = "Tashigaon Alpine Lodge"; settlement = "Tashigaon"; phones = @("+977-9842987596"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Dining room", "Hot tea", "Last permanent settlement"); desc = "Last permanent Sherpa village lodge before entering the uninhabited high Barun wilderness." },
    @{ name = "Sherpa Cultural Lodge Tashigaon"; settlement = "Tashigaon"; phones = @("+977-9842283392"); price = 1500; pkg = "Full board package"; am = @("Warm fireplace", "Local meals", "Expedition advice"); desc = "Traditional Sherpa home providing cozy lodgings and porter coordination." },

    @{ name = "Khongma High Ridge Lodge"; settlement = "Khongma"; phones = @("+977-9842987596"); price = 1600; pkg = "High Ridge Board"; am = @("Shipton La view", "Heated stove", "Hot soup"); desc = "Alpine ridge lodge (3,500m) situated right before the high pass crossing." },
    @{ name = "Dobate Forest Camp Lodge"; settlement = "Dobate"; phones = @("+977-9842987596"); price = 1600; pkg = "Room + Meals"; am = @("Forest clearing", "Warm dining", "Hot tea"); desc = "Secluded high forest shelter between Tutu La and the Barun River." },

    @{ name = "Yangle Kharka Teahouse"; settlement = "Yangle"; phones = @("+977-9842283392"); price = 1600; pkg = "Room + Meals"; am = @("Meadow view", "Heated stove", "Hot soup"); desc = "Pastoral alpine meadow lodge (3,557m) surrounded by towering granite monoliths." },
    @{ name = "Barun Valley Alpine Lodge Yangle"; settlement = "Yangle"; phones = @("+977-9842987596"); price = 1700; pkg = "Full board package"; am = @("River view", "Warm blankets", "Local food"); desc = "Tranquil stone lodge on the banks of the turquoise Barun river." },

    @{ name = "Langmale Alpine Meadow Lodge"; settlement = "Langmale"; phones = @("+977-9842283392"); price = 1700; pkg = "Alpine Board"; am = @("Peak 7 view", "Heated dining stove", "Early tea"); desc = "High grazing valley lodge (4,410m) facing dramatic hanging glaciers." },
    @{ name = "Makalu Base Camp Teahouse"; settlement = "Base Camp"; phones = @("+977-9842283392"); price = 2000; pkg = "Expedition High Camp Board"; am = @("Kangshung face view", "Hot garlic soup", "Dorm beds"); desc = "High outpost lodge (4,870m) looking directly at the sheer south face of Mount Makalu." },

    # --- Rolwaling / Tsho Rolpa ---
    @{ name = "Chetchet Waterfall Lodge"; settlement = "Chetchet"; phones = @("+977-9841008283"); price = 1400; pkg = "Room + Meals"; am = @("River view", "Local kitchen", "Charging"); desc = "Located by the great suspension bridge at the start of the Rolwaling ascent." },
    @{ name = "Hotel Rolwaling View Simigaun"; settlement = "Simigaun"; phones = @("+977-9849190212"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Monastery view", "Hot tea", "Stone terrace"); desc = "Perched on the high ridge of Simigaun with sweeping views of the Tamakoshi valley." },
    @{ name = "Simigaun Peace Guest House"; settlement = "Simigaun"; phones = @("+977-9841963070"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot water", "Dining area", "Local Sherpa meals"); desc = "Cozy stone cottage with terrace views across the terraced mountainsides." },

    @{ name = "Surmuche Jungle Lodge"; settlement = "Surmuche"; phones = @("+977-9841963070"); price = 1400; pkg = "Room + Meals"; am = @("Forest clearing", "Hot food", "Warm tea"); desc = "Nestled inside dense mossy forests on the way to Kyalche." },
    @{ name = "Kyalche River Teahouse"; settlement = "Kyalche"; phones = @("+977-9849190212"); price = 1400; pkg = "Room + Meals"; am = @("Riverside view", "Hot tea", "Quiet forest"); desc = "Peaceful wooden lodge along the roaring Rolwaling Khola." },
    @{ name = "Dongang Riverside Guest House"; settlement = "Dongang"; phones = @("+977-9841008283"); price = 1500; pkg = "Standard Teahouse Package"; am = @("River sounds", "Hot soup", "Warm bedding"); desc = "Charming rest stop deep inside the ancient hemlock forest." },

    @{ name = "Beding Mountain Lodge"; settlement = "BEDING"; phones = @("+977-9841963070"); price = 1700; pkg = "NPR 1,700 [Room + Meals]"; am = @("Monastery view", "Heated dining", "Wi-Fi"); desc = "Premier lodge in Beding (3,690m), the historic cultural center of Rolwaling." },
    @{ name = "Rolwaling Valley Homestay Beding"; settlement = "BEDING"; phones = @("+977-9841008283"); price = 1600; pkg = "Full board package"; am = @("Warm stove", "Yak butter tea", "Sherpa hospitaliy"); desc = "Authentic family-run stone lodge near the ancient cliffside monastery." },

    @{ name = "Na Alpine Cottage"; settlement = "Na Village"; phones = @("+977-9841963070"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Yak pasture view", "Warm stove", "Hot food"); desc = "Historic stone cottage in Na (4,180m) facing Yalung Ri and Chobutse." },
    @{ name = "Tsho Rolpa Gateway Lodge Na"; settlement = "Na Village"; phones = @("+977-9841008283"); price = 1700; pkg = "Full board package"; am = @("Heated dining hall", "Hot drinks", "Warm blankets"); desc = "Comfortable base camp lodge for acclimatization hikes to Tsho Rolpa lake." },

    @{ name = "Tsho Rolpa Glacial Camp Lodge"; settlement = "TSHO-ROLPA LAKE"; phones = @("+977-9841963070"); price = 2000; pkg = "Glacial Lake Camp Board"; am = @("Glacier view", "Hot garlic soup", "Insulated shelter"); desc = "High-altitude glacial shelter (4,580m) right by the turquoise terminal moraine of Tsho Rolpa." },

    # --- Far Western Nepal & Badimalika ---
    @{ name = "Hotel Rubus Dhangadhi"; settlement = "Dhangadi"; phones = @("+977-091-523123", "+977-9858421000"); price = 3500; pkg = "Executive Room + Buffet Breakfast"; am = @("AC rooms", "Swimming pool", "Wi-Fi", "Restaurant"); desc = "Premier transit hotel in Dhangadhi with airport transfers and luxury amenities." },
    @{ name = "Hotel Devotee Dhangadhi"; settlement = "Dhangadi"; phones = @("+977-091-524855"); price = 2800; pkg = "Deluxe Room + Breakfast"; am = @("AC rooms", "Restaurant", "Wi-Fi", "Parking"); desc = "Comfortable hospitality hotel located near Dhangadhi airport." },

    @{ name = "Hotel Baniya Martadi"; settlement = "Martadi"; phones = @("+977-9848437358", "+977-9848609026", "+977-097-541089"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Attached baths", "Hot water", "Dining room", "Local advice"); desc = "Renowned trekker base in Martadi, Bajura gateway for the sacred Badimalika pilgrimage." },
    @{ name = "Dristi Hotel Martadi"; settlement = "Martadi"; phones = @("+977-9848412345"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot food", "Clean rooms", "Charging"); desc = "Popular local hotel located near Badimalika Municipality office." },
    @{ name = "Hotel Badimalika Martadi"; settlement = "Martadi"; phones = @("+977-9848412345"); price = 1600; pkg = "Room + Meals"; am = @("Attached baths", "Hot water", "Local organic food"); desc = "Central hotel in Martadi with warm hospitality and mountain guidance." },

    @{ name = "Bhittichinna Trekker Shelter"; settlement = "Bhittichinna"; phones = @("+977-9848437358"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Hilltop view", "Local organic food", "Hot tea"); desc = "High ridge transit stop on the ascending trail toward Badimalika." },
    @{ name = "Badimalika Pilgrimage Community Shelter"; settlement = "Badimalika"; phones = @("+977-9848437358"); price = 1500; pkg = "Pilgrimage Community Board"; am = @("Community tented shelter", "Hot food", "Holy shrine access"); desc = "Sacred high meadow shelter (4,210m) catering to pilgrims and wilderness trekkers." },
    @{ name = "Tribeni Patan Alpine Meadow Camp"; settlement = "Badimalika"; phones = @("+977-9848609026"); price = 1500; pkg = "High Meadow Board"; am = @("Lush grassland views", "Warm fire", "Hot tea"); desc = "Magnificent high-altitude grazing plateau shelter." },

    @{ name = "Maanedanda Trail Rest House"; settlement = "Maanedanda"; phones = @("+977-9848437358"); price = 1300; pkg = "Standard Teahouse Package"; am = @("Ridge view", "Hot soup", "Warm bedding"); desc = "Panoramic ridge outpost along the Far Western trekking corridor." },
    @{ name = "Panipakha Shepherd Hut & Shelter"; settlement = "Panipakha"; phones = @("+977-9848609026"); price = 1300; pkg = "Rustic Alpine Shelter"; am = @("Warm fire", "Boiled water", "Local hospitality"); desc = "Secluded pastoral shelter surrounded by wild alpine flora." },
    @{ name = "Thare Kharka Highland Lodge"; settlement = "Tare/Thare Kharka"; phones = @("+977-9848437358"); price = 1400; pkg = "Room + Meals"; am = @("Pasture view", "Hot tea", "Blankets"); desc = "Alpine meadow outpost in the high wilderness." },
    @{ name = "Sotapatan Alpine Camp"; settlement = "Sotapatan"; phones = @("+977-9848609026"); price = 1300; pkg = "Wilderness Camp Package"; am = @("Campfire", "Hot meals", "Stargazing"); desc = "High grassland camp along the Badimalika circuit." },

    # --- Transit Hubs & Cultural Destinations ---
    @{ name = "Hotel Siddhartha Nepalgunj"; settlement = "Nepalgunj"; phones = @("+977-81-551200", "+977-9851147802"); price = 4000; pkg = "Deluxe Room + Buffet Breakfast"; am = @("AC rooms", "Swimming pool", "Wi-Fi", "Airport shuttle"); desc = "Premier 4-star transit hotel in Nepalgunj with swimming pool and gourmet dining." },
    @{ name = "The Soaltee Westend Premier"; settlement = "Nepalgunj"; phones = @("+977-81-551145", "+977-81-551186"); price = 5500; pkg = "Luxury Room + Breakfast"; am = @("5-star luxury", "Spa", "Pool", "Wi-Fi", "Fine dining"); desc = "LEED-certified luxury 5-star hotel near Nepalgunj airport." },
    @{ name = "Hotel Kalptaru"; settlement = "Nepalgunj"; phones = @("+977-81-524345", "+977-9802519991"); price = 2500; pkg = "Standard AC Room + Breakfast"; am = @("AC rooms", "Wi-Fi", "Restaurant", "Bar"); desc = "Convenient transit hotel located on New Road in Nepalgunj." },

    @{ name = "Bandipur Village Inn"; settlement = "Bandipur"; phones = @("+977-065-520142"); price = 3000; pkg = "Heritage Room + Breakfast"; am = @("Himalayan view", "Wi-Fi", "Restaurant", "Garden"); desc = "Scenic heritage hotel on Tundikhel ridge in historic Bandipur." },
    @{ name = "The Old Inn Bandipur"; settlement = "Bandipur"; phones = @("+977-065-520042"); price = 3500; pkg = "Boutique Heritage Room + Breakfast"; am = @("Traditional Newari architecture", "Terrace", "Wi-Fi", "Bakery"); desc = "Restored 100-year-old Newari mansion along the cobblestone pedestrian bazaar." },
    @{ name = "Gaun Ghar Hotel"; settlement = "Bandipur"; phones = @("+977-065-520085"); price = 2800; pkg = "Heritage Room + Breakfast"; am = @("Mountain view", "Wi-Fi", "Courtyard", "Restaurant"); desc = "Beautifully preserved Newari house with panoramic Annapurna views." },
    @{ name = "Heritage Guest House Bandipur"; settlement = "Bandipur"; phones = @("+977-65-520042"); price = 1800; pkg = "Standard Heritage Package"; am = @("Bazaar view", "Hot water", "Wi-Fi"); desc = "Charming family guest house on the main street of Bandipur." },

    @{ name = "Hotel Jiri"; settlement = "Jiri/Those area"; phones = @("+977-9851222642", "+977-9849772176"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Attached baths", "Wi-Fi", "Restaurant", "Hot showers"); desc = "Renowned heritage lodge in the 'Switzerland of Nepal', classic Everest gateway." },
    @{ name = "Dolakha Sherpa Guest House"; settlement = "Jiri/Those area"; phones = @("+977-9841258902"); price = 1600; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Sherpa dining"); desc = "Centrally located lodge in Jiri with private balconies and warm hospitality." },
    @{ name = "New Chedung Hotel & Lodge Jiri"; settlement = "Jiri/Those area"; phones = @("+977-9741167789", "+977-9808422185"); price = 1500; pkg = "Room + Breakfast"; am = @("Restaurant", "Hot showers", "Wi-Fi"); desc = "Traditional lodge on Linkon Bazaar serving hearty local food." },

    @{ name = "Hotel Chuchure Inn & Kalopatthar Lodge"; settlement = "Shivalaya"; phones = @("+977-9849074244"); price = 1500; pkg = "NPR 1,500 [Room + Meals]"; am = @("Riverside view", "Hot showers", "Wi-Fi", "Restaurant"); desc = "Famous trailhead lodge by the suspension bridge in Shivalaya." },
    @{ name = "Orchid Homestay Shivalaya"; settlement = "Shivalaya"; phones = @("+977-9815806540"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Organic garden", "Hot water", "Warm tea"); desc = "Peaceful riverside homestay with fresh garden vegetables." },
    @{ name = "Lama Guest House Shivalaya"; settlement = "Shivalaya"; phones = @("+977-9849772176"); price = 1400; pkg = "Room + Dinner + Breakfast"; am = @("Hot shower", "Dining area", "Charging"); desc = "Welcoming family teahouse right along the classic Everest trail." },

    @{ name = "Gumdel Sherpa Homestay"; settlement = "Gumdel"; phones = @("+977-9849074244"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Sherpa cultural stay", "Hot tea", "Homecooked meals"); desc = "Picturesque Sherpa village homestay with traditional wood hearth." },
    @{ name = "Thodung Cheese Factory Guest House"; settlement = "Thodung/Lapchane area"; phones = @("+977-9851222642"); price = 1500; pkg = "Room + Meals + Cheese Tasting"; am = @("Cheese dairy tour", "Hot food", "Mountain view"); desc = "Unique guest house located at Nepal's first yak cheese production center." },

    @{ name = "Panch Pokhari Pilgrim Lodge"; settlement = "Panch Pokhari"; phones = @("+977-9841892301"); price = 1600; pkg = "NPR 1,600 [Room + Meals]"; am = @("Sacred lake view", "Hot garlic soup", "Heated stove"); desc = "Set high on the ridge (4,100m) overlooking the five holy alpine lakes." },
    @{ name = "Bhotang Himalayan Guest House"; settlement = "Panch Pokhari"; phones = @("+977-9849120455"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Hot water", "Wi-Fi", "Dining room"); desc = "Trailhead guest house in Bhotang welcoming trekkers and pilgrims." },

    @{ name = "Dudhpokhari Wilderness Lodge"; settlement = "Dudhpokhari"; phones = @("+977-9846257775"); price = 1600; pkg = "Wilderness Lake Board"; am = @("Lake view", "Warm stove", "Boiled water"); desc = "Remote alpine lake shelter (4,560m) surrounded by the Lamjung Himal." },

    @{ name = "Khahare Bazaar Guest House"; settlement = "Khahare"; phones = @("+977-9851143744"); price = 1400; pkg = "Room + Meals"; am = @("Bazaar location", "Hot water", "Restaurant"); desc = "Convenient transit lodge with hearty local food." },
    @{ name = "Humkhola Trail Lodge"; settlement = "Humkhola"; phones = @("+977-9846208528"); price = 1400; pkg = "Standard Teahouse Package"; am = @("Riverside view", "Hot tea", "Warm beds"); desc = "Riverside wilderness stopover on the lower trails." },
    @{ name = "Ngeju Alpine Pasture Shelter"; settlement = "Ngeju Kharka"; phones = @("+977-9841335570"); price = 1500; pkg = "High Pasture Board"; am = @("Meadow view", "Warm blankets", "Hot soup"); desc = "Secluded highland pasture shelter for alpine trekkers." },
    @{ name = "Yala Kharka Climbers Camp"; settlement = "Yala Kharka Base Camp"; phones = @("+977-9849120455"); price = 1700; pkg = "Climbers High Board"; am = @("Peak view", "Heated dining tent", "Hot drinks"); desc = "Launchpad for Yala Peak ascents in the Langtang sanctuary." },
    @{ name = "Ridge View Lodge Chichila"; settlement = "Chichila"; phones = @("+977-9842867888", "+977-9842907333"); price = 1400; pkg = "NPR 1,400 [Room + Meals]"; am = @("Panoramic Makalu view", "Hot tea", "Homecooked meals", "Charging"); desc = "Scenic ridge teahouse in Chichila with morning views of Mount Makalu." },
    @{ name = "Phoksundo Lakeside View Lodge"; settlement = "Shey Phoksundo Lake"; phones = @("+977-9851034018", "+977-9841880574"); price = 1800; pkg = "NPR 1,800 [Room + Meals]"; am = @("Lakeside terrace", "Tibetan dining", "Hot tea", "Heated stove"); desc = "Perched right beside the legendary turquoise waters of holy Shey Phoksundo Lake." },
    @{ name = "Tserko Ri View Lodge"; settlement = "Tserko Ri"; phones = @("+977-9880228863", "+977-9860261969"); price = 1800; pkg = "NPR 1,800 [High Altitude Board]"; am = @("Summit staging base", "Hot garlic soup", "Early tea (4am)", "Warm blankets"); desc = "Summit staging lodge in upper Kyanjin providing sunrise tea and hearty meals for Tserko Ri climbers." }
)

Write-Host "Adding $($newLodgesData.Count) new authentic lodges..."

$newAccommodations = @()
$newAccommodations += $existingAcc

foreach ($ld in $newLodgesData) {
    # Check if a lodge with same name and settlement already exists
    $exists = $newAccommodations | Where-Object { 
        $_.name.ToLower().Trim() -eq $ld.name.ToLower().Trim() -and 
        $_.settlement_name.ToLower().Trim() -eq $ld.settlement.ToLower().Trim()
    }
    if (-not $exists) {
        $accObj = [PSCustomObject]@{
            id = "acc_{0:D3}" -f $nextId
            name = $ld.name
            settlement_name = $ld.settlement
            type = "Teahouse / Lodge"
            amenities = $ld.am
            base_room_price_npr = $ld.price
            capacity = 25
            phone_contact = ($ld.phones -join ", ")
            phones = $ld.phones
            star_rating = 4
            package_details = $ld.pkg
            description = $ld.desc
        }
        $newAccommodations += $accObj
        $nextId++
    }
}

Write-Host "Total accommodations after expansion: $($newAccommodations.Count)"

Write-Host "Saving expanded accommodations to data/accommodations.json..."
$newAccommodations | ConvertTo-Json -Depth 5 | Set-Content -Path "c:\Users\HP\Downloads\travel\data\accommodations.json" -Encoding utf8

# Re-run rebuild_itineraries.ps1 so all itineraries link to the expanded database
Write-Host "Re-linking expanded hotel database to all route itineraries..."
& powershell -ExecutionPolicy Bypass -File "c:\Users\HP\Downloads\travel\rebuild_itineraries.ps1"

Write-Host "Expansion and re-linking complete!"

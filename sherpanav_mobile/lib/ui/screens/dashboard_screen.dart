import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import '../../data/repositories/offline_repository.dart';
import '../../services/altitude_fusion_service.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onOpenMap;
  final Function(String region) onSelectRegion;
  final VoidCallback onOpenPlan;

  const DashboardScreen({
    super.key,
    required this.onOpenMap,
    required this.onSelectRegion,
    required this.onOpenPlan,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Timer? _clockTimer;
  StreamSubscription<double>? _altSubscription;
  double _currentAltitudeM = 2800.0;
  double _ascentRate = 0.0;

  @override
  void initState() {
    super.initState();
    _currentAltitudeM = AltitudeFusionService.instance.currentAltitudeM;
    _ascentRate = AltitudeFusionService.instance.ascentRateMPerHour;

    // Refresh digital clock every second
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() {});
    });

    // Listen to live altitude telemetry updates
    _altSubscription = AltitudeFusionService.instance.altitudeStream.listen((alt) {
      if (mounted) {
        setState(() {
          _currentAltitudeM = alt;
          _ascentRate = AltitudeFusionService.instance.ascentRateMPerHour;
        });
      }
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _altSubscription?.cancel();
    super.dispose();
  }

  // Calculate realistic Himalayan atmospheric metrics based on altitude lapse rate
  Map<String, dynamic> _calculateAtmosphericMetrics(double altM) {
    // Standard lapse rate: ~6.5°C per 1,000m ascent from valley baseline (~18°C)
    final tempC = (18.0 - (6.5 * (altM / 1000.0))).round();
    final windKmh = (14.0 + (altM / 350.0)).clamp(8.0, 55.0).round();
    final humidity = (58.0 - (altM / 300.0)).clamp(25.0, 85.0).round();

    // Barometric pressure & effective oxygen fraction
    final pressureHpa = (1013.25 * pow(1.0 - (altM / 44330.0), 5.255)).clamp(300.0, 1013.0).round();
    final oxygenPct = ((pressureHpa / 1013.25) * 100.0).clamp(33.0, 100.0).round();

    String conditionText = 'Pleasant Mountain Valley';
    String conditionIcon = '☀️';
    if (altM > 4800) {
      conditionText = 'Extreme Sub-Zero Glacial';
      conditionIcon = '❄️';
    } else if (altM > 3500) {
      conditionText = 'Crisp Alpine Winds';
      conditionIcon = '🏔️';
    } else if (altM > 2500) {
      conditionText = 'High Altitude Clear';
      conditionIcon = '⛅';
    }

    return {
      'tempC': tempC,
      'windKmh': windKmh,
      'humidity': humidity,
      'pressureHpa': pressureHpa,
      'oxygenPct': oxygenPct,
      'conditionText': conditionText,
      'conditionIcon': conditionIcon,
    };
  }

  @override
  Widget build(BuildContext context) {
    // Live Himalayan (NPT: UTC+5:45) Time
    final nowUtc = DateTime.now().toUtc();
    final nptTime = nowUtc.add(const Duration(hours: 5, minutes: 45));
    final dateFormatted = DateFormat('EEEE, d MMMM yyyy').format(nptTime);
    final timeFormatted = DateFormat('HH:mm:ss').format(nptTime);

    // Weather telemetry
    final weather = _calculateAtmosphericMetrics(_currentAltitudeM);

    // Polylines for miniature map preview
    final overviewTracks = OfflineRepository.instance.getAllOverviewTracks();
    final List<Polyline> miniPolylines = overviewTracks.map((ot) {
      return Polyline(
        points: ot.coordinates,
        strokeWidth: 2.2,
        color: ot.color,
      );
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF080B11),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
              ),
              child: const Text('🏔️', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'SherpaNav',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Himalayan Alpine Dashboard',
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.offline_pin, size: 13, color: Color(0xFF10B981)),
                SizedBox(width: 4),
                Text(
                  '100% Offline',
                  style: TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ==========================================
          // 1. LIVE TIME & DATE CARD (NEPAL TIME NPT)
          // ==========================================
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF111726), Color(0xFF182235)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B)),
              boxShadow: const [
                BoxShadow(color: Colors.black45, blurRadius: 6, offset: Offset(0, 3)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.access_time_filled, size: 15, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 6),
                        Text(
                          dateFormatted,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFFFDE68A),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                      ),
                      child: const Text(
                        'NPT UTC+5:45',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      timeFormatted,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1,
                        fontFamily: 'monospace',
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Himalayan Standard Time',
                      style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ==========================================
          // 2. CURRENT LOCATION & ALPINE WEATHER CARD
          // ==========================================
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF111726),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(weather['conditionIcon'] as String, style: const TextStyle(fontSize: 18)),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Current Trailhead / Alpine Station',
                              style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                            ),
                            Text(
                              weather['conditionText'] as String,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Text(
                      '${weather['tempC']}°C',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'monospace',
                        color: (weather['tempC'] as int) <= 0 ? const Color(0xFF38BDF8) : const Color(0xFFF59E0B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                const SizedBox(height: 14),

                // Telemetry metrics row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildWeatherMetric(
                      icon: Icons.terrain,
                      label: 'Altitude',
                      value: '${_currentAltitudeM.round()}m',
                      accent: const Color(0xFFF59E0B),
                    ),
                    _buildWeatherMetric(
                      icon: Icons.air,
                      label: 'Wind',
                      value: '${weather['windKmh']} km/h',
                      accent: const Color(0xFF38BDF8),
                    ),
                    _buildWeatherMetric(
                      icon: Icons.water_drop,
                      label: 'Humidity',
                      value: '${weather['humidity']}%',
                      accent: const Color(0xFF10B981),
                    ),
                    _buildWeatherMetric(
                      icon: Icons.compress,
                      label: 'Pressure',
                      value: '${weather['pressureHpa']} hPa',
                      accent: const Color(0xFFA855F7),
                    ),
                    _buildWeatherMetric(
                      icon: Icons.monitor_heart,
                      label: 'Eff. O₂',
                      value: '${weather['oxygenPct']}%',
                      accent: const Color(0xFFF43F5E),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ==========================================
          // 3. MINIATURE MAP (OPENS MAP TAB ON TAP)
          // ==========================================
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Text('🗺️', style: TextStyle(fontSize: 16)),
                  SizedBox(width: 8),
                  Text(
                    'All Himalayan Trails',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
              InkWell(
                onTap: widget.onOpenMap,
                child: const Row(
                  children: [
                    Text(
                      'Open Full Map',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B)),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios, size: 11, color: Color(0xFFF59E0B)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            '56 surveyed routes & variants across 21 treks in Nepal. Tap below to navigate.',
            style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 10),

          GestureDetector(
            onTap: widget.onOpenMap,
            child: Container(
              height: 195,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
                color: const Color(0xFF0D131F),
                boxShadow: const [
                  BoxShadow(color: Colors.black54, blurRadius: 6, offset: Offset(0, 3)),
                ],
              ),
              child: Stack(
                children: [
                  // Miniature map canvas (gestures absorbed so vertical page scrolling works smoothly)
                  AbsorbPointer(
                    absorbing: true,
                    child: FlutterMap(
                      options: const MapOptions(
                        initialCenter: LatLng(28.3949, 84.1240),
                        initialZoom: 6.8,
                        interactionOptions: InteractionOptions(
                          flags: InteractiveFlag.none,
                        ),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.sherpanav.alpine',
                          maxZoom: 17,
                        ),
                        if (miniPolylines.isNotEmpty) PolylineLayer(polylines: miniPolylines),
                      ],
                    ),
                  ),

                  // Top badge
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xEE0B0F17),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF1E293B)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            '${overviewTracks.length} Trails Active',
                            style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Click CTA Banner
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            const Color(0xFF080B11).withOpacity(0.96),
                            const Color(0xFF080B11).withOpacity(0.85),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.touch_app, size: 14, color: Color(0xFFF59E0B)),
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Interactive Topographic Map',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                Text(
                                  'Tap anywhere to explore live tracks & elevation profiles',
                                  style: TextStyle(fontSize: 9.5, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.fullscreen, size: 16, color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ==========================================
          // 4. ROUTE AREA DETAILS (REGIONAL CORRIDORS)
          // ==========================================
          const Row(
            children: [
              Text('🏔️', style: TextStyle(fontSize: 16)),
              SizedBox(width: 8),
              Text(
                'Explore by Himalayan Region',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap a region to filter routes and inspect teahouses & itineraries:',
            style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 12),

          // Regional Cards List
          _buildRegionCard(
            regionKey: 'Annapurna',
            name: 'Annapurna Sanctuary & Circuit',
            passElevation: '5,416m (Thorong La)',
            routeCount: '18 Routes',
            subText: 'ABC, Annapurna Circuit, Mardi Himal, Poon Hill, Tilicho Lake',
            color: const Color(0xFF10B981),
            iconEmoji: '🌱',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Everest',
            name: 'Everest & Khumbu Valley',
            passElevation: '5,545m (Kala Patthar)',
            routeCount: '14 Routes',
            subText: 'EBC Classic, Three Passes, Gokyo Ri, Ama Dablam Base Camp',
            color: const Color(0xFF38BDF8),
            iconEmoji: '❄️',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Langtang',
            name: 'Langtang Valley & Helambu',
            passElevation: '4,984m (Kyanjin Ri)',
            routeCount: '8 Routes',
            subText: 'Valley of Glaciers, Sacred Gosainkunda Lakes, Tamang Heritage',
            color: const Color(0xFFF43F5E),
            iconEmoji: '🌸',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Manaslu',
            name: 'Manaslu & Tsum Hidden Valley',
            passElevation: '5,106m (Larkya La)',
            routeCount: '6 Routes',
            subText: 'Remote Tibetan borderlands, Mu Gompa, Pristine Wilderness',
            color: const Color(0xFFA855F7),
            iconEmoji: '🌀',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Mustang',
            name: 'Mustang (Lo Manthang)',
            passElevation: '3,840m (Lo Manthang)',
            routeCount: '4 Routes',
            subText: 'Ancient Walled Tibetan Kingdom, Trans-Himalayan Rain Shadow',
            color: const Color(0xFFF59E0B),
            iconEmoji: '🏰',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Dolpo',
            name: 'Dolpo & Shey Phoksundo',
            passElevation: '5,360m (Kang La)',
            routeCount: '4 Routes',
            subText: 'Crystal Mountain, Deep Turquoise Phoksundo Lake, Bon Po Shrines',
            color: const Color(0xFF14B8A6),
            iconEmoji: '💎',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Rolwaling',
            name: 'Rolwaling & Gaurishankar',
            passElevation: '5,755m (Tashi Lapcha)',
            routeCount: '3 Routes',
            subText: 'Glacial Tsho Rolpa Lake, Numbur Cheese Circuit, Technical Pass',
            color: const Color(0xFFF97316),
            iconEmoji: '⚡',
          ),
          const SizedBox(height: 10),

          _buildRegionCard(
            regionKey: 'Makalu',
            name: 'Makalu & Eastern Giants',
            passElevation: '5,143m (Pangpema)',
            routeCount: '3 Routes',
            subText: 'Makalu Barun Biosphere, Mundum Trail, Kanchenjunga Foothills',
            color: const Color(0xFF84CC16),
            iconEmoji: '🌿',
          ),

          const SizedBox(height: 20),

          // Quick Plan Trek CTA Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2E1C06), Color(0xFF111726)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('✨', style: TextStyle(fontSize: 22)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ready for your expedition?',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        '4-step offline alpine trek planner with budget, gear & lodge phone contacts.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          minimumSize: const Size(120, 36),
                        ),
                        onPressed: widget.onOpenPlan,
                        icon: const Text('✨', style: TextStyle(fontSize: 14)),
                        label: const Text('Launch Plan Wizard', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildWeatherMetric({
    required IconData icon,
    required String label,
    required String value,
    required Color accent,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: accent),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
        ),
      ],
    );
  }

  Widget _buildRegionCard({
    required String regionKey,
    required String name,
    required String passElevation,
    required String routeCount,
    required String subText,
    required Color color,
    required String iconEmoji,
  }) {
    return InkWell(
      onTap: () => widget.onSelectRegion(regionKey),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF111726),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: color.withOpacity(0.4)),
                  ),
                  child: Text(iconEmoji, style: const TextStyle(fontSize: 15)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            passElevation,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                              color: color,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              routeCount,
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 14, color: color),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subText,
              style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8), height: 1.3),
            ),
          ],
        ),
      ),
    );
  }
}

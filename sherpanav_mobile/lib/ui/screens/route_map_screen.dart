import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../data/models/route_model.dart';
import '../../data/repositories/offline_repository.dart';
import '../widgets/altimeter_hud.dart';
import '../widgets/elevation_profile_chart.dart';

class RouteMapScreen extends StatefulWidget {
  final String? initialRouteId;
  const RouteMapScreen({super.key, this.initialRouteId});

  @override
  State<RouteMapScreen> createState() => _RouteMapScreenState();
}

class _RouteMapScreenState extends State<RouteMapScreen> {
  late String selectedRouteId;
  final MapController mapController = MapController();

  @override
  void initState() {
    super.initState();
    selectedRouteId = widget.initialRouteId ?? (OfflineRepository.instance.routes.firstOrNull?.id ?? 'ABC_R001');
  }

  @override
  Widget build(BuildContext context) {
    final route = OfflineRepository.instance.getRouteById(selectedRouteId);
    final coordinates = OfflineRepository.instance.getCoordinatesForRoute(selectedRouteId);
    final stages = OfflineRepository.instance.getItineraryForRoute(selectedRouteId);

    final LatLng center = coordinates.isNotEmpty ? coordinates[coordinates.length ~/ 2] : const LatLng(28.5300, 83.8780);

    return Scaffold(
      body: Stack(
        children: [
          // FlutterMap Canvas
          FlutterMap(
            mapController: mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: 11.5,
              maxZoom: 16.0,
              minZoom: 8.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.sherpanav.alpine',
              ),
              if (coordinates.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: coordinates,
                      strokeWidth: 4.0,
                      color: const Color(0xFFF59E0B),
                    ),
                  ],
                ),
            ],
          ),

          // Floating Altimeter HUD Top Left
          const Positioned(
            top: 50,
            left: 16,
            child: AltimeterHUD(),
          ),

          // Route Selector Pill Top Right
          Positioned(
            top: 50,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xEE080B11),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: selectedRouteId,
                  dropdownColor: const Color(0xFF111726),
                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFFF59E0B)),
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  items: OfflineRepository.instance.routes.take(10).map((r) {
                    return DropdownMenuItem<String>(
                      value: r.id,
                      child: Text(r.title, overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        selectedRouteId = val;
                      });
                      final newCoords = OfflineRepository.instance.getCoordinatesForRoute(val);
                      if (newCoords.isNotEmpty) {
                        mapController.move(newCoords[newCoords.length ~/ 2], 11.5);
                      }
                    }
                  },
                ),
              ),
            ),
          ),

          // Bottom Slide-Up Elevation Profile Deck
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (stages.isNotEmpty)
                  ElevationProfileChart(stages: stages),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xEE111726),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(route?.title ?? 'Trek Route', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('${route?.totalDays ?? 10} Days • Max ${route?.maxAltitudeM ?? 4130}m', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('${stages.length} Stages', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

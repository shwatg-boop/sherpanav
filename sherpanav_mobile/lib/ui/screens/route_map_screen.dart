import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../data/models/route_model.dart';
import '../../data/repositories/offline_repository.dart';
import '../widgets/altimeter_hud.dart';
import '../widgets/elevation_profile_chart.dart';
import 'plan_wizard_screen.dart';

enum MapDisplayMode { allTrails, focusRoute }

class RouteMapScreen extends StatefulWidget {
  final String? initialRouteId;
  const RouteMapScreen({super.key, this.initialRouteId});

  @override
  State<RouteMapScreen> createState() => _RouteMapScreenState();
}

class _RouteMapScreenState extends State<RouteMapScreen> {
  late String selectedRouteId;
  MapDisplayMode displayMode = MapDisplayMode.focusRoute;
  bool isTopoLayer = true;
  final MapController mapController = MapController();

  @override
  void initState() {
    super.initState();
    selectedRouteId = widget.initialRouteId ?? (OfflineRepository.instance.routes.firstOrNull?.id ?? 'ABC_R001');
    if (widget.initialRouteId == null) {
      displayMode = MapDisplayMode.allTrails;
    }
  }

  void _fitRouteBounds(List<LatLng> coords) {
    if (coords.isEmpty) return;
    try {
      final bounds = LatLngBounds.fromPoints(coords);
      mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.only(top: 110, bottom: 230, left: 30, right: 30),
          maxZoom: 14.5,
          minZoom: 8.5,
        ),
      );
    } catch (_) {}
  }

  void _fitAllNepal() {
    try {
      mapController.move(const LatLng(28.25, 84.50), 7.2);
    } catch (_) {}
  }

  void _selectRoute(String routeId) {
    setState(() {
      selectedRouteId = routeId;
      displayMode = MapDisplayMode.focusRoute;
    });
    final coords = OfflineRepository.instance.getCoordinatesForRoute(routeId);
    if (coords.isNotEmpty) {
      _fitRouteBounds(coords);
    }
  }

  void _showRoutePickerSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0B0F17),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.4,
          maxChildSize: 0.92,
          expand: false,
          builder: (context, scrollController) {
            final allRoutes = OfflineRepository.instance.routes;
            return Column(
              children: [
                const SizedBox(height: 12),
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('SELECT HIMALAYAN ROUTE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFFF59E0B), letterSpacing: 0.5)),
                      Text('${allRoutes.length} Available', style: const TextStyle(fontSize: 11, color: Colors.white54)),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFF1E293B)),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: allRoutes.length,
                    itemBuilder: (context, idx) {
                      final r = allRoutes[idx];
                      final trek = OfflineRepository.instance.getTrekById(r.trekId);
                      final isSelected = r.id == selectedRouteId;
                      final regionColor = OfflineRepository.instance.getRegionColor(trek?.region);

                      return ListTile(
                        selected: isSelected,
                        selectedTileColor: regionColor.withOpacity(0.12),
                        leading: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: regionColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: regionColor.withOpacity(0.4)),
                          ),
                          child: Center(
                            child: Text(
                              '${idx + 1}',
                              style: TextStyle(fontWeight: FontWeight.bold, color: regionColor, fontSize: 12),
                            ),
                          ),
                        ),
                        title: Text(r.title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: isSelected ? const Color(0xFFF59E0B) : Colors.white)),
                        subtitle: Text(
                          '${trek?.title ?? "Himalaya"} • ${r.totalDays} Days • Max ${r.maxAltitudeM}m',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFF59E0B), size: 18) : const Icon(Icons.chevron_right, color: Colors.white30, size: 16),
                        onTap: () {
                          Navigator.pop(ctx);
                          _selectRoute(r.id);
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final route = OfflineRepository.instance.getRouteById(selectedRouteId);
    final trek = route != null ? OfflineRepository.instance.getTrekById(route.trekId) : null;
    final coordinates = OfflineRepository.instance.getCoordinatesForRoute(selectedRouteId);
    final stages = OfflineRepository.instance.getItineraryForRoute(selectedRouteId);
    final waypoints = OfflineRepository.instance.getWaypointsForRoute(selectedRouteId);
    final overviewTracks = OfflineRepository.instance.getAllOverviewTracks();
    final regionColor = OfflineRepository.instance.getRegionColor(trek?.region);

    final LatLng initialCenter = coordinates.isNotEmpty
        ? coordinates[coordinates.length ~/ 2]
        : const LatLng(28.25, 84.50);

    // Build Polylines
    final List<Polyline> polylines = [];
    final List<Marker> markers = [];

    if (displayMode == MapDisplayMode.allTrails) {
      // 1. Render all 14+ Himalayan regional trails simultaneously
      for (final ot in overviewTracks) {
        final isCur = ot.routeId == selectedRouteId;
        // Dark high-contrast casing
        polylines.add(
          Polyline(
            points: ot.coordinates,
            strokeWidth: isCur ? 7.0 : 4.5,
            color: const Color(0xFF080B11),
          ),
        );
        // Vibrant regional trail line
        polylines.add(
          Polyline(
            points: ot.coordinates,
            strokeWidth: isCur ? 4.5 : 2.5,
            color: isCur ? const Color(0xFFF59E0B) : ot.color,
          ),
        );

        // Trailhead pin for each overview trail
        if (ot.coordinates.isNotEmpty) {
          final firstPt = ot.coordinates.first;
          markers.add(
            Marker(
              point: firstPt,
              width: 100,
              height: 34,
              child: GestureDetector(
                onTap: () => _selectRoute(ot.routeId),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xEE0B0F17),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ot.color, width: 1.5),
                    boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 4)],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 6, height: 6, decoration: BoxDecoration(color: ot.color, shape: BoxShape.circle)),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          ot.trekTitle,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }
      }
    } else {
      // 2. Focused Single Route Mode
      if (coordinates.isNotEmpty) {
        // Dark outer casing for topographic relief contrast
        polylines.add(
          Polyline(
            points: coordinates,
            strokeWidth: 7.0,
            color: const Color(0xFF080B11),
          ),
        );
        // Glowing active route line
        polylines.add(
          Polyline(
            points: coordinates,
            strokeWidth: 4.0,
            color: const Color(0xFFF59E0B),
          ),
        );

        // Start Marker (Trailhead)
        markers.add(
          Marker(
            point: coordinates.first,
            width: 90,
            height: 38,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 4)],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.play_circle_fill, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('START', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
            ),
          ),
        );

        // Peak / High Pass Destination Marker
        markers.add(
          Marker(
            point: coordinates.last,
            width: 120,
            height: 38,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 4)],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🏔️', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 4),
                  Text('${route?.maxAltitudeM ?? 4130}m PEAK', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                ],
              ),
            ),
          ),
        );

        // Intermediate Waypoint Stage Pins
        for (int i = 0; i < waypoints.length; i++) {
          final wp = waypoints[i];
          final lat = (wp['lat'] as num?)?.toDouble();
          final lon = (wp['lon'] as num?)?.toDouble();
          final name = wp['name']?.toString() ?? 'Point';
          final alt = wp['elevation_m'] ?? wp['elevation'] ?? 2000;

          if (lat != null && lon != null && i > 0 && i < waypoints.length - 1) {
            markers.add(
              Marker(
                point: LatLng(lat, lon),
                width: 75,
                height: 28,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xEE111726),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.6), width: 1),
                  ),
                  child: Center(
                    child: Text(
                      '$name\n${alt}m',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 7.5, color: Colors.white, fontWeight: FontWeight.w600, height: 1.1),
                    ),
                  ),
                ),
              ),
            );
          }
        }
      }
    }

    final tileUrl = isTopoLayer
        ? 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    return Scaffold(
      backgroundColor: const Color(0xFF080B11),
      body: Stack(
        children: [
          // 1. FlutterMap Core Canvas
          FlutterMap(
            mapController: mapController,
            options: MapOptions(
              initialCenter: initialCenter,
              initialZoom: displayMode == MapDisplayMode.allTrails ? 7.3 : 11.5,
              maxZoom: 17.0,
              minZoom: 6.0,
              onMapReady: () {
                if (displayMode == MapDisplayMode.focusRoute && coordinates.isNotEmpty) {
                  _fitRouteBounds(coordinates);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: tileUrl,
                userAgentPackageName: 'com.sherpanav.alpine',
                maxZoom: 17,
              ),
              if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),
              if (markers.isNotEmpty) MarkerLayer(markers: markers),
            ],
          ),

          // 2. Floating Altimeter HUD Top Left
          const Positioned(
            top: 50,
            left: 16,
            child: AltimeterHUD(),
          ),

          // 3. Top Mode Toggle & Layer Controls
          Positioned(
            top: 50,
            right: 16,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Topo / Street Toggle
                GestureDetector(
                  onTap: () {
                    setState(() {
                      isTopoLayer = !isTopoLayer;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xEE0B0F17),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: Text(
                      isTopoLayer ? '⛰️ Topo' : '🗺️ Street',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Recenter / Fit Bounds
                GestureDetector(
                  onTap: () {
                    if (displayMode == MapDisplayMode.allTrails) {
                      _fitAllNepal();
                    } else {
                      _fitRouteBounds(coordinates);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: const Color(0xEE0B0F17),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF1E293B)),
                    ),
                    child: const Icon(Icons.my_location, color: Color(0xFFF59E0B), size: 16),
                  ),
                ),
              ],
            ),
          ),

          // 4. Center Top Mode Switcher (All Trails vs Focus Route)
          Positioned(
            top: 104,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xEE080B11),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          displayMode = MapDisplayMode.allTrails;
                        });
                        _fitAllNepal();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: displayMode == MapDisplayMode.allTrails ? const Color(0xFF1E293B) : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Text(
                            '🇳🇵 All Trails (${overviewTracks.length})',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: displayMode == MapDisplayMode.allTrails ? const Color(0xFFF59E0B) : Colors.white60,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          displayMode = MapDisplayMode.focusRoute;
                        });
                        _fitRouteBounds(coordinates);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: displayMode == MapDisplayMode.focusRoute ? const Color(0xFF1E293B) : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Text(
                            '📍 Route Focus',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: displayMode == MapDisplayMode.focusRoute ? const Color(0xFFF59E0B) : Colors.white60,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 5. Bottom Deck: Either All-Trails Carousel OR Route Focus Info Deck
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: displayMode == MapDisplayMode.allTrails
                ? _buildAllTrailsCarousel(overviewTracks)
                : _buildFocusRouteDeck(route, trek, stages, regionColor),
          ),
        ],
      ),
    );
  }

  Widget _buildAllTrailsCarousel(List<OverviewTrailTrack> tracks) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 105,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: tracks.length,
            itemBuilder: (context, idx) {
              final t = tracks[idx];
              final isSel = t.routeId == selectedRouteId;
              return GestureDetector(
                onTap: () => _selectRoute(t.routeId),
                child: Container(
                  width: 220,
                  margin: const EdgeInsets.only(right: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xEE111726),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isSel ? const Color(0xFFF59E0B) : const Color(0xFF1E293B), width: isSel ? 2 : 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: t.color.withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                            child: Text(t.region, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: t.color)),
                          ),
                          Text('${t.totalDays} Days', style: const TextStyle(fontSize: 10, color: Colors.white70)),
                        ],
                      ),
                      Text(t.trekTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Peak: ${t.maxAltitudeM}m', style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                          const Row(
                            children: [
                              Text('View Trail', style: TextStyle(fontSize: 10, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                              Icon(Icons.chevron_right, size: 12, color: Color(0xFFF59E0B)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFocusRouteDeck(RouteModel? route, Trek? trek, List<RouteStage> stages, Color regionColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (stages.isNotEmpty) ElevationProfileChart(stages: stages),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xEE111726),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: regionColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(trek?.region ?? 'Himalaya', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: regionColor)),
                            ),
                            const SizedBox(width: 8),
                            Text('${route?.totalDays ?? 10} Days', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                            const SizedBox(width: 8),
                            Text('Max ${route?.maxAltitudeM ?? 4130}m', style: const TextStyle(fontSize: 11, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          route?.title ?? 'Trek Route',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.swap_horiz, color: Color(0xFFF59E0B), size: 22),
                    tooltip: 'Change Route',
                    onPressed: _showRoutePickerSheet,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF1E293B)),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      icon: const Icon(Icons.list, size: 14, color: Colors.white70),
                      label: const Text('All 56 Routes', style: TextStyle(fontSize: 11, color: Colors.white70)),
                      onPressed: _showRoutePickerSheet,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF59E0B),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      icon: const Text('✨', style: TextStyle(fontSize: 12)),
                      label: const Text('Plan Trek', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => PlanWizardScreen(preselectedTrekId: trek?.id),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

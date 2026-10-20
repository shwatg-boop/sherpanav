import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:latlong2/latlong.dart';
import '../models/trek.dart';
import '../models/route_model.dart';
import '../models/accommodation.dart';

class OverviewTrailTrack {
  final String routeId;
  final String routeTitle;
  final String trekId;
  final String trekTitle;
  final String region;
  final Color color;
  final List<LatLng> coordinates;
  final int maxAltitudeM;
  final int totalDays;
  final List<Map<String, dynamic>> waypoints;

  OverviewTrailTrack({
    required this.routeId,
    required this.routeTitle,
    required this.trekId,
    required this.trekTitle,
    required this.region,
    required this.color,
    required this.coordinates,
    required this.maxAltitudeM,
    required this.totalDays,
    required this.waypoints,
  });
}

class OfflineRepository {
  static final OfflineRepository instance = OfflineRepository._internal();
  OfflineRepository._internal();

  bool _isLoaded = false;
  bool get isLoaded => _isLoaded;

  List<Trek> treks = [];
  List<RouteModel> routes = [];
  Map<String, List<RouteStage>> itineraries = {};
  List<Accommodation> accommodations = [];
  List<dynamic> permits = [];
  List<dynamic> weatherStations = [];
  Map<String, dynamic> trailTracks = {};

  Future<void> initialize() async {
    if (_isLoaded) return;

    // 1. Load Treks
    try {
      final treksStr = await rootBundle.loadString('assets/data/treks.json');
      final List<dynamic> treksJson = json.decode(treksStr);
      treks = treksJson.map((j) => Trek.fromJson(j)).toList();
    } catch (e) {
      debugPrint('Error loading treks: $e');
    }

    // 2. Load Routes
    try {
      final routesStr = await rootBundle.loadString('assets/data/routes.json');
      final List<dynamic> routesJson = json.decode(routesStr);
      routes = routesJson.map((j) => RouteModel.fromJson(j)).toList();
    } catch (e) {
      debugPrint('Error loading routes: $e');
    }

    // 3. Load Trail Tracks (All 56 Himalayan routes)
    try {
      final tracksStr = await rootBundle.loadString('assets/data/trail_tracks.json');
      final dynamic decodedTracks = json.decode(tracksStr);
      if (decodedTracks is Map<String, dynamic>) {
        trailTracks = decodedTracks;
      } else if (decodedTracks is Map) {
        trailTracks = Map<String, dynamic>.from(decodedTracks);
      }
    } catch (e) {
      debugPrint('Error loading trail tracks: $e');
    }

    // 4. Load Itineraries
    try {
      final itinStr = await rootBundle.loadString('assets/data/itineraries.json');
      final Map<String, dynamic> itinJson = json.decode(itinStr);
      itinJson.forEach((k, v) {
        if (v is List) {
          itineraries[k] = v.map((s) => RouteStage.fromJson(s)).toList();
        }
      });
    } catch (e) {
      debugPrint('Error loading itineraries: $e');
    }

    // 5. Load Accommodations
    try {
      final accStr = await rootBundle.loadString('assets/data/accommodations.json');
      final List<dynamic> accJson = json.decode(accStr);
      accommodations = accJson.map((j) => Accommodation.fromJson(j)).toList();
    } catch (e) {
      debugPrint('Error loading accommodations: $e');
    }

    // 6. Load Permits
    try {
      final permitsStr = await rootBundle.loadString('assets/data/permits.json');
      final dynamic permDecoded = json.decode(permitsStr);
      if (permDecoded is List) {
        permits = permDecoded;
      } else if (permDecoded is Map<String, dynamic>) {
        permits = permDecoded.values.toList();
      }
    } catch (e) {
      debugPrint('Error loading permits: $e');
    }

    // 7. Load Weather Stations
    try {
      final wsStr = await rootBundle.loadString('assets/data/weather_stations.json');
      final dynamic wsDecoded = json.decode(wsStr);
      if (wsDecoded is List) {
        weatherStations = wsDecoded;
      } else if (wsDecoded is Map<String, dynamic>) {
        weatherStations = wsDecoded.values.toList();
      }
    } catch (e) {
      debugPrint('Error loading weather stations: $e');
    }

    _isLoaded = true;
  }

  Trek? getTrekById(String id) {
    return treks.where((t) => t.id == id).firstOrNull ?? treks.firstOrNull;
  }

  List<RouteModel> getRoutesByTrekId(String trekId) {
    return routes.where((r) => r.trekId == trekId).toList();
  }

  RouteModel? getRouteById(String id) {
    return routes.where((r) => r.id == id).firstOrNull ?? routes.firstOrNull;
  }

  List<RouteStage> getItineraryForRoute(String routeId) {
    return itineraries[routeId] ?? [];
  }

  Map<String, dynamic>? getTrackDataForRoute(String routeId) {
    // 1. Exact match
    if (trailTracks.containsKey(routeId)) {
      return trailTracks[routeId];
    }

    // 2. Prefix fallback matching (e.g. ABC_R002 -> ABC_R001, AC_R003 -> AC_R002)
    final prefix = routeId.split('_').first.split('-').first;
    final fallbackKey = trailTracks.keys.where((k) => k.startsWith(prefix)).firstOrNull;
    if (fallbackKey != null) {
      return trailTracks[fallbackKey];
    }

    // 3. Fallback to another route in the same trek
    final route = getRouteById(routeId);
    if (route != null) {
      final trekRoutes = getRoutesByTrekId(route.trekId);
      for (final tr in trekRoutes) {
        if (trailTracks.containsKey(tr.id)) {
          return trailTracks[tr.id];
        }
      }
    }

    // 4. Default baseline track
    return trailTracks['ABC_R001'];
  }

  List<LatLng> getCoordinatesForRoute(String routeId) {
    final track = getTrackDataForRoute(routeId);
    if (track != null && track['coordinates'] is List) {
      final List<dynamic> raw = track['coordinates'];
      return raw.map((c) => LatLng((c[0] as num).toDouble(), (c[1] as num).toDouble())).toList();
    }
    return [];
  }

  List<Map<String, dynamic>> getWaypointsForRoute(String routeId) {
    final track = getTrackDataForRoute(routeId);
    if (track != null && track['waypoints'] is List) {
      final List<dynamic> raw = track['waypoints'];
      return raw.map((w) => Map<String, dynamic>.from(w as Map)).toList();
    }
    return [];
  }

  Color getRegionColor(String? region) {
    final r = (region ?? '').toLowerCase();
    if (r.contains('annapurna')) return const Color(0xFF10B981); // Emerald
    if (r.contains('everest') || r.contains('khumbu')) return const Color(0xFF38BDF8); // Sky Blue
    if (r.contains('langtang') || r.contains('helambu')) return const Color(0xFFF43F5E); // Rose
    if (r.contains('manaslu')) return const Color(0xFFA855F7); // Purple
    if (r.contains('rolwaling') || r.contains('gaurishankar')) return const Color(0xFFF59E0B); // Amber
    if (r.contains('dolp') || r.contains('phoksundo')) return const Color(0xFF14B8A6); // Teal
    if (r.contains('makalu')) return const Color(0xFF84CC16); // Lime
    if (r.contains('far-west') || r.contains('badimalika') || r.contains('api')) return const Color(0xFF06B6D4); // Cyan
    return const Color(0xFFEAB308); // Gold
  }

  List<OverviewTrailTrack> getAllOverviewTracks() {
    final List<OverviewTrailTrack> list = [];
    final Set<String> renderedTrekIds = {};

    for (final trek in treks) {
      final trekRoutes = getRoutesByTrekId(trek.id);
      if (trekRoutes.isEmpty) continue;
      final primaryRoute = trekRoutes.where((r) => r.variantTag.toLowerCase().contains('classic')).firstOrNull ?? trekRoutes.first;
      final coords = getCoordinatesForRoute(primaryRoute.id);
      if (coords.length > 1) {
        if (!renderedTrekIds.contains(trek.id)) {
          renderedTrekIds.add(trek.id);
          list.add(OverviewTrailTrack(
            routeId: primaryRoute.id,
            routeTitle: primaryRoute.title,
            trekId: trek.id,
            trekTitle: trek.title,
            region: trek.region,
            color: getRegionColor(trek.region),
            coordinates: coords,
            maxAltitudeM: primaryRoute.maxAltitudeM,
            totalDays: primaryRoute.totalDays,
            waypoints: getWaypointsForRoute(primaryRoute.id),
          ));
        }
      }
    }
    return list;
  }

  List<Accommodation> getAccommodations() => accommodations;
}

import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:latlong2/latlong.dart';
import '../models/trek.dart';
import '../models/route_model.dart';
import '../models/accommodation.dart';

class OfflineRepository {
  static final OfflineRepository instance = OfflineRepository._internal();
  OfflineRepository._internal();

  bool _isLoaded = false;
  bool get isLoaded => _isLoaded;

  List<Trek> treks = [];
  List<RouteModel> routes = [];
  Map<String, List<RouteStage>> itineraries = {};
  List<Accommodation> accommodations = [];
  Map<String, dynamic> permits = {};
  Map<String, dynamic> weatherStations = {};
  Map<String, dynamic> trailTracks = {};

  Future<void> initialize() async {
    if (_isLoaded) return;

    try {
      // 1. Load Treks
      final treksStr = await rootBundle.loadString('assets/data/treks.json');
      final List<dynamic> treksJson = json.decode(treksStr);
      treks = treksJson.map((j) => Trek.fromJson(j)).toList();

      // 2. Load Routes
      final routesStr = await rootBundle.loadString('assets/data/routes.json');
      final List<dynamic> routesJson = json.decode(routesStr);
      routes = routesJson.map((j) => RouteModel.fromJson(j)).toList();

      // 3. Load Itineraries
      final itinStr = await rootBundle.loadString('assets/data/itineraries.json');
      final Map<String, dynamic> itinJson = json.decode(itinStr);
      itinJson.forEach((k, v) {
        if (v is List) {
          itineraries[k] = v.map((s) => RouteStage.fromJson(s)).toList();
        }
      });

      // 4. Load Accommodations
      final accStr = await rootBundle.loadString('assets/data/accommodations.json');
      final List<dynamic> accJson = json.decode(accStr);
      accommodations = accJson.map((j) => Accommodation.fromJson(j)).toList();

      // 5. Load Permits
      final permitsStr = await rootBundle.loadString('assets/data/permits.json');
      permits = json.decode(permitsStr);

      // 6. Load Weather Stations
      final wsStr = await rootBundle.loadString('assets/data/weather_stations.json');
      weatherStations = json.decode(wsStr);

      // 7. Load Trail Tracks
      final tracksStr = await rootBundle.loadString('assets/data/trail_tracks.json');
      trailTracks = json.decode(tracksStr);

      _isLoaded = true;
    } catch (e) {
      // Fallback safeguard
      _isLoaded = true;
    }
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

  List<LatLng> getCoordinatesForRoute(String routeId) {
    final track = trailTracks[routeId];
    if (track != null && track['coordinates'] is List) {
      final List<dynamic> raw = track['coordinates'];
      return raw.map((c) => LatLng((c[0] as num).toDouble(), (c[1] as num).toDouble())).toList();
    }
    return [];
  }

  List<Accommodation> getAccommodations() => accommodations;
}

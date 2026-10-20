class RouteModel {
  final String id;
  final String trekId;
  final String title;
  final String variantTag;
  final int maxAltitudeM;
  final double distanceKm;
  final int totalDays;
  final int totalNights;
  final String difficulty;
  final String routeChainDisplay;

  RouteModel({
    required this.id,
    required this.trekId,
    required this.title,
    required this.variantTag,
    required this.maxAltitudeM,
    required this.distanceKm,
    required this.totalDays,
    required this.totalNights,
    required this.difficulty,
    required this.routeChainDisplay,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    return RouteModel(
      id: json['id'] ?? '',
      trekId: json['trek_id'] ?? '',
      title: json['title'] ?? json['name'] ?? 'Route Variant',
      variantTag: json['variant_tag'] ?? 'Classic',
      maxAltitudeM: (json['max_altitude_m'] ?? json['max_elevation_m'] ?? 4000).toInt(),
      distanceKm: (json['distance_km'] ?? json['total_distance_km'] ?? 75.0).toDouble(),
      totalDays: (json['total_days'] ?? 10).toInt(),
      totalNights: (json['total_nights'] ?? 9).toInt(),
      difficulty: json['difficulty'] ?? 'Moderate',
      routeChainDisplay: json['route_chain_display'] ?? '',
    );
  }
}

class RouteStage {
  final int day;
  final String destination;
  final int altitudeM;
  final double distanceKm;
  final String walkingDuration;
  final String description;

  RouteStage({
    required this.day,
    required this.destination,
    required this.altitudeM,
    required this.distanceKm,
    required this.walkingDuration,
    required this.description,
  });

  factory RouteStage.fromJson(Map<String, dynamic> json) {
    return RouteStage(
      day: (json['day'] ?? 1).toInt(),
      destination: json['destination'] ?? json['stage_title'] ?? 'Camp',
      altitudeM: (json['altitude_m'] ?? json['elevation_m'] ?? 2500).toInt(),
      distanceKm: (json['distance_km'] ?? 10.0).toDouble(),
      walkingDuration: json['walking_duration'] ?? '5-6 hrs',
      description: json['description'] ?? '',
    );
  }
}

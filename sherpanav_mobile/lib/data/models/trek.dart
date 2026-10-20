class Trek {
  final String id;
  final String title;
  final String region;
  final String district;
  final int maxAltitudeM;
  final String durationRange;
  final String difficulty;
  final double distanceKm;
  final String overview;
  final String bestMonths;
  final String heroImageUrl;

  Trek({
    required this.id,
    required this.title,
    required this.region,
    required this.district,
    required this.maxAltitudeM,
    required this.durationRange,
    required this.difficulty,
    required this.distanceKm,
    required this.overview,
    required this.bestMonths,
    required this.heroImageUrl,
  });

  factory Trek.fromJson(Map<String, dynamic> json) {
    return Trek(
      id: json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? 'Himalayan Trek',
      region: json['region'] ?? json['region_id'] ?? 'Himalaya',
      district: json['district'] ?? 'Nepal',
      maxAltitudeM: (json['max_altitude_m'] ?? json['max_elevation_m'] ?? 4000).toInt(),
      durationRange: json['duration_range'] ?? json['duration_range_days'] ?? '10-14 Days',
      difficulty: json['difficulty'] ?? 'Moderate',
      distanceKm: (json['distance_km'] ?? 80.0).toDouble(),
      overview: json['overview'] ?? json['description'] ?? '',
      bestMonths: json['best_months'] ?? 'Mar-May, Oct-Dec',
      heroImageUrl: json['hero_image_url'] ?? '',
    );
  }
}

class Accommodation {
  final String id;
  final String name;
  final String settlementName;
  final int elevationM;
  final int capacity;
  final int baseRoomPriceNpr;
  final String primaryPhone;
  final List<String> amenities;

  Accommodation({
    required this.id,
    required this.name,
    required this.settlementName,
    required this.elevationM,
    required this.capacity,
    required this.baseRoomPriceNpr,
    required this.primaryPhone,
    required this.amenities,
  });

  factory Accommodation.fromJson(Map<String, dynamic> json) {
    String phone = '+977 9841000000';
    if (json['phones'] is List && (json['phones'] as List).isNotEmpty) {
      phone = json['phones'][0].toString();
    } else if (json['phone_contact'] != null) {
      phone = json['phone_contact'].toString();
    }

    List<String> amen = [];
    if (json['amenities'] is List) {
      amen = (json['amenities'] as List).map((e) => e.toString()).toList();
    }

    return Accommodation(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Himalayan Teahouse',
      settlementName: json['settlement_name'] ?? 'Alpine Stop',
      elevationM: (json['elevation_m'] ?? 2800).toInt(),
      capacity: (json['capacity'] ?? 20).toInt(),
      baseRoomPriceNpr: (json['base_room_price_npr'] ?? 800).toInt(),
      primaryPhone: phone,
      amenities: amen,
    );
  }
}

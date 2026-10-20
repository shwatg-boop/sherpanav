class AMSEntry {
  final DateTime timestamp;
  final int headache; // 0-3
  final int gastro;   // 0-3
  final int fatigue;  // 0-3
  final int dizziness;// 0-3
  final int altitudeM;
  final int spO2;     // %

  AMSEntry({
    required this.timestamp,
    required this.headache,
    required this.gastro,
    required this.fatigue,
    required this.dizziness,
    required this.altitudeM,
    required this.spO2,
  });

  int get totalScore => headache + gastro + fatigue + dizziness;

  String get clinicalAssessment {
    if (headache == 0) {
      return totalScore > 0 ? 'Mild Symptoms (Non-AMS)' : 'No AMS Symptoms';
    }
    if (totalScore <= 2) return 'Normal / Negligible';
    if (totalScore <= 5) return 'Mild AMS - Halt Ascent & Rest';
    return 'Severe AMS - Immediate Descent Required!';
  }

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'headache': headache,
    'gastro': gastro,
    'fatigue': fatigue,
    'dizziness': dizziness,
    'altitudeM': altitudeM,
    'spO2': spO2,
  };

  factory AMSEntry.fromJson(Map<String, dynamic> json) => AMSEntry(
    timestamp: DateTime.parse(json['timestamp']),
    headache: json['headache'] ?? 0,
    gastro: json['gastro'] ?? 0,
    fatigue: json['fatigue'] ?? 0,
    dizziness: json['dizziness'] ?? 0,
    altitudeM: json['altitudeM'] ?? 3000,
    spO2: json['spO2'] ?? 92,
  );
}

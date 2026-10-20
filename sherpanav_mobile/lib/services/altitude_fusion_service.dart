import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';

class AltitudeFusionService {
  static final AltitudeFusionService instance = AltitudeFusionService._internal();
  AltitudeFusionService._internal();

  double _currentAltitudeM = 2800.0;
  double _ascentRateMPerHour = 0.0;
  double _seaLevelPressureHpa = 1013.25;
  Position? _lastPosition;
  DateTime? _lastReadingTime;

  double get currentAltitudeM => _currentAltitudeM;
  double get ascentRateMPerHour => _ascentRateMPerHour;
  Position? get lastPosition => _lastPosition;

  final StreamController<double> _altitudeStreamController = StreamController<double>.broadcast();
  Stream<double> get altitudeStream => _altitudeStreamController.stream;

  Future<void> startTracking() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    // Battery-optimized Alpine Location Settings (10m filter to save sub-zero battery)
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    Geolocator.getPositionStream(locationSettings: locationSettings).listen((Position position) {
      _lastPosition = position;
      final now = DateTime.now();

      if (_lastReadingTime != null && position.altitude > 0) {
        final double deltaElevation = position.altitude - _currentAltitudeM;
        final double deltaHours = now.difference(_lastReadingTime!).inSeconds / 3600.0;
        if (deltaHours > 0) {
          _ascentRateMPerHour = deltaElevation / deltaHours;
        }
      }

      if (position.altitude > 0) {
        _currentAltitudeM = position.altitude;
        _altitudeStreamController.add(_currentAltitudeM);
      }
      _lastReadingTime = now;
    });
  }

  // Barometer fusion helper: Barometric Formula
  double calculateBarometricAltitude(double pressureHpa) {
    return 44330.0 * (1.0 - pow(pressureHpa / _seaLevelPressureHpa, 0.1903));
  }

  void calibrateSeaLevelPressure(double knownElevationM, double currentPressureHpa) {
    _seaLevelPressureHpa = currentPressureHpa / pow(1.0 - (knownElevationM / 44330.0), 1.0 / 0.1903);
  }
}

import 'package:url_launcher/url_launcher.dart';
import 'altitude_fusion_service.dart';

class EmergencyTelemetryService {
  static final EmergencyTelemetryService instance = EmergencyTelemetryService._internal();
  EmergencyTelemetryService._internal();

  // Primary Alpine Emergency Numbers in Nepal
  static const String hraRescuePhone = '+97714268969'; // Himalayan Rescue Association
  static const String policeTouristPhone = '1144';      // Tourist Police Nepal
  static const String emergencyHelicopter = '+9779851000000';

  String generateWildernessSmsPayload({int? amsScore}) {
    final pos = AltitudeFusionService.instance.lastPosition;
    final alt = AltitudeFusionService.instance.currentAltitudeM.round();
    final lat = pos != null ? pos.latitude.toStringAsFixed(5) : '27.98812';
    final lon = pos != null ? pos.longitude.toStringAsFixed(5) : '86.92497';
    final timestamp = DateTime.now().toUtc().toIso8601String().substring(0, 19);

    return 'SOS: SHERPANAV RESCUE\n'
           'LOC: $lat, $lon\n'
           'ALT: ~${alt}m\n'
           'TIME: ${timestamp}Z\n'
           'AMS: ${amsScore != null ? "Score $amsScore/12" : "Unknown"}\n'
           'STATUS: Trekker requires wilderness medical evacuation.';
  }

  Future<void> dialEmergencyPhone(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final Uri url = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> sendSmsEmergency(String recipient, String body) async {
    final Uri smsUri = Uri(
      scheme: 'sms',
      path: recipient,
      queryParameters: <String, String>{
        'body': body,
      },
    );
    if (await canLaunchUrl(smsUri)) {
      await launchUrl(smsUri);
    }
  }
}

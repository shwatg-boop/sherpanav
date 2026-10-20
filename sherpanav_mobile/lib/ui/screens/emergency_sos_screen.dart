import 'package:flutter/material.dart';
import '../../services/emergency_telemetry_service.dart';
import '../../services/altitude_fusion_service.dart';

class EmergencySOSScreen extends StatelessWidget {
  const EmergencySOSScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pos = AltitudeFusionService.instance.lastPosition;
    final alt = AltitudeFusionService.instance.currentAltitudeM.round();
    final lat = pos != null ? pos.latitude.toStringAsFixed(5) : '27.98812';
    final lon = pos != null ? pos.longitude.toStringAsFixed(5) : '86.92497';

    final smsPayload = EmergencyTelemetryService.instance.generateWildernessSmsPayload();

    return Scaffold(
      appBar: AppBar(
        title: const Text('EMERGENCY SOS & RESCUE', style: TextStyle(color: Color(0xFFEF4444))),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Critical Coordinates Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1117),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEF4444)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.warning, color: Color(0xFFEF4444)),
                      SizedBox(width: 8),
                      Text('WILDERNESS TELEMETRY', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('LATITUDE: $lat° N', style: const TextStyle(fontSize: 14, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                  Text('LONGITUDE: $lon° E', style: const TextStyle(fontSize: 14, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                  Text('ALTITUDE: ~${alt}m (Barometer Fused)', style: const TextStyle(fontSize: 14, fontFamily: 'monospace', color: Color(0xFFFDE68A))),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // One-Tap SMS Dispatcher
            const Text('Emergency SMS Beacon Payload:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF080B11),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: SelectableText(
                smsPayload,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Colors.white70),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  EmergencyTelemetryService.instance.sendSmsEmergency(
                    EmergencyTelemetryService.hraRescuePhone,
                    smsPayload,
                  );
                },
                icon: const Icon(Icons.sms),
                label: const Text('Dispatch SMS to Himalayan Rescue (HRA)'),
              ),
            ),

            const SizedBox(height: 24),
            const Text('Emergency Voice Lines:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),

            ListTile(
              tileColor: const Color(0xFF111726),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: const Icon(Icons.phone_in_talk, color: Color(0xFF10B981)),
              title: const Text('Himalayan Rescue Association (HRA)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: const Text('+977 1 4268969 • Medical Evacuation'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => EmergencyTelemetryService.instance.dialEmergencyPhone(EmergencyTelemetryService.hraRescuePhone),
            ),
            const SizedBox(height: 8),

            ListTile(
              tileColor: const Color(0xFF111726),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: const Icon(Icons.local_police, color: Color(0xFF10B981)),
              title: const Text('Tourist Police Nepal', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: const Text('Toll Free 1144 • Emergency Search'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () => EmergencyTelemetryService.instance.dialEmergencyPhone(EmergencyTelemetryService.policeTouristPhone),
            ),

            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF182235),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('📢 Alpine Acoustic Distress Code:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFFDE68A))),
                  SizedBox(height: 4),
                  Text(
                    '6 blasts of your whistle within 1 minute, pause for 1 minute, then repeat. Response from rescue team is 3 blasts.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

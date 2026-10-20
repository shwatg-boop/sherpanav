import 'package:flutter/material.dart';
import '../../services/altitude_fusion_service.dart';

class AltimeterHUD extends StatelessWidget {
  const AltimeterHUD({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<double>(
      stream: AltitudeFusionService.instance.altitudeStream,
      initialData: AltitudeFusionService.instance.currentAltitudeM,
      builder: (context, snapshot) {
        final altitude = (snapshot.data ?? 2800).round();
        final ascentRate = AltitudeFusionService.instance.ascentRateMPerHour.round();

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xEE0B0F17),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.6),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🏔️', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${altitude}m',
                    style: const TextStyle(
                      color: Color(0xFFF59E0B),
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Text(
                    ascentRate != 0 ? '${ascentRate > 0 ? "+" : ""}${ascentRate}m/h' : 'Stable Alt',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 10,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

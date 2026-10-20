import 'package:flutter/material.dart';
import '../../data/models/route_model.dart';

class ElevationProfileChart extends StatelessWidget {
  final List<RouteStage> stages;

  const ElevationProfileChart({super.key, required this.stages});

  @override
  Widget build(BuildContext context) {
    if (stages.isEmpty) {
      return const SizedBox(
        height: 120,
        child: Center(child: Text('No elevation stages available', style: TextStyle(color: Colors.white54))),
      );
    }

    final int maxAlt = stages.map((s) => s.altitudeM).reduce((a, b) => a > b ? a : b);
    final int minAlt = stages.map((s) => s.altitudeM).reduce((a, b) => a < b ? a : b);

    return Container(
      height: 140,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF080B11),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ELEVATION PROFILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
              Text('Peak: ${maxAlt}m', style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.white70)),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _ElevationPainter(stages: stages, minAlt: minAlt, maxAlt: maxAlt),
            ),
          ),
        ],
      ),
    );
  }
}

class _ElevationPainter extends CustomPainter {
  final List<RouteStage> stages;
  final int minAlt;
  final int maxAlt;

  _ElevationPainter({required this.stages, required this.minAlt, required this.maxAlt});

  @override
  void paint(Canvas canvas, Size size) {
    if (stages.length < 2) return;

    final range = (maxAlt - minAlt).clamp(500, 8000);
    final stepX = size.width / (stages.length - 1);

    final path = Path();
    final fillPath = Path();

    for (int i = 0; i < stages.length; i++) {
      final x = i * stepX;
      final y = size.height - ((stages[i].altitudeM - minAlt) / range * (size.height - 20) + 10);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }

      // Draw stage dots
      final dotPaint = Paint()
        ..color = stages[i].altitudeM >= 4000 ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(x, y), 3, dotPaint);
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFFF59E0B).withOpacity(0.3),
          const Color(0xFFF59E0B).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final linePaint = Paint()
      ..color = const Color(0xFFF59E0B)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

import 'package:flutter/material.dart';
import '../../data/models/ams_entry.dart';
import '../../services/ams_calculator_service.dart';
import '../../services/altitude_fusion_service.dart';

class AMSTrackerScreen extends StatefulWidget {
  const AMSTrackerScreen({super.key});

  @override
  State<AMSTrackerScreen> createState() => _AMSTrackerScreenState();
}

class _AMSTrackerScreenState extends State<AMSTrackerScreen> {
  int headache = 0;
  int gastro = 0;
  int fatigue = 0;
  int dizziness = 0;
  int spO2 = 92;
  List<AMSEntry> history = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final list = await AMSCalculatorService.instance.loadHistory();
    setState(() => history = list);
  }

  @override
  Widget build(BuildContext context) {
    final totalScore = headache + gastro + fatigue + dizziness;
    final alt = AltitudeFusionService.instance.currentAltitudeM.round();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lake Louise AMS Tracker'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Score HUD Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: totalScore > 5
                    ? const Color(0xFFEF4444).withOpacity(0.15)
                    : (totalScore > 2 ? const Color(0xFFF59E0B).withOpacity(0.15) : const Color(0xFF10B981).withOpacity(0.15)),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: totalScore > 5
                      ? const Color(0xFFEF4444)
                      : (totalScore > 2 ? const Color(0xFFF59E0B) : const Color(0xFF10B981)),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    '$totalScore/12',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                      color: totalScore > 5
                          ? const Color(0xFFEF4444)
                          : (totalScore > 2 ? const Color(0xFFF59E0B) : const Color(0xFF10B981)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          totalScore > 5
                              ? 'SEVERE AMS DETECTED'
                              : (totalScore > 2 ? 'MILD AMS SYMPTOMS' : 'NORMAL / NO AMS'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          totalScore > 5
                              ? 'Immediate descent required. Do not ascend further.'
                              : (totalScore > 2 ? 'Halt ascent. Hydrate and monitor closely.' : 'Safe acclimatization. Maintain pace.'),
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Symptoms Form
            const Text('Clinical Lake Louise Scoring Questions:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            _buildScoreSlider('Headache', headache, (v) => setState(() => headache = v)),
            _buildScoreSlider('Gastrointestinal (Nausea/Loss of appetite)', gastro, (v) => setState(() => gastro = v)),
            _buildScoreSlider('Fatigue / Weakness', fatigue, (v) => setState(() => fatigue = v)),
            _buildScoreSlider('Dizziness / Lightheadedness', dizziness, (v) => setState(() => dizziness = v)),

            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Oxygen Saturation (%SpO2)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      Slider(
                        value: spO2.toDouble(),
                        min: 60,
                        max: 100,
                        divisions: 40,
                        label: '$spO2%',
                        activeColor: const Color(0xFFF59E0B),
                        onChanged: (v) => setState(() => spO2 = v.round()),
                      ),
                    ],
                  ),
                ),
                Text('$spO2%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
              ],
            ),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final entry = AMSEntry(
                    timestamp: DateTime.now(),
                    headache: headache,
                    gastro: gastro,
                    fatigue: fatigue,
                    dizziness: dizziness,
                    altitudeM: alt,
                    spO2: spO2,
                  );
                  await AMSCalculatorService.instance.saveEntry(entry);
                  await _loadHistory();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✅ AMS Observation Logged!')),
                  );
                },
                icon: const Icon(Icons.save),
                label: const Text('Log AMS Telemetry'),
              ),
            ),

            const SizedBox(height: 24),
            const Text('Log History:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (history.isEmpty)
              const Text('No previous entries recorded.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12))
            else
              ...history.take(5).map((e) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  dense: true,
                  title: Text('Score ${e.totalScore}/12 (${e.clinicalAssessment})'),
                  subtitle: Text('Alt: ${e.altitudeM}m • SpO2: ${e.spO2}% • ${e.timestamp.toString().substring(0, 16)}'),
                ),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreSlider(String label, int val, Function(int) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.white70)),
            Text(val.toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
          ],
        ),
        Slider(
          value: val.toDouble(),
          min: 0,
          max: 3,
          divisions: 3,
          label: val == 0 ? 'None' : (val == 1 ? 'Mild' : (val == 2 ? 'Moderate' : 'Severe')),
          activeColor: const Color(0xFFF59E0B),
          onChanged: (v) => onChanged(v.round()),
        ),
      ],
    );
  }
}

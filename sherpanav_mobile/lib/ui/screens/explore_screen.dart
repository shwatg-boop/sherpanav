import 'package:flutter/material.dart';
import '../../data/models/trek.dart';
import '../../data/repositories/offline_repository.dart';
import 'plan_wizard_screen.dart';

class ExploreScreen extends StatefulWidget {
  final Function(String routeId)? onOpenRouteMap;
  const ExploreScreen({super.key, this.onOpenRouteMap});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String selectedRegion = 'ALL';
  final List<String> regions = ['ALL', 'Annapurna', 'Everest', 'Langtang', 'Manaslu', 'Mustang', 'Dolpo'];

  @override
  Widget build(BuildContext context) {
    final allTreks = OfflineRepository.instance.treks;
    final filteredTreks = allTreks.where((t) {
      if (selectedRegion == 'ALL') return true;
      final match = '${t.region} ${t.district}'.toLowerCase();
      return match.contains(selectedRegion.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Text('🧭 ', style: TextStyle(fontSize: 20)),
            Text('Himalayan Treks'),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.offline_pin, size: 14, color: Color(0xFF10B981)),
                SizedBox(width: 4),
                Text('100% Offline', style: TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
              ],
            ),
          )
        ],
      ),
      body: Column(
        children: [
          // Region Filter Carousel
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: regions.length,
              itemBuilder: (context, index) {
                final r = regions[index];
                final isSelected = r == selectedRegion;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(r, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() {
                        selectedRegion = r;
                      });
                    },
                    selectedColor: const Color(0xFFF59E0B),
                    checkmarkColor: Colors.black,
                    backgroundColor: const Color(0xFF111726),
                    side: BorderSide(color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF1E293B)),
                    labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
                  ),
                );
              },
            ),
          ),

          // Treks List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredTreks.length,
              itemBuilder: (context, index) {
                final trek = filteredTreks[index];
                final routes = OfflineRepository.instance.getRoutesByTrekId(trek.id);

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                              ),
                              child: Text(trek.district, style: const TextStyle(fontSize: 10, color: Color(0xFFFDE68A), fontWeight: FontWeight.bold)),
                            ),
                            Text('${trek.maxAltitudeM}m', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(trek.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(height: 6),
                        Text(
                          trek.overview,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), height: 1.4),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Text('📅 ${trek.durationRange}', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                            const SizedBox(width: 12),
                            Text('⚡ ${trek.difficulty}', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                            const Spacer(),
                            Text('${routes.length} Variants', style: const TextStyle(fontSize: 11, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: Color(0xFF1E293B)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => PlanWizardScreen(preselectedTrekId: trek.id),
                                  ),
                                );
                              },
                              icon: const Text('✨', style: TextStyle(fontSize: 14)),
                              label: const Text('Plan This Trek'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

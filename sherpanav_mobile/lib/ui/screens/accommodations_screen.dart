import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../data/models/accommodation.dart';
import '../../data/repositories/offline_repository.dart';

class AccommodationsScreen extends StatefulWidget {
  const AccommodationsScreen({super.key});

  @override
  State<AccommodationsScreen> createState() => _AccommodationsScreenState();
}

class _AccommodationsScreenState extends State<AccommodationsScreen> {
  String searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final allLodges = OfflineRepository.instance.getAccommodations();
    final filteredLodges = allLodges.where((l) {
      if (searchQuery.isEmpty) return true;
      final q = searchQuery.toLowerCase();
      return l.name.toLowerCase().contains(q) || l.settlementName.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verified Teahouses (405)'),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search by lodge or settlement (e.g. Namche, Chame)...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFFF59E0B)),
                filled: true,
                fillColor: const Color(0xFF111726),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFF1E293B)),
                ),
              ),
              onChanged: (val) {
                setState(() => searchQuery = val);
              },
            ),
          ),

          // Lodges List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: filteredLodges.length,
              itemBuilder: (context, index) {
                final lodge = filteredLodges[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('🏠', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(lodge.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(height: 2),
                              Text('${lodge.settlementName} • ~${lodge.elevationM}m', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Text('🛏️ ${lodge.capacity} beds', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                                  const SizedBox(width: 12),
                                  Text('NPR ${lodge.baseRoomPriceNpr}', style: const TextStyle(fontSize: 11, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.phone, color: Color(0xFF10B981)),
                          onPressed: () async {
                            final clean = lodge.primaryPhone.replaceAll(RegExp(r'[^0-9+]'), '');
                            final uri = Uri.parse('tel:$clean');
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri);
                            }
                          },
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

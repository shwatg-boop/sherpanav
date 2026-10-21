import 'package:flutter/material.dart';
import '../../data/models/trek.dart';
import '../../data/models/route_model.dart';
import '../../data/models/accommodation.dart';
import '../../data/repositories/offline_repository.dart';
import '../../services/budget_calculator_service.dart';
import '../../utils/phone_helper.dart';
import '../widgets/elevation_profile_chart.dart';

class PlanWizardScreen extends StatefulWidget {
  final String? preselectedTrekId;
  const PlanWizardScreen({super.key, this.preselectedTrekId});

  @override
  State<PlanWizardScreen> createState() => _PlanWizardScreenState();
}

class _PlanWizardScreenState extends State<PlanWizardScreen> {
  int currentStep = 1;

  late String selectedTrekId;
  String? selectedRouteId;

  // Gear packing items (essential defaults)
  final Map<String, bool> packedGear = {
    'Thermal Base Layers': true,
    'Mid-layer Fleece': true,
    'Heavy Down Jacket (-15°C)': true,
    'Gore-Tex Shell Jacket': true,
    'Merino Wool Socks': true,
    'Waterproof Hiking Boots': true,
    'Adjustable Trekking Poles': true,
    'Headlamp (300+ Lumens)': true,
    'Microspikes / Crampons': false,
    'Category 4 Glacier Sunglasses': true,
    'Acetazolamide (Diamox)': true,
    'Aquatabs Purification': true,
    'Wilderness First Aid Kit': true,
    '20,000mAh Power Bank': true,
    'TIMS & Park Permit Printouts': true,
    'Adequate Physical NPR Cash': true,
  };

  // Budget variables
  String nationality = 'Foreigner';
  int lodgingNight = 1500;
  int mealsPerDay = 2500;
  int guideWage = 3500;
  int porterWage = 2200;
  bool extraShower = true;
  bool extraCharging = true;
  bool extraWifi = true;
  String currency = 'USD';

  @override
  void initState() {
    super.initState();
    selectedTrekId = widget.preselectedTrekId ?? (OfflineRepository.instance.treks.firstOrNull?.id ?? 'T007');
    final routes = OfflineRepository.instance.getRoutesByTrekId(selectedTrekId);
    selectedRouteId = routes.firstOrNull?.id ?? 'ABC_R001';
    if (widget.preselectedTrekId != null) {
      currentStep = 2; // Jump to route selection
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Step $currentStep of 5: ${_getStepTitle(currentStep)}'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (currentStep > 1) {
              setState(() => currentStep--);
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
      ),
      body: Column(
        children: [
          // Step Progress Track
          LinearProgressIndicator(
            value: currentStep / 5.0,
            backgroundColor: const Color(0xFF1E293B),
            color: const Color(0xFFF59E0B),
            minHeight: 4,
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildCurrentStepContent(),
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF111726),
              border: Border(top: BorderSide(color: Color(0xFF1E293B))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (currentStep > 1)
                  OutlinedButton(
                    onPressed: () => setState(() => currentStep--),
                    child: const Text('Back'),
                  )
                else
                  const SizedBox.shrink(),

                ElevatedButton(
                  onPressed: () {
                    if (currentStep < 5) {
                      setState(() => currentStep++);
                    } else {
                      // Final Step: Save Expedition
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🎉 Expedition Dossier Saved to Profile!'),
                          backgroundColor: Color(0xFF10B981),
                        ),
                      );
                      Navigator.of(context).pop();
                    }
                  },
                  child: Text(currentStep == 5 ? 'Finish & Save Dossier' : 'Continue →'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getStepTitle(int step) {
    switch (step) {
      case 1: return 'Trail Selection';
      case 2: return 'Route Variant';
      case 3: return 'Gear Packing';
      case 4: return 'Expedition Budget';
      case 5: return 'AMS Safety Dossier';
      default: return 'Planner';
    }
  }

  Widget _buildCurrentStepContent() {
    switch (currentStep) {
      case 1: return _buildStep1Trails();
      case 2: return _buildStep2Routes();
      case 3: return _buildStep3Gear();
      case 4: return _buildStep4Budget();
      case 5: return _buildStep5Dossier();
      default: return const SizedBox.shrink();
    }
  }

  // --- Step 1: Trail Selection ---
  Widget _buildStep1Trails() {
    final treks = OfflineRepository.instance.treks;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Choose Your Destination Corridor', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 4),
        const Text('Select one of the 21 surveyed Himalayan trekking regions in Nepal.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
        const SizedBox(height: 16),
        ...treks.map((t) {
          final isSelected = t.id == selectedTrekId;
          return Card(
            color: isSelected ? const Color(0xFF182235) : const Color(0xFF111726),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF1E293B), width: isSelected ? 2 : 1),
            ),
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${t.district} • Max ${t.maxAltitudeM}m • ${t.durationRange}'),
              trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFF59E0B)) : null,
              onTap: () {
                setState(() {
                  selectedTrekId = t.id;
                  final routes = OfflineRepository.instance.getRoutesByTrekId(t.id);
                  selectedRouteId = routes.firstOrNull?.id ?? 'ABC_R001';
                });
              },
            ),
          );
        }),
      ],
    );
  }

  // --- Step 2: Route Variant ---
  Widget _buildStep2Routes() {
    final trek = OfflineRepository.instance.getTrekById(selectedTrekId);
    final routes = OfflineRepository.instance.getRoutesByTrekId(selectedTrekId);
    final selectedRoute = routes.where((r) => r.id == selectedRouteId).firstOrNull ?? routes.firstOrNull;
    final stages = selectedRoute != null ? OfflineRepository.instance.getItineraryForRoute(selectedRoute.id) : <RouteStage>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Route Variant & Pace', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 4),
        const Text('Choose Classic, Express, or High-Pass circuit variants.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
        const SizedBox(height: 16),
        ...routes.map((r) {
          final isSelected = r.id == selectedRouteId;
          return Card(
            color: isSelected ? const Color(0xFF182235) : const Color(0xFF111726),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF1E293B), width: isSelected ? 2 : 1),
            ),
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(r.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${r.totalDays} Days • ~${r.distanceKm.round()} km • Max ${r.maxAltitudeM}m'),
              trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFF59E0B)) : null,
              onTap: () {
                setState(() => selectedRouteId = r.id);
              },
            ),
          );
        }),
        const SizedBox(height: 16),
        _buildWeatherCard(trek, selectedRoute),
        const SizedBox(height: 16),
        _buildHotelsSection(stages),
      ],
    );
  }

  Widget _buildWeatherCard(Trek? trek, RouteModel? route) {
    final ws = OfflineRepository.instance.getWeatherStationForTrek(trek?.id);
    final stationName = ws?['name'] ?? '${trek?.title ?? "Himalaya"} Station';
    final stationAlt = ws?['elevation_m'] ?? (trek?.maxAltitudeM ?? 4000);
    final maxAlt = route?.maxAltitudeM ?? (trek?.maxAltitudeM ?? 4000);

    // Realistic lapse rate calculation: ~18°C at 1000m, -5.5°C to -6.5°C per 1000m
    final int dayTemp = (18 - (maxAlt / 1000.0 * 5.5)).round();
    final int nightTemp = (dayTemp - 14).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111726),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('🌦️', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ALPINE WEATHER TELEMETRY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8), letterSpacing: 0.5)),
                      Text(stationName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('${stationAlt}m', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFF0B0F17), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      const Text('Peak Daytime', style: TextStyle(fontSize: 10, color: Colors.white60)),
                      const SizedBox(height: 2),
                      Text('$dayTemp°C', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFF0B0F17), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      const Text('Night Minimum', style: TextStyle(fontSize: 10, color: Colors.white60)),
                      const SizedBox(height: 2),
                      Text('$nightTemp°C', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: nightTemp <= 0 ? const Color(0xFF38BDF8) : Colors.white)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFF0B0F17), borderRadius: BorderRadius.circular(10)),
                  child: const Column(
                    children: [
                      Text('Wind / Ridge', style: TextStyle(fontSize: 10, color: Colors.white60)),
                      SizedBox(height: 2),
                      Text('15-25 km/h', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.info_outline, size: 13, color: Color(0xFF94A3B8)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Best Window: ${trek?.bestMonths ?? "Mar-May, Oct-Dec"}. Clear mornings, thermal cloud buildup in afternoons.',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHotelsSection(List<RouteStage> stages) {
    if (stages.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111726),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Text('🏨', style: TextStyle(fontSize: 18)),
                  SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('STAGE LODGES & TEAHOUSES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981), letterSpacing: 0.5)),
                      Text('Nightly Accommodations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                    ],
                  ),
                ],
              ),
              Text('${stages.length} Stops', style: const TextStyle(fontSize: 11, color: Colors.white60)),
            ],
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stages.length,
            separatorBuilder: (_, __) => const Divider(height: 16, color: Color(0xFF1E293B)),
            itemBuilder: (context, idx) {
              final stage = stages[idx];
              final hotels = OfflineRepository.instance.getAccommodationsForSettlement(stage.destination);

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                            child: Text('Day ${stage.day}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                          ),
                          const SizedBox(width: 8),
                          Text(stage.destination, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                        ],
                      ),
                      Text('${stage.altitudeM}m', style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Color(0xFF38BDF8))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (hotels.isNotEmpty) ...[
                    ...hotels.take(2).map((h) => Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF080B11),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF1E293B)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(h.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                                const SizedBox(height: 2),
                                Text(
                                  'NPR ${h.baseRoomPriceNpr}/night • ${h.capacity} beds • ${h.amenities.take(2).join(", ")}',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.phone, size: 16, color: Color(0xFF10B981)),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            tooltip: 'Call ${h.primaryPhone}',
                            onPressed: () => PhoneHelper.dial(context, h.primaryPhone),
                          ),
                        ],
                      ),
                    )),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF080B11),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.house_outlined, size: 12, color: Colors.white38),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text('Standard alpine teahouse available on-site (~NPR 800-1,200)', style: TextStyle(fontSize: 10, color: Colors.white54)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  // --- Step 3: Gear Checklist ---
  Widget _buildStep3Gear() {
    final int packedCount = packedGear.values.where((v) => v).length;
    final int totalCount = packedGear.length;
    final pct = (packedCount / totalCount * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Pack Readiness', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            Text('$pct% Ready ($packedCount/$totalCount)', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(value: packedCount / totalCount, color: const Color(0xFF10B981), backgroundColor: const Color(0xFF1E293B)),
        const SizedBox(height: 16),
        ...packedGear.keys.map((item) {
          final isPacked = packedGear[item] ?? false;
          return CheckboxListTile(
            value: isPacked,
            activeColor: const Color(0xFFF59E0B),
            checkColor: Colors.black,
            title: Text(item, style: TextStyle(fontSize: 13, color: isPacked ? Colors.white : const Color(0xFF94A3B8))),
            onChanged: (val) {
              setState(() {
                packedGear[item] = val ?? false;
              });
            },
          );
        }),
      ],
    );
  }

  // --- Step 4: Budget Calculator ---
  Widget _buildStep4Budget() {
    final route = OfflineRepository.instance.getRouteById(selectedRouteId ?? 'ABC_R001');
    final int days = route?.totalDays ?? 10;

    final budget = BudgetCalculatorService.instance.calculateTotalBudget(
      days: days,
      nationality: nationality,
      lodgingPerNight: lodgingNight,
      mealsPerDay: mealsPerDay,
      guideDailyWage: guideWage,
      porterDailyWage: porterWage,
      hasShower: extraShower,
      hasCharging: extraCharging,
      hasWifi: extraWifi,
      currency: currency,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF182235),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('ESTIMATED TOTAL EXPEDITION COST', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
              const SizedBox(height: 4),
              Text(
                'NPR ${(budget['totalNPR'] as int).toString()}',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontFamily: 'monospace', color: Colors.white),
              ),
              Text('≈ ${budget['convertedString']}', style: const TextStyle(fontSize: 14, color: Color(0xFFFDE68A), fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Includes 15% Emergency Cash Reserve: NPR ${budget['cashBuffer']}', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Nationality
        const Text('Trekker Nationality', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: nationality,
          decoration: const InputDecoration(border: OutlineInputBorder()),
          dropdownColor: const Color(0xFF111726),
          items: const [
            DropdownMenuItem(value: 'Foreigner', child: Text('Foreigner (TIMS + Park NPR 5,000)')),
            DropdownMenuItem(value: 'SAARC', child: Text('SAARC National (NPR 2,500)')),
            DropdownMenuItem(value: 'Domestic', child: Text('Nepali Citizen (TIMS Exempt)')),
          ],
          onChanged: (val) => setState(() => nationality = val ?? 'Foreigner'),
        ),
        const SizedBox(height: 12),

        // Guide Selector
        const Text('Mountain Guide Option', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        DropdownButtonFormField<int>(
          value: guideWage,
          decoration: const InputDecoration(border: OutlineInputBorder()),
          dropdownColor: const Color(0xFF111726),
          items: const [
            DropdownMenuItem(value: 0, child: Text('No Guide (Independent Trekker)')),
            DropdownMenuItem(value: 3500, child: Text('Licensed Guide (~NPR 3,500/day)')),
            DropdownMenuItem(value: 4500, child: Text('Senior Wilderness Guide (~NPR 4,500/day)')),
          ],
          onChanged: (val) => setState(() => guideWage = val ?? 0),
        ),
        const SizedBox(height: 12),

        // Porter Selector
        const Text('Porter Support Option', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        DropdownButtonFormField<int>(
          value: porterWage,
          decoration: const InputDecoration(border: OutlineInputBorder()),
          dropdownColor: const Color(0xFF111726),
          items: const [
            DropdownMenuItem(value: 0, child: Text('No Porter (Carry Own Pack)')),
            DropdownMenuItem(value: 2200, child: Text('1 Porter (~NPR 2,200/day, max 20kg)')),
            DropdownMenuItem(value: 4400, child: Text('2 Porters (~NPR 4,400/day, max 40kg)')),
          ],
          onChanged: (val) => setState(() => porterWage = val ?? 0),
        ),
      ],
    );
  }

  // --- Step 5: AMS Safety Dossier ---
  Widget _buildStep5Dossier() {
    final trek = OfflineRepository.instance.getTrekById(selectedTrekId);
    final route = OfflineRepository.instance.getRouteById(selectedRouteId ?? 'ABC_R001');
    final stages = OfflineRepository.instance.getItineraryForRoute(selectedRouteId ?? 'ABC_R001');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
          ),
          child: const Row(
            children: [
              Icon(Icons.health_and_safety, color: Color(0xFF10B981), size: 24),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Wilderness Medicine Guideline: Daily sleep elevations follow safe acclimatization profiles.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevationProfileChart(stages: stages),
        const SizedBox(height: 16),
        _buildWeatherCard(trek, route),
        const SizedBox(height: 16),
        _buildHotelsSection(stages),
        const SizedBox(height: 16),
        Text('Itinerary Overview (${stages.length} Stages):', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        ...stages.map((s) => ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            radius: 12,
            backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
            child: Text('D${s.day}', style: const TextStyle(fontSize: 10, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
          ),
          title: Text(s.destination, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          trailing: Text('${s.altitudeM}m', style: const TextStyle(color: Color(0xFFF59E0B), fontFamily: 'monospace', fontSize: 12)),
        )),
      ],
    );
  }
}

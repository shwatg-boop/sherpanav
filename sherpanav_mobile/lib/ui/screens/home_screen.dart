import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'explore_screen.dart';
import 'route_map_screen.dart';
import 'plan_wizard_screen.dart';
import 'accommodations_screen.dart';
import 'ams_tracker_screen.dart';
import 'emergency_sos_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<ExploreScreenState> _exploreKey = GlobalKey<ExploreScreenState>();

  void _setTabIndex(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _selectRegionAndExplore(String region) {
    setState(() {
      _currentIndex = 1; // Switch to Explore/Routes tab
    });
    // Immediately apply region filter in ExploreScreen
    _exploreKey.currentState?.selectRegion(region);
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    final List<Widget> screens = [
      DashboardScreen(
        onOpenMap: () => _setTabIndex(2),
        onSelectRegion: _selectRegionAndExplore,
        onOpenPlan: () => _setTabIndex(3),
      ),
      ExploreScreen(
        key: _exploreKey,
        onOpenRouteMap: (routeId) {
          _setTabIndex(2);
        },
      ),
      const RouteMapScreen(),
      const PlanWizardScreen(),
      const AccommodationsScreen(),
      const AMSTrackerScreen(),
      const EmergencySOSScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF080B11),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        height: 64 + bottomPadding,
        padding: EdgeInsets.only(bottom: bottomPadding),
        decoration: const BoxDecoration(
          color: Color(0xFF0B0F19),
          border: Border(
            top: BorderSide(color: Color(0xFF1E293B), width: 1.0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 10,
              offset: Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          children: [
            // Tab 0: Home Dashboard
            _buildTabItem(index: 0, iconEmoji: '🏠', label: 'Home'),

            // Tab 1: Explore / Routes
            _buildTabItem(index: 1, iconEmoji: '🧭', label: 'Routes'),

            // Tab 2: Interactive Topo Maps
            _buildTabItem(index: 2, iconEmoji: '🗺️', label: 'Maps'),

            // Tab 3: ✨ PLAN (ELEVATED HIGHLIGHTED CTA BUTTON)
            _buildHighlightedPlanButton(),

            // Tab 4: Lodges & Teahouses
            _buildTabItem(index: 4, iconEmoji: '🛖', label: 'Lodges'),

            // Tab 5: AMS Safety & Lake Louise
            _buildTabItem(index: 5, iconEmoji: '🩺', label: 'AMS'),

            // Tab 6: Emergency SOS & Rescue
            _buildTabItem(index: 6, iconEmoji: '🚨', label: 'SOS'),
          ],
        ),
      ),
    );
  }

  Widget _buildTabItem({
    required int index,
    required String iconEmoji,
    required String label,
  }) {
    final isSelected = _currentIndex == index;

    return Expanded(
      flex: 10,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _setTabIndex(index),
          splashColor: const Color(0xFFF59E0B).withOpacity(0.12),
          highlightColor: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                iconEmoji,
                style: TextStyle(
                  fontSize: isSelected ? 18 : 16,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHighlightedPlanButton() {
    final isSelected = _currentIndex == 3;

    return Expanded(
      flex: 13, // Slightly wider prominent touch target
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _setTabIndex(3),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? Colors.white : const Color(0xFFFDE68A),
                  width: isSelected ? 1.6 : 1.0,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withOpacity(isSelected ? 0.65 : 0.4),
                    blurRadius: isSelected ? 12 : 7,
                    spreadRadius: isSelected ? 2 : 0,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('✨', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 3),
                    const Text(
                      'Plan',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w900,
                        color: Colors.black,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
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

  final List<Widget> _screens = const [
    ExploreScreen(),
    RouteMapScreen(),
    PlanWizardScreen(),
    AccommodationsScreen(),
    AMSTrackerScreen(),
    EmergencySOSScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Text('🧭', style: TextStyle(fontSize: 18)),
            label: 'Explore',
          ),
          BottomNavigationBarItem(
            icon: Text('🗺️', style: TextStyle(fontSize: 18)),
            label: 'Maps',
          ),
          BottomNavigationBarItem(
            icon: Text('✨', style: TextStyle(fontSize: 18)),
            label: 'Plan',
          ),
          BottomNavigationBarItem(
            icon: Text('🏠', style: TextStyle(fontSize: 18)),
            label: 'Lodges',
          ),
          BottomNavigationBarItem(
            icon: Text('🩺', style: TextStyle(fontSize: 18)),
            label: 'AMS',
          ),
          BottomNavigationBarItem(
            icon: Text('🚨', style: TextStyle(fontSize: 18)),
            label: 'SOS',
          ),
        ],
      ),
    );
  }
}

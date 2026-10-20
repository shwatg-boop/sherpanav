import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'data/repositories/offline_repository.dart';
import 'services/altitude_fusion_service.dart';
import 'ui/theme/app_theme.dart';
import 'ui/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Force portrait orientation on alpine trails
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set immersive dark status bar & navigation bar
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF080B11),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize offline dataset (all 21 treks, 56 routes, 405 lodges)
  await OfflineRepository.instance.initialize();

  // Start background altitude & location tracking
  AltitudeFusionService.instance.startTracking();

  runApp(const SherpaNavMobileApp());
}

class SherpaNavMobileApp extends StatelessWidget {
  const SherpaNavMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SherpaNav Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const HomeScreen(),
    );
  }
}

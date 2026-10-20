import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/ams_entry.dart';

class AMSCalculatorService {
  static final AMSCalculatorService instance = AMSCalculatorService._internal();
  AMSCalculatorService._internal();

  static const String _storageKey = 'sherpanav_ams_history';

  Future<List<AMSEntry>> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String>? raw = prefs.getStringList(_storageKey);
    if (raw == null) return [];
    return raw.map((str) => AMSEntry.fromJson(json.decode(str))).toList();
  }

  Future<void> saveEntry(AMSEntry entry) async {
    final prefs = await SharedPreferences.getInstance();
    final history = await loadHistory();
    history.insert(0, entry);
    final serialized = history.map((e) => json.encode(e.toJson())).toList();
    await prefs.setStringList(_storageKey, serialized);
  }

  // Clinical Ascent Safety: Alert if gain > 500m above 3,000m
  bool isRapidAscentDangerous(int currentElevationM, int previousElevationM) {
    if (currentElevationM <= 3000) return false;
    final int gain = currentElevationM - previousElevationM;
    return gain > 500;
  }
}

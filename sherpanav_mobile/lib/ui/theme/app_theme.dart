import 'package:flutter/material.dart';

class AppTheme {
  // Alpine Palette
  static const Color obsidianBg = Color(0xFF080B11);
  static const Color obsidianCard = Color(0xFF111726);
  static const Color obsidianSurface = Color(0xFF182235);
  static const Color obsidianBorder = Color(0xFF1E293B);

  static const Color goldAccent = Color(0xFFF59E0B);
  static const Color goldLight = Color(0xFFFDE68A);
  static const Color emeraldSafe = Color(0xFF10B981);
  static const Color redSOS = Color(0xFFEF4444);
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidianBg,
      colorScheme: const ColorScheme.dark(
        primary: goldAccent,
        onPrimary: Colors.black,
        secondary: emeraldSafe,
        error: redSOS,
        surface: obsidianCard,
        onSurface: textPrimary,
      ),
      cardTheme: CardTheme(
        color: obsidianCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: obsidianBorder, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidianBg,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xEE0B0F17),
        selectedItemColor: goldAccent,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 12,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: goldAccent,
          foregroundColor: Colors.black,
          minimumSize: const Size(48, 48), // Glove-friendly minimum touch target
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

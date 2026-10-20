class BudgetCalculatorService {
  static final BudgetCalculatorService instance = BudgetCalculatorService._internal();
  BudgetCalculatorService._internal();

  // Exchange Rates per 1 NPR
  static const Map<String, double> rates = {
    'USD': 1 / 134.0,
    'EUR': 1 / 144.0,
    'GBP': 1 / 168.0,
    'AUD': 1 / 88.0,
    'INR': 1 / 1.6,
    'NPR': 1.0,
  };

  static const Map<String, String> symbols = {
    'USD': '\$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A\$',
    'INR': '₹',
    'NPR': 'NPR ',
  };

  int calculatePermitFee(String nationality) {
    if (nationality == 'SAARC') return 2500;
    if (nationality == 'Domestic') return 100;
    return 5000; // Foreigner standard
  }

  Map<String, dynamic> calculateTotalBudget({
    required int days,
    required String nationality,
    required int lodgingPerNight,
    required int mealsPerDay,
    required int guideDailyWage,
    required int porterDailyWage,
    required bool hasShower,
    required bool hasCharging,
    required bool hasWifi,
    String currency = 'USD',
  }) {
    final permitFee = calculatePermitFee(nationality);
    final lodgingTotal = days * lodgingPerNight;
    final mealsTotal = days * mealsPerDay;
    final guideTotal = days * guideDailyWage;
    final porterTotal = days * porterDailyWage;

    final extraShower = hasShower ? (400 * (days * 0.6).floor()) : 0;
    final extraCharging = hasCharging ? (300 * days) : 0;
    final extraWifi = hasWifi ? (400 * (days * 0.7).floor()) : 0;
    final extrasTotal = extraShower + extraCharging + extraWifi;

    final subtotal = permitFee + lodgingTotal + mealsTotal + guideTotal + porterTotal + extrasTotal;
    final cashBuffer = (subtotal * 0.15).round();
    final grandTotalNPR = subtotal;

    final rate = rates[currency] ?? rates['USD']!;
    final sym = symbols[currency] ?? '\$';
    final converted = (grandTotalNPR * rate).round();

    return {
      'totalNPR': grandTotalNPR,
      'convertedString': '$sym$converted $currency',
      'permitFee': permitFee,
      'lodgingTotal': lodgingTotal,
      'mealsTotal': mealsTotal,
      'guideTotal': guideTotal,
      'porterTotal': porterTotal,
      'extrasTotal': extrasTotal,
      'cashBuffer': cashBuffer,
    };
  }
}

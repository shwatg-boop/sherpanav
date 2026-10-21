import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class PhoneHelper {
  /// Clean, parse and initiate a phone call via the native device dialer.
  /// Handles package visibility limitations, URL parsing, and provides
  /// an immediate clipboard copy fallback if no dialer application responds.
  static Future<void> dial(BuildContext context, String rawPhone) async {
    final trimmed = rawPhone.trim();
    if (trimmed.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No telephone contact available for this lodge.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
      return;
    }

    // Clean phone number: keep leading '+' and numeric digits only
    final clean = trimmed.replaceAll(RegExp(r'[^0-9+]'), '');
    if (clean.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid telephone number format.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
      return;
    }

    final Uri telUri = Uri.parse('tel:$clean');
    bool launched = false;

    try {
      if (await canLaunchUrl(telUri)) {
        launched = await launchUrl(telUri, mode: LaunchMode.externalApplication);
      }
      if (!launched) {
        launched = await launchUrl(telUri, mode: LaunchMode.externalNonBrowserApplication);
      }
      if (!launched) {
        launched = await launchUrl(telUri);
      }
    } catch (e) {
      debugPrint('Dialer launch exception: $e');
    }

    if (!launched && context.mounted) {
      // Fallback: copy number to clipboard and inform user
      await Clipboard.setData(ClipboardData(text: clean));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Dialer could not open. Copied $clean to clipboard.'),
          backgroundColor: const Color(0xFFF59E0B),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'OK',
            textColor: Colors.black,
            onPressed: () {},
          ),
        ),
      );
    }
  }

  /// Launch SMS composer with an emergency distress body text pre-populated.
  static Future<void> sendSms(BuildContext context, String rawPhone, String body) async {
    final clean = rawPhone.trim().replaceAll(RegExp(r'[^0-9+]'), '');
    final Uri smsUri = Uri(
      scheme: 'sms',
      path: clean,
      queryParameters: {'body': body},
    );

    bool launched = false;
    try {
      if (await canLaunchUrl(smsUri)) {
        launched = await launchUrl(smsUri, mode: LaunchMode.externalApplication);
      }
      if (!launched) {
        launched = await launchUrl(smsUri);
      }
    } catch (e) {
      debugPrint('SMS launch exception: $e');
    }

    if (!launched && context.mounted) {
      await Clipboard.setData(ClipboardData(text: body));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('SMS app could not open. Distress message copied to clipboard.'),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }
}

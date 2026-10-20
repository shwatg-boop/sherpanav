# SherpaNav Mobile (Android & iPhone)

> **Himalayan Trails & High Altitude Navigation Mobile App**  
> 100% Offline Alpine Navigation, Fused Barometric Altimeter, Lake Louise AMS Diagnostic Tracker, 405 Verified Teahouses, and Emergency SOS Telemetry.

---

## 📱 Features Pre-Loaded (100% Offline)
- **Pre-bundled Alpine Database**: All 21 Himalayan treks, 56 routes, 405 accommodations with phone numbers, permits, weather stations, and trail tracks.
- **Topographic Offline Map**: Trail alignment with elevation profiles and stage stops.
- **5-Step Plan a Trek Wizard**: Trail selection, route variants, 27-item packing checklist, interactive multi-currency budget calculator, and clinical AMS dossier.
- **Lake Louise AMS Diagnostic Tracker**: Headache, GI, fatigue, dizziness assessment, SpO2 monitoring, and severe AMS descent warning alerts.
- **405 Verified Teahouses**: Settlement filtering, bed capacity, base prices, and one-tap offline dialer.
- **Emergency SOS & Rescue Beacon**: GPS coordinates telemetry, acoustic alpine whistle distress code (6 blasts/min), and one-tap SMS dispatcher to Himalayan Rescue Association (HRA).

---

## 🚀 How to Build the Android APK

### Option 1: One-Click Local Build (Windows)
If you have Flutter installed on your PC:
1. Double-click `build_apk.bat` (or run `./build_apk.ps1` in PowerShell).
2. The script runs `flutter pub get` and `flutter build apk --release`.
3. Your installable release APK will be generated at:
   ```
   sherpanav_mobile/SherpaNav-Release.apk
   ```

### Option 2: Automated Cloud APK Build (Free via GitHub Actions)
If you don't have Flutter or Android Studio installed on your computer:
1. Push this repository to GitHub.
2. Go to the **Actions** tab on your GitHub repository.
3. The workflow **"Build SherpaNav Android APK"** will automatically compile the release APK in ~3 minutes using Ubuntu cloud runners.
4. Download `SherpaNav-Release-APK.zip` from the workflow summary, unzip it, and you have your APK ready to install!

---

## 📲 How to Install the APK on Your Android Phone

1. **Transfer the APK** to your Android phone (via USB cable, Google Drive, WhatsApp, or Telegram).
2. Open the **Files** or **Downloads** app on your phone and tap `SherpaNav-Release.apk`.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Toggle **Allow from this source** to ON.
   - Tap **Install**.
4. Tap **Open** — SherpaNav will launch immediately with all 21 treks and offline maps preloaded!

---

## 🍏 How to Run on iPhone (iOS)

To run SherpaNav on an iPhone:
1. Open the project in macOS with Xcode installed.
2. In terminal:
   ```bash
   cd sherpanav_mobile
   flutter pub get
   flutter run -d ios
   ```
3. To deploy to your physical iPhone:
   - Connect your iPhone via USB.
   - Select your Development Team in `Runner.xcworkspace` in Xcode.
   - Run `flutter run -d <your-device-id> --release`.

# LIFEHUB Android App - Build & Development Guide

## Overview

LIFEHUB Android application is built using [Capacitor](https://capacitorjs.com/) v6, which wraps the existing LIFEHUB Progressive Web App in a native Android shell. All application logic, data persistence, and UI remain unchanged from the web version.

**Application ID:** `com.raizen.lifehub`  
**Application Name:** LIFEHUB  
**Target SDK:** API 34 (Android 14)  
**Minimum SDK:** API 24 (Android 7.0)

---

## System Requirements

### Development Machine

- **Java Development Kit (JDK):** Version 11 or higher
  - Download: https://www.oracle.com/java/technologies/javase-downloads.html
  - Verify: `java -version`

- **Android SDK:** Latest tools and platforms
  - Best installed via [Android Studio](https://developer.android.com/studio)
  - Minimum: Build Tools 34, Platform API 34
  - Verify: Check Android Studio's SDK Manager

- **Gradle:** Version 8.0+
  - Usually included with Android Studio
  - Verify: `gradle -v`

- **Node.js:** Version 16+ with npm
  - Download: https://nodejs.org/
  - Verify: `node -v` and `npm -v`

### Environment Variables

Set these on your development machine (required for builds):

**Windows (PowerShell or CMD):**
```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-11", "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:APPDATA\Local\Android\Sdk", "User")
```

**macOS/Linux (.bashrc or .zshrc):**
```bash
export JAVA_HOME=/path/to/jdk
export ANDROID_HOME=$HOME/Library/Android/Sdk  # macOS
# or
export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## Quick Start: Build Debug APK

### 1. Install Dependencies
```bash
cd path/to/lifehub
npm install
```

### 2. Prepare Web Assets
The web app files must be in the `www/` directory for Capacitor:

```bash
# Copy all necessary web assets
cp index.html service-worker.js manifest.webmanifest www/
cp -r css js www/
```

Or use the provided script:
```bash
npm run build  # (shows that no build step is needed)
```

### 3. Sync with Capacitor
This copies web assets to the Android project:

```bash
npx cap sync android
```

Expected output:
```
√ Copying web assets from www to android\app\src\main\assets\public
√ Creating capacitor.config.json in android\app\src\main\assets
√ Updating Android plugins
...
√ Sync finished
```

### 4. Build the APK

**Option A: Command Line (requires Gradle installed)**
```bash
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Android Studio GUI**
```bash
npx cap open android
```

Then in Android Studio:
1. Build → Build Bundles/APK → Build APK(s)
2. Wait for the build to complete
3. Check the Build Output window for the APK location

**Option C: Run Directly**
If you have an emulator or device connected:
```bash
cd android
./gradlew installDebug
```

Or in Android Studio:
1. Run → Run 'app' (Shift+F10)
2. Select your device/emulator
3. The app will build and launch automatically

---

## Install & Test

### On Android Emulator

1. **Open Android Studio** and launch an emulator:
   - Tools → AVD Manager → Select device → Launch

2. **Install APK via adb:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Or use Android Studio:**
   - Click the Run button (play icon)
   - Select your emulator
   - App builds and launches automatically

### On Physical Device

1. **Enable USB Debugging:**
   - Developer Options → USB Debugging (ON)
   - Connect device via USB

2. **Install APK:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
   
   Or verify connection first:
   ```bash
   adb devices  # Should list your device
   ```

3. **Or use Android Studio:**
   - Click Run → Select your device
   - Build and install

---

## Capabilities & Permissions

### Enabled Permissions
- **INTERNET** - For web app to function
- **SERVICE_WORKER** - Automatic from Capacitor

### No Permissions Requested
The app does NOT request:
- ❌ Camera
- ❌ Microphone  
- ❌ Location
- ❌ Contacts
- ❌ Storage
- ❌ Calendar
- ❌ Photos

This keeps the security surface minimal. Permissions are only added if features require them.

---

## Data & Privacy

### IndexedDB in Android WebView

LIFEHUB uses IndexedDB for offline data persistence. In the Android app:

- **Database name:** `lifehub`
- **Storage location:** `/data/data/com.raizen.lifehub/app_webview/`
- **Persistence:** Data survives app restart and suspension
- **Scope:** Each app installation has its own isolated storage

### Data NOT Sent Anywhere

✓ No cloud sync  
✓ No server communication  
✓ No accounts  
✓ No analytics  
✓ No telemetry  
✓ Completely local-only

### Backup User Data

Users should regularly backup their data:

**In the app:**
1. Settings → Export JSON
2. Save the JSON file to a safe location
3. Can be imported on any device via Settings → Import JSON

**For developers:**
```bash
# Pull database from device
adb pull /data/data/com.raizen.lifehub/app_webview/Default/IndexedDB/

# Push database back
adb push ./Default/ /data/data/com.raizen.lifehub/app_webview/
```

---

## Offline Functionality

LIFEHUB works completely offline in the Android app:

- ✓ App launches without network
- ✓ Service worker caches all assets
- ✓ IndexedDB data accessible offline
- ✓ All features work offline
- ✓ Changes sync to local storage automatically

**Test offline:**
1. Build and install the APK
2. Open app
3. Disable network (Wi-Fi + Mobile)
4. All LIFEHUB features continue to work
5. Re-enable network - service worker updates cache

---

## Android Back Button Behavior

The app intelligently handles the Android back button:

**Current Stack:** Modal Open → Modal Closes  
**Current Stack:** Navigation Open → Navigation Closes  
**Current Page:** Any page → Navigate to Dashboard  
**Current Page:** Dashboard → Exit app

This is implemented via:
- `js/app.js`: `window.lifehubHandleBackButton()` function
- `android/app/src/main/java/.../MainActivity.java`: `onBackPressed()` override

To customize this behavior, edit the `lifehubHandleBackButton()` function in `js/app.js`.

---

## Icons & Splash Screen

### App Icons

Icons are defined in:
- `resources/android/icon/icon.svg` - Main app icon
- `resources/android/icon/icon-foreground.svg` - For adaptive icons
- `resources/android/icon/icon-background.svg` - For adaptive icons

After editing icons, run:
```bash
npx cap sync android
```

This regenerates all required icon sizes in the `android/app/src/main/res/mipmap-*` directories.

### Splash Screen

Splash screen configured in:
- `resources/android/splash/splash.svg` - Splash design
- `capacitor.config.json` - Splash timing settings

The splash shows for 2 seconds (configurable in `capacitor.config.json`):
```json
"SplashScreen": {
  "launchShowDuration": 2000,  // milliseconds
  "autoHide": true,
  "backgroundColor": "#101313"
}
```

---

## Troubleshooting

### Build Errors

**"JAVA_HOME not found"**
```bash
# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"

# macOS/Linux
export JAVA_HOME=/path/to/jdk
```

**"Android SDK not found"**
- Install Android Studio
- Run SDK Manager
- Install Build Tools 34 and Platform API 34
- Set `ANDROID_HOME` environment variable

**"Gradle sync failed"**
1. File → Invalidate Caches / Restart
2. File → Sync Now
3. Tools → SDK Manager → Install missing tools

### Runtime Issues

**App crashes on launch:**
1. Check device logs: `adb logcat -s lifehub`
2. Verify web assets copied: `adb shell ls /data/data/com.raizen.lifehub/`
3. Rebuild from scratch: `./gradlew clean assembleDebug`

**IndexedDB not working:**
1. Capacitor's WebView auto-enables IndexedDB
2. Verify storage is not blocked: Settings → Apps → LIFEHUB → Permissions
3. Check available storage on device

**Back button not working:**
1. Verify MainActivity.java has `onBackPressed()` override
2. Check JavaScript console for errors: `adb logcat -s Capacitor`

---

## Release Build (Future)

For Play Store or APK distribution:

```bash
cd android
./gradlew assembleRelease
```

Requires:
- Signing key configuration
- Version code/name updates
- Proper release configuration

See Android documentation for signing keys and release builds.

---

## File Structure

```
lifehub/
├── index.html                    # Web app (source)
├── css/                          # Styles (source)
├── js/                           # Scripts (source)
├── www/                          # Web assets (built for Capacitor)
├── android/                      # Capacitor Android project
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── assets/
│   │   │       │   └── public/   # Web assets copied by sync
│   │   │       ├── java/com/raizen/lifehub/
│   │   │       │   └── MainActivity.java  # Android back button handler
│   │   │       └── res/          # Icons, layouts, strings
│   │   └── build.gradle          # App build config
│   ├── build.gradle              # Project build config
│   └── gradlew                   # Gradle wrapper
├── resources/
│   └── android/
│       ├── icon/                 # App icons
│       └── splash/               # Splash screen
├── capacitor.config.json         # Capacitor configuration
├── package.json                  # npm configuration
└── .gitignore                    # Git ignore patterns
```

---

## Environment Reference

### Capacitor v6
- Supports Android API 24-34
- Uses AndroidX libraries
- WebView-based (Chrome WebView)

### Plugins Used
- `@capacitor/app` - App lifecycle
- `@capacitor/splash-screen` - Launch splash
- `@capacitor/status-bar` - Status bar styling
- Capacitor Core - Web app container

### Key Files Modified for Android

1. **`js/app.js`** - Added `window.lifehubHandleBackButton()`
2. **`MainActivity.java`** - Override `onBackPressed()`
3. **`capacitor.config.json`** - Android-specific config
4. **`.gitignore`** - Added Android build artifacts
5. **`README.md`** - Added Android instructions

---

## Support & Notes

- LIFEHUB Android version is functionally identical to the web version
- No Play Store listing yet (can be added in future)
- Debug APK suitable for testing and personal use
- For distribution, sign with release key and optimize for size
- Service worker functionality fully preserved in WebView

See PWA-AUDIT-REPORT.md for PWA implementation details.

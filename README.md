# LIFEHUB

LIFEHUB is a local-first personal command center for everything you want to do and everything you have done.

**Available as:**
- 🌐 **Progressive Web App (PWA)** - Install on any browser
- 🤖 **Native Android App** - Install via APK or Android Studio

## Current Features

- Dashboard, Inbox, category views, Completed history, Statistics, and Settings
- Universal item capture with category-specific metadata
- IndexedDB persistence with backward-compatible record normalization
- Add, edit, complete, delete, global search, status filters, and safe external links
- Application and project deadline calculations with dashboard upcoming items
- JSON backup export/import and CSV export
- Dark, light, and system themes
- Skippable first-use onboarding
- Offline application shell through a service worker

## Technology

The project uses native HTML, CSS, and JavaScript ES modules. It has no framework, build step, backend, or external runtime dependency. User records stay in the browser's IndexedDB database named `lifehub`.

For Android packaging, LIFEHUB uses [Capacitor](https://capacitorjs.com/) to wrap the web application in a native Android shell. The web app code remains unchanged and runs in the WebView.

## Project Structure

- `index.html`: application shell and modal forms
- `css/style.css`: design tokens, layout, responsive styles, and themes
- `js/app.js`: boot process, application state, events, persistence workflows, and Android back button handler
- `js/database.js`: IndexedDB service
- `js/ui-complete.js`: current route renderer, filters, sorting, history, checklists, and dashboard preferences
- `js/utils.js`: normalization, validation, routes, and date helpers
- `manifest.webmanifest`: PWA metadata
- `service-worker.js`: cached application shell
- `www/`: Production-ready web assets for Capacitor packaging
- `android/`: Capacitor Android project structure
- `resources/`: Android icons and splash screen assets

## Run Locally (Web/PWA)

Serve the folder from an HTTP origin so ES modules, IndexedDB, and the service worker work correctly:

```bash
npx serve .
```

Then open the displayed local URL. Opening `index.html` directly supports basic rendering, but service-worker offline support requires HTTP or HTTPS.

### Install as PWA

After running locally with `npx serve .`:

**Windows/Mac/Linux (Chrome/Edge):**
1. Open the local URL in Chrome or Edge
2. Click the **Install** button in the address bar (or menu → Install app)
3. LIFEHUB will be added to your start menu and desktop

**Android (Chrome):**
1. Open the local URL in Chrome mobile
2. Tap menu (⋮) → **Install app** (or Add to Home screen)
3. LIFEHUB will appear on your home screen

**iOS (Safari):**
1. Open the local URL in Safari
2. Tap Share → **Add to Home Screen**
3. LIFEHUB will appear on your home screen

## Android Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 16+ and npm
- [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/javase-downloads.html) 11+
- [Android SDK](https://developer.android.com/studio) with build tools
- [Gradle](https://gradle.org/) (included with Android Studio)

### Android Build Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy web assets (after any web app changes):**
   ```bash
   cp index.html service-worker.js manifest.webmanifest www/
   cp -r css js www/
   ```

3. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

4. **Build debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   
   The APK will be generated at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Or use Android Studio:**
   ```bash
   npx cap open android
   ```
   
   Then in Android Studio:
   - Build → Build Bundles/APK → Build APK(s)
   - Wait for the build to complete
   - APK will be in `app/build/outputs/apk/debug/`

### Install Debug APK on Device/Emulator

**Via ADB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Via Android Studio:**
1. Run → Run 'app' (or Shift+F10)
2. Select your emulator or connected device
3. The APK will be built and installed automatically

### Data & Privacy in Android

- All LIFEHUB data is stored locally in the Android app's IndexedDB
- No data is uploaded to any server
- No accounts or authentication required
- Data persists as long as the app is installed
- Uninstalling the app will remove all local data
- **Always maintain JSON backups** for important items

Use Settings → Export JSON to download your data as a backup that can be imported on any device.

## Backups

Use Settings > Export JSON to download a portable backup. Use Import JSON to validate and replace the current local dataset after confirmation. CSV export is intended for tabular item data and preserves commas, quotes, and line breaks safely.

## Privacy

LIFEHUB has no authentication or server. Data is stored locally:
- **Web/PWA**: Browser's IndexedDB (browser profile specific)
- **Android**: App's WebView storage (app-specific storage)

Clearing app data will remove records, so maintain JSON backups for important information.

## Development Notes

Keep the universal item shape stable and put category-specific fields under `metadata`. Normalize records at the database boundary when adding fields. Test changes in a fresh browser profile and at a 390px viewport. 

For Android development, test on multiple device sizes and screen densities using Android emulator: API 30 (mdpi, hdpi), API 31 (xhdpi), and API 32+ (xxhdpi).

### Back Button Behavior (Android)

The Android app handles the back button intelligently:
1. **If modal is open** → Closes the modal
2. **If mobile navigation is visible** → Closes navigation
3. **If not on dashboard** → Navigate back to dashboard
4. **On dashboard** → Exit app

This behavior is implemented via `window.lifehubHandleBackButton()` in `js/app.js`, called from `MainActivity.java`.

## Roadmap

Automated browser tests, deeper category-specific edit history, and a gradual split of `ui-complete.js` into smaller page modules are planned for subsequent increments.

Play Store distribution may be added in the future for convenient Android installation.


# LIFEHUB

> **Everything you want to do. Everything you've done.**

**Your life, in motion.**

LIFEHUB is a local-first personal command center for capturing what you want to do, tracking what you're doing, and remembering everything you've finished.

## 🚀 Download

### Android Beta — v1.0.0

[Download the latest APK](https://github.com/raizen-here/LIFEHUB/releases/download/v1.0.0-beta/LIFEHUB-v1.0.0-BETA.apk)

[View all releases](https://github.com/raizen-here/LIFEHUB/releases)

### 🌐 Web App

[Open LIFEHUB](https://raizen-here.github.io/LIFEHUB/)

Install it as a PWA from a supported browser.

> **Beta notice:** LIFEHUB is actively being developed. Bugs and UI changes are expected.

## ✨ What LIFEHUB does

- 🏠 **Dashboard** — see your life in motion
- 📥 **Inbox** — quickly capture anything before organizing it
- 🎮 **Games** — track backlogs, progress, ratings, and completion
- 🎬 **Media** — manage movies, series, and anime
- 📚 **Learning** — track courses, books, tutorials, and certifications
- 🎓 **Applications** — manage deadlines, requirements, and application status
- 💻 **Projects** — track ideas, builds, technologies, GitHub links, and demos
- 🔗 **Links** — save useful resources with context and tags
- 🛒 **Wishlist** — track things you want and their priority
- 🏆 **The Archive** — remember everything you've completed
- 📊 **Statistics** — see your progress over time
- ⚙️ **Settings** — control themes, backups, and preferences

## 🔄 The LIFEHUB lifecycle

Capture → Plan → Start → Pause → Complete.

Items can also be dropped or archived when plans change. Each category has its own relevant statuses and metadata.

## 🧠 Built for real life

LIFEHUB supports:

- Universal item capture with category-specific metadata
- IndexedDB local persistence
- Global search and status filtering
- Progress tracking and completion history
- Application/project deadline calculations
- Requirements checklists for applications
- JSON backup and restore
- CSV export
- Dark, light, and system themes
- Offline application shell through a service worker
- Responsive mobile UI
- Android back-button navigation

## 🔐 Local-first & privacy

LIFEHUB does not require an account or backend. Records are stored locally in the browser's IndexedDB or the Android app's WebView storage.

**Important:** uninstalling the Android app or clearing its app data removes locally stored records. Keep JSON backups of important data.

## 🛠️ Technology

- HTML
- CSS
- Vanilla JavaScript (ES modules)
- IndexedDB
- Progressive Web App (PWA)
- Capacitor + Android

No frontend framework or backend is required to run the core application.

## 📁 Project structure

```text
LIFEHUB/
├── index.html
├── css/
├── js/
├── icons/
├── manifest.webmanifest
├── service-worker.js
├── www/
├── resources/
└── android/
```

## 💻 Run locally

Serve the project from an HTTP origin so ES modules, IndexedDB, and service-worker features work correctly:

```bash
npx serve .
```

Then open the displayed local URL.

## 🤖 Android development

Prerequisites:

- Node.js + npm
- JDK
- Android SDK / Android Studio
- Capacitor dependencies

Typical workflow:

```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is generated under:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 💾 Backups

Use **Settings → Export JSON** to create a portable backup. Import JSON to restore a validated dataset after confirmation.

CSV export is available for tabular data.

## 🗺️ Roadmap

- Automated browser tests
- Deeper category-specific history
- More modular page architecture
- Continued Android/PWA improvements
- Future Play Store distribution

## 📄 License

License information will be added as the project matures.

---

**LIFEHUB** — organize it. focus on it. achieve it.
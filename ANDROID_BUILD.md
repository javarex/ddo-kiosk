# DDO Kiosk — Android APK Build Guide

## Overview

This project is an Electron + Alpine.js kiosk application that has been wrapped for Android using [Capacitor](https://capacitorjs.com/). The web frontend (`src/renderer/`) is built to a `www/` directory, which Capacitor copies into the Android project.

---

## Prerequisites

The following tools must be installed before building.

### Java JDK 21
Capacitor 8 requires Java 21. Installed via winget:
```
winget install Microsoft.OpenJDK.21
```
Location after install: `C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot`

### Android SDK
The SDK was set up at `C:\Android` with the following components:
- `platforms;android-35`
- `build-tools;35.0.1`
- `platform-tools`

The SDK was installed using Android command-line tools. `C:\Android\local.properties` is referenced by Gradle via `android/local.properties`.

### Node.js & npm
Required to build web assets. Already present in the project.

---

## Project Structure (Android-relevant files)

```
ddo-kioskv2/
├── src/renderer/          # Source files (Alpine.js frontend)
│   ├── index.html
│   ├── index.js
│   └── styles.css
├── www/                   # Built web assets — Capacitor reads from here
│   ├── index.html
│   ├── renderer.js
│   ├── bundle.css
│   └── assets/
├── android/               # Capacitor-generated Android project
│   ├── app/
│   │   └── build/outputs/apk/debug/app-debug.apk   ← output APK
│   ├── local.properties   # Points to C:\Android SDK
│   └── gradlew.bat
├── build-web.js           # Script that builds src/renderer → www/
├── capacitor.config.json  # Capacitor configuration
└── package.json
```

---

## Capacitor Configuration

**`capacitor.config.json`**
```json
{
  "appId": "com.davao_de_oro.kiosk",
  "appName": "DDO Kiosk",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}
```

---

## How to Rebuild the APK

### Step 1 — Install Node dependencies (first time only)
```bash
npm install
```

### Step 2 — Build web assets to `www/`
```bash
npm run build:web
```
This runs `build-web.js` which:
- Bundles `src/renderer/index.js` → `www/renderer.js` (via esbuild)
- Compiles `src/renderer/styles.css` → `www/bundle.css` (via PostCSS + Tailwind)
- Copies `src/renderer/index.html` → `www/index.html` (with paths fixed for Android)
- Copies `assets/` → `www/assets/`

### Step 3 — Sync web assets into the Android project
```bash
npx cap sync
```
This copies everything from `www/` into `android/app/src/main/assets/public/`.

### Step 4 — Build the APK
```bash
cd android
```

**On Windows (PowerShell or CMD):**
```cmd
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
set ANDROID_HOME=C:\Android
gradlew.bat assembleDebug
```

**On Windows (Git Bash):**
```bash
export JAVA_HOME="/c/Program Files/Microsoft/jdk-21.0.10.7-hotspot"
export ANDROID_HOME="/c/Android"
./gradlew assembleDebug
```

### Output APK location
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## All-in-one Rebuild Command (Git Bash)

Run from the project root (`E:\Projects\ddo-kioskv2`):

```bash
npm run build:web && \
npx cap sync && \
cd android && \
export JAVA_HOME="/c/Program Files/Microsoft/jdk-21.0.10.7-hotspot" ANDROID_HOME="/c/Android" && \
./gradlew assembleDebug
```

---

## Updating App Content

When you change the UI or logic in `src/renderer/`:

1. Edit files in `src/renderer/`
2. Run `npm run build:web` to rebuild `www/`
3. Run `npx cap sync` to push changes into the Android project
4. Rebuild the APK (`./gradlew assembleDebug`)

You do **not** need to re-run `npx cap add android` — that only needs to be done once.

---

## API URL

The backend API URL is hardcoded in `src/renderer/index.js`:

```js
const apiUrl = 'https://ddo-ticketing.davaodeoro.gov.ph';
```

Update this value before building if the server address changes, then rebuild following the steps above.

---

## Print Functionality

The kiosk uses `window.electronAPI.send('print-paper', data)` to trigger thermal printing via Electron IPC. This **does not work on Android** — the call is wrapped in a safety check so the app won't crash, but no printing will occur.

```js
// Only fires in Electron, silently skipped on Android
if (window.electronAPI) {
    window.electronAPI.send('print-paper', print_data);
}
```

To enable printing on Android, a Capacitor plugin for Bluetooth or network printing would be needed.

---

## Debug vs Release APK

The steps above produce a **debug APK** (signed with a debug key, suitable for testing and sideloading).

For a **release APK** (for app store distribution), you would need a keystore and run:
```bash
./gradlew assembleRelease
```
Then sign it with `apksigner` using your keystore. This is not required for internal/kiosk deployment.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `SDK location not found` | `ANDROID_HOME` not set or `local.properties` missing | Ensure `android/local.properties` has `sdk.dir=C\:\\Android` and `ANDROID_HOME` env var is set |
| `invalid source release: 21` | Wrong Java version (needs JDK 21) | Set `JAVA_HOME` to the JDK 21 path |
| `java: command not found` | Java not on PATH | Set `JAVA_HOME` explicitly as shown above |
| Web assets not updating | `www/` or Android assets are stale | Re-run `npm run build:web && npx cap sync` |
| Blank white screen on device | HTML path issues or JS error | Check `www/index.html` paths and browser console via `adb logcat` |

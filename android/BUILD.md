# ALIVE — Android TWA Build Guide

## What this is
A Trusted Web Activity (TWA) wrapper that launches `https://www.shortfactory.shop/alive/`
as a fullscreen native Android app. Chrome renders the PWA without any browser chrome —
it looks and feels like a native app.

## Prerequisites
- Android Studio (or just the Android SDK command-line tools)
- Java 8+ (JDK)
- A signing keystore (see below)

## Quick build (debug APK)

```bash
cd android/
./gradlew assembleDebug
# APK lands at: app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected device:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Release build (Play Store AAB)

### 1. Create a signing keystore (one time)
```bash
keytool -genkey -v -keystore alive-release.keystore \
  -alias alive -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD \
  -dname "CN=ShortFactory, O=ShortFactory, L=London, C=GB"
```
Move the keystore into `android/app/`.

### 2. Uncomment signing config
In `app/build.gradle`, uncomment the `signingConfigs.release` block and
the `signingConfig signingConfigs.release` line in `buildTypes.release`.

Set environment variables:
```bash
export KEYSTORE_PASSWORD=YOUR_PASSWORD
export KEY_PASSWORD=YOUR_PASSWORD
```

### 3. Build the AAB
```bash
cd android/
./gradlew bundleRelease
# AAB lands at: app/build/outputs/bundle/release/app-release.aab
```

Upload this AAB to Google Play Console.

## Digital Asset Links (CRITICAL)

For the TWA to run fullscreen (no URL bar), Chrome must verify that the app
owns the website. This requires a `.well-known/assetlinks.json` file on the server.

### 1. Get your signing key fingerprint
```bash
keytool -list -v -keystore alive-release.keystore -alias alive | grep SHA256
```

### 2. Update assetlinks.json
Replace `REPLACE_WITH_YOUR_SIGNING_KEY_SHA256_FINGERPRINT` in `assetlinks.json`
with the SHA-256 fingerprint from step 1. Format: `AA:BB:CC:DD:...`

### 3. Deploy to server
The file must be accessible at:
```
https://www.shortfactory.shop/.well-known/assetlinks.json
```

Deploy:
```bash
# On the server:
mkdir -p /var/www/vhosts/shortfactory.shop/httpdocs/.well-known/
cp assetlinks.json /var/www/vhosts/shortfactory.shop/httpdocs/.well-known/assetlinks.json
```

### 4. Verify
```bash
curl https://www.shortfactory.shop/.well-known/assetlinks.json
```
Should return the JSON with your fingerprint.

Google also provides a verification tool:
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.shortfactory.shop&relation=delegate_permission/common.handle_all_urls

## Device gate note

The Girl creature (`index.html`) currently blocks mobile devices with a `throw 'DEVICE_GATE'`.
For the Play Store version, this gate needs to be removed or the TWA needs to launch
a mobile-safe version. Options:

1. Add a `?source=app` query param to the TWA launch URL and skip the gate when present
2. Create a separate `/alive/app-entry.html` that doesn't have the gate
3. Remove the gate entirely and make Girl responsive

Option 1 is the fastest — change `DEFAULT_URL` in the manifest to:
`https://www.shortfactory.shop/alive/?source=app`
Then add this to index.html before the device gate:
```javascript
if (new URLSearchParams(window.location.search).get('source') === 'app') {
  // Skip device gate — launched from Play Store TWA
} else {
  // existing device gate code
}
```

## Icons

The TWA needs PNG icons in the mipmap directories. Generate from the SVG:

```bash
# Using ImageMagick or similar:
convert icon-512.svg -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert icon-512.svg -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert icon-512.svg -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert icon-512.svg -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert icon-512.svg -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

Or use Android Studio's Image Asset wizard (right-click res → New → Image Asset).

## Version bumping

Before each Play Store upload, increment `versionCode` in `app/build.gradle`.
Play Store requires each upload to have a strictly higher versionCode.

## Architecture

```
User taps app icon
  → LauncherActivity.onCreate()
    → TrustedWebActivityIntentBuilder(LAUNCH_URI)
      → Chrome renders https://www.shortfactory.shop/alive/ fullscreen
        → No URL bar (if Digital Asset Links verify)
        → Service worker caches for offline
        → localStorage persists creature state
  → LauncherActivity.finish() (activity exits, Chrome handles everything)
```

The app is essentially a thin launcher — all the real code lives in the PWA.

#!/bin/bash
set -e

# EdgeWell APK Build Automator
echo "============================================="
echo "  EdgeWell Companion: Building Android APK   "
echo "============================================="

# 1. Ensure dependencies are installed
if [ ! -d "node_modules/@capacitor/core" ]; then
  echo "Installing Capacitor dependencies..."
  npm install @capacitor/core @capacitor/android
  npm install --save-dev @capacitor/cli
fi

# 2. Add Android platform if not present
if [ ! -d "android" ]; then
  echo "Adding Android platform..."
  npx cap add android
fi

# 3. Build web companion assets
echo "Building web companion UI..."
npx tsc -p tsconfig.build.json

# 4. Sync web assets to the native Android folder and compile APK
echo "Syncing assets and compiling APK..."
npx cap sync
cd android && ./gradlew assembleDebug && cp app/build/outputs/apk/debug/app-debug.apk ../edgewell-companion.apk
cd ..

echo "============================================="
echo "  Success! APK built at: ./edgewell-companion.apk"
echo "============================================="

#!/usr/bin/env bash
# Elsewhere · Apogeans: The Limit Breakers · NASA Space Apps Challenge 2026
#
# AI ASSISTANCE NOTICE
# AI (Anthropic's Claude) helped us analyze the immense amount of data behind this
# app and helped write and debug parts of this code. See README.md.
#
# Builds the Android APK from this repository.
# Needs: Python 3, Java, apktool (2.4+), and the Android build-tools (zipalign, apksigner).
# Usage: KEYSTORE=my.jks KEY_ALIAS=elsewhere ./scripts/build_apk.sh
set -euo pipefail
cd "$(dirname "$0")/.."
python3 src/shell/build_app.py                  # src/ -> index.html and android/assets/www/index.html
mkdir -p build
apktool b android -o build/unsigned.apk
zipalign -f -p 4 build/unsigned.apk build/aligned.apk
apksigner sign --ks "${KEYSTORE:?set KEYSTORE to your keystore}" --ks-key-alias "${KEY_ALIAS:-elsewhere}" \
  --out build/Elsewhere.apk build/aligned.apk
apksigner verify build/Elsewhere.apk && echo "Built build/Elsewhere.apk"

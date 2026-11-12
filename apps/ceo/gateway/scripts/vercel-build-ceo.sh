#!/usr/bin/env bash
# DL12D: Build Flutter and the same-origin Next.js Owner gateway as one Vercel app.
set -euo pipefail
GATEWAY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$GATEWAY_ROOT/../../.." && pwd)"
FLUTTER_APP="$REPO_ROOT/apps/ceo/flutter"
PUBLIC_APP="$GATEWAY_ROOT/public/ceo"
if [[ ! -f "$FLUTTER_APP/pubspec.yaml" ]]; then
  echo "DL12D: missing Flutter sources outside Next.js root. Enable sourceFilesOutsideRootDirectory." >&2
  exit 1
fi

# CI and manual prebuilt releases use this path only after a verified Flutter build.
if [[ "${FBMN_CEO_PREBUILT:-0}" == "1" ]]; then
  echo "DL12D: using CI-built Flutter assets."
else
  if ! command -v flutter >/dev/null 2>&1; then
    sdk_dir="${TMPDIR:-/tmp}/fbmn-flutter-3.47.9"
    if [[ ! -x "$sdk_dir/bin/flutter" ]]; then
      rm -rf "$sdk_dir"
      git clone --depth 1 --filter=blob:none --branch 3.47.9 \
        https://github.com/flutter/flutter.git "$sdk_dir"
    fi
    export PATH="$sdk_dir/bin:$PATH"
  fi
  export PUB_CACHE="${PUB_CACHE:-${HOME}/.pub-cache}"
  flutter --version
  (
    cd "$FLUTTER_APP"
    flutter config --enable-web
    flutter pub get
    flutter build web --release --pwa-strategy=none --base-href=/ceo/
  )
  rm -rf "$PUBLIC_APP"
  mkdir -p "$PUBLIC_APP"
  cp -a "$FLUTTER_APP/build/web/." "$PUBLIC_APP/"
fi

# Fail closed: never publish a gateway that redirects to a missing or wrong-base SPA.
test -s "$PUBLIC_APP/index.html" || { echo "Missing CEO Flutter index" >&2; exit 1; }
test -s "$PUBLIC_APP/flutter_bootstrap.js" || { echo "Missing CEO Flutter bootstrap" >&2; exit 1; }
test -s "$PUBLIC_APP/main.dart.js" || { echo "Missing CEO Flutter JS" >&2; exit 1; }
# Never let the legacy Flutter offline service worker steal /ceo/ from Push.
node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");if(/_flutter\\.loader\\.load\\(\\s*\\{\\s*serviceWorkerSettings\\s*:/.test(s)){console.error("CEO build contains competing Flutter SW registration");process.exit(1)}' "$PUBLIC_APP/flutter_bootstrap.js"
test -s "$PUBLIC_APP/push-sw.js" || { echo "Missing DL12C push worker" >&2; exit 1; }
test -s "$PUBLIC_APP/push_bridge.js" || { echo "Missing DL12C push bridge" >&2; exit 1; }
grep -Fq '<base href="/ceo/">' "$PUBLIC_APP/index.html" || {
  echo "Incorrect CEO Flutter base href" >&2; exit 1;
}
cd "$GATEWAY_ROOT"
npx next build

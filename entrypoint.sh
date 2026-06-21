#!/bin/sh
set -e

checksum_file="node_modules/.package-checksum"

ensure_lightningcss() {
  if node -e "require('lightningcss')" >/dev/null 2>&1; then
    return
  fi

  lightningcss_version="$(node -p "require('./node_modules/lightningcss/package.json').version")"

  case "$(node -p "process.arch")" in
    arm64) lightningcss_native="lightningcss-linux-arm64-musl" ;;
    x64) lightningcss_native="lightningcss-linux-x64-musl" ;;
    *) return ;;
  esac

  echo "Installing ${lightningcss_native}..."
  npm install --no-save --package-lock=false "${lightningcss_native}@${lightningcss_version}"
}

if [ -f package-lock.json ]; then
  package_checksum="$(cksum package.json package-lock.json)"
else
  package_checksum="$(cksum package.json)"
fi

if [ ! -f "$checksum_file" ] || ! printf '%s\n' "$package_checksum" | cmp -s "$checksum_file" -; then
  echo "Installing packages..."
  npm install
  mkdir -p node_modules
  if [ -f package-lock.json ]; then
    cksum package.json package-lock.json > "$checksum_file"
  else
    cksum package.json > "$checksum_file"
  fi
fi

ensure_lightningcss

exec "$@"

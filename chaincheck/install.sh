#!/bin/bash
set -e

REPO="TripleAze/chainguard"
BINARY="chaincheck"
INSTALL_DIR="/usr/local/bin"

usage() {
  echo "Usage: $0 [-b <install-dir>]"
  echo "  -b <install-dir>  Directory to install ${BINARY} (default: /usr/local/bin)"
  exit 1
}

while getopts "b:" opt; do
  case $opt in
    b)
      INSTALL_DIR="$OPTARG"
      ;;
    *)
      usage
      ;;
  esac
done

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH="amd64"
[ "$ARCH" = "aarch64" ] && ARCH="arm64"

VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"v\(.*\)".*/\1/')

URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY}_${OS}_${ARCH}.tar.gz"

echo "Installing chaincheck ${VERSION} for ${OS}/${ARCH}..."

# Create temp directory
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Download tarball
curl -sSfL "$URL" -o "$TMP_DIR/${BINARY}.tar.gz"

# Extract
tar -xz -f "$TMP_DIR/${BINARY}.tar.gz" -C "$TMP_DIR"

# Check if we can write to INSTALL_DIR
mkdir -p "$INSTALL_DIR"
if [ ! -w "$INSTALL_DIR" ]; then
  echo "Need sudo to install to ${INSTALL_DIR}, requesting privileges..."
  sudo cp "$TMP_DIR/$BINARY" "$INSTALL_DIR/"
  sudo chmod +x "$INSTALL_DIR/$BINARY"
else
  cp "$TMP_DIR/$BINARY" "$INSTALL_DIR/"
  chmod +x "$INSTALL_DIR/$BINARY"
fi

echo "✅ chaincheck ${VERSION} installed to $INSTALL_DIR/$BINARY"

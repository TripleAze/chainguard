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

# Check if we can write to INSTALL_DIR
if [ ! -w "$INSTALL_DIR" ]; then
  echo "Need sudo to install to ${INSTALL_DIR}, requesting privileges..."
  sudo mkdir -p "$INSTALL_DIR"
  curl -sSfL "$URL" | sudo tar -xz -C "$INSTALL_DIR" "$BINARY"
  sudo chmod +x "$INSTALL_DIR/$BINARY"
else
  mkdir -p "$INSTALL_DIR"
  curl -sSfL "$URL" | tar -xz -C "$INSTALL_DIR" "$BINARY"
  chmod +x "$INSTALL_DIR/$BINARY"
fi

echo "✅ chaincheck ${VERSION} installed to $INSTALL_DIR/$BINARY"

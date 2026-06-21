#!/bin/bash
set -e

REPO="TripleAze/chainguard"
BINARY="chaincheck"
INSTALL_DIR="${1:-/usr/local/bin}"

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH="amd64"
[ "$ARCH" = "aarch64" ] && ARCH="arm64"

VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | grep "chaincheck" | sed 's/.*"chaincheck\/\(.*\)".*/\1/')

URL="https://github.com/${REPO}/releases/download/chaincheck%2F${VERSION}/${BINARY}_${OS}_${ARCH}.tar.gz"

echo "Installing chaincheck ${VERSION} for ${OS}/${ARCH}..."
curl -sSfL "$URL" | tar -xz -C "$INSTALL_DIR" "$BINARY"
chmod +x "$INSTALL_DIR/$BINARY"
echo "✅ chaincheck ${VERSION} installed to $INSTALL_DIR/$BINARY"

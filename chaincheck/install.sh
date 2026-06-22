#!/bin/bash
set -e

# ─────────────────────────────────────────────
# chaincheck installer
# Usage: curl -sSfL <url> | sh
#        curl -sSfL <url> | sh -s -- -b /usr/local/bin
# ─────────────────────────────────────────────

REPO="TripleAze/chainguard"
BINARY="chaincheck"
INSTALL_DIR="/usr/local/bin"

# ── Colours ──────────────────────────────────
if [ -t 1 ]; then
  BOLD="\033[1m"
  DIM="\033[2m"
  GREEN="\033[32m"
  CYAN="\033[36m"
  YELLOW="\033[33m"
  RED="\033[31m"
  RESET="\033[0m"
else
  BOLD="" DIM="" GREEN="" CYAN="" YELLOW="" RED="" RESET=""
fi

# ── Helpers ───────────────────────────────────
info()    { printf "  ${CYAN}→${RESET}  %s\n" "$*"; }
success() { printf "  ${GREEN}✔${RESET}  %s\n" "$*"; }
warn()    { printf "  ${YELLOW}!${RESET}  %s\n" "$*"; }
error()   { printf "  ${RED}✘${RESET}  %s\n" "$*" >&2; exit 1; }
bold()    { printf "${BOLD}%s${RESET}\n" "$*"; }
dim()     { printf "${DIM}%s${RESET}\n" "$*"; }

# ── Usage ─────────────────────────────────────
usage() {
  echo ""
  echo "  Usage: curl -sSfL <url> | sh -s -- [-b <dir>]"
  echo ""
  echo "  Options:"
  echo "    -b <dir>   Installation directory (default: /usr/local/bin)"
  echo ""
  exit 1
}

while getopts "b:h" opt; do
  case $opt in
    b) INSTALL_DIR="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done

# ── Detect platform ───────────────────────────
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ]  && ARCH="amd64"
[ "$ARCH" = "aarch64" ] && ARCH="arm64"

case "$OS" in
  linux|darwin) ;;
  *) error "Unsupported OS: $OS. Please install manually from https://github.com/${REPO}/releases" ;;
esac

# ── Fetch latest version ──────────────────────
info "Fetching latest release..."
VERSION=$(curl -sf "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep '"tag_name"' \
  | sed 's/.*"v\(.*\)".*/\1/' \
  2>/dev/null)

[ -z "$VERSION" ] && error "Could not determine latest version. Check https://github.com/${REPO}/releases"

# ── Header ────────────────────────────────────
echo ""
bold "  ChainGuard · chaincheck installer"
dim  "  Supply chain security inspection for container images"
echo ""
info "Version:  v${VERSION}"
info "Platform: ${OS}/${ARCH}"
info "Target:   ${INSTALL_DIR}/${BINARY}"
echo ""

# ── Download ──────────────────────────────────
URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY}_${OS}_${ARCH}.tar.gz"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

info "Downloading..."
if ! curl -sSfL "$URL" -o "$TMP_DIR/${BINARY}.tar.gz"; then
  error "Download failed. Check that v${VERSION} supports ${OS}/${ARCH}."
fi

# ── Extract ───────────────────────────────────
tar -xzf "$TMP_DIR/${BINARY}.tar.gz" -C "$TMP_DIR"
[ -f "$TMP_DIR/$BINARY" ] || error "Binary not found in archive — unexpected structure."

# ── Install ───────────────────────────────────
mkdir -p "$INSTALL_DIR"

if [ -w "$INSTALL_DIR" ]; then
  cp "$TMP_DIR/$BINARY" "$INSTALL_DIR/"
  chmod +x "$INSTALL_DIR/$BINARY"
else
  warn "Requires elevated privileges — requesting sudo..."
  sudo cp "$TMP_DIR/$BINARY" "$INSTALL_DIR/"
  sudo chmod +x "$INSTALL_DIR/$BINARY"
fi

# ── Verify install ────────────────────────────
echo ""
if command -v "$BINARY" >/dev/null 2>&1; then
  INSTALLED_VERSION=$("$BINARY" --version 2>/dev/null | head -1 || echo "v${VERSION}")
  success "chaincheck v${VERSION} installed to ${INSTALL_DIR}/${BINARY}"
else
  warn "Installed to ${INSTALL_DIR}/${BINARY} but '${BINARY}' is not in your PATH."
  warn "Add to your shell config:  export PATH=\"\$PATH:${INSTALL_DIR}\""
fi

# ── Next steps ────────────────────────────────
echo ""
bold  "  Getting started:"
echo ""
printf "    Inspect an image:\n"
printf "    ${CYAN}chaincheck inspect ghcr.io/yourorg/yourapp:latest${RESET}\n"
echo ""
printf "    Enforce a specific signing identity:\n"
printf "    ${CYAN}chaincheck inspect <image> --cert-identity <identity>${RESET}\n"
echo ""
printf "    JSON output for scripting:\n"
printf "    ${CYAN}chaincheck inspect <image> --output json | jq .${RESET}\n"
echo ""
dim   "  Docs:  https://github.com/${REPO}"
dim   "  Usage: chaincheck --help"
echo ""

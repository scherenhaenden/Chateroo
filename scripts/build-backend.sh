#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Prepare paths
# Determine target triple if not provided by the Tauri build environment.
if [ -n "$TAURI_ENV_TARGET_TRIPLE" ]; then
  TARGET="$TAURI_ENV_TARGET_TRIPLE"
else
  ARCH="$(uname -m)"
  case "$ARCH" in
    arm64|aarch64) ARCH="aarch64" ;;
    x86_64)        ARCH="x86_64" ;;
    i386|i686)     ARCH="i686" ;;
  esac

  OS="$(uname -s)"
  case "$OS" in
    Linux*)   TARGET="${ARCH}-unknown-linux-gnu" ;;
    Darwin*)  TARGET="${ARCH}-apple-darwin" ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT*) TARGET="${ARCH}-pc-windows-msvc" ;;
    *)        TARGET="${ARCH}-unknown-linux-gnu" ;;
  esac
fi

BIN_DIR="../../src-tauri/binaries"

echo "Creating backend binary for target $TARGET..."

# Copy the built backend and dependencies
mkdir -p "$BIN_DIR"
cp -r dist "$BIN_DIR/backend-dist"
cp package.json "$BIN_DIR/"
cp -r node_modules "$BIN_DIR/" 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script with the expected tauri naming convention
# The name should match what's configured in tauri.conf.json ("binaries/backend")
cat > "$BIN_DIR/backend" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
EOF

chmod +x "$BIN_DIR/backend"

echo "Backend binary prepared for bundling ($BIN_DIR/backend)"

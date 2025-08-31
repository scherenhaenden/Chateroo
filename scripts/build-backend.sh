#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Prepare paths
if [ -z "$TAURI_ENV_TARGET_TRIPLE" ]; then
  UNAME_S="$(uname -s)"
  UNAME_M="$(uname -m)"
  if [ "$UNAME_S" = "Darwin" ]; then
    if [ "$UNAME_M" = "x86_64" ]; then
      TARGET="x86_64-apple-darwin"
    elif [ "$UNAME_M" = "arm64" ]; then
      TARGET="aarch64-apple-darwin"
    else
      TARGET="${UNAME_M}-apple-darwin"
    fi
  else
    TARGET="${UNAME_M}-unknown-linux-gnu"
  fi
else
  TARGET="$TAURI_ENV_TARGET_TRIPLE"
fi
BIN_DIR="../../src-tauri/binaries"

echo "Creating backend binary for target $TARGET..."

# Copy the built backend and dependencies
mkdir -p "$BIN_DIR"
cp -r dist "$BIN_DIR/backend-dist"
cp package.json "$BIN_DIR/"
cp -r node_modules "$BIN_DIR/" 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script with the expected tauri naming convention
cat > "$BIN_DIR/backend-$TARGET" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
${NODE_PATH_OVERRIDE:-/usr/bin/env node} backend-dist/main.js
EOF

chmod +x "$BIN_DIR/backend-$TARGET"

echo "Backend binary prepared for bundling ($BIN_DIR/backend-$TARGET)"

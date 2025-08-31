#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Prepare paths
if [ -n "$TAURI_ENV_TARGET_TRIPLE" ]; then
  TARGET="$TAURI_ENV_TARGET_TRIPLE"
else
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  if [ "$OS" = "Darwin" ]; then
    case "$ARCH" in
      x86_64)
        TARGET="x86_64-apple-darwin"
        ;;
      arm64)
        TARGET="aarch64-apple-darwin"
        ;;
      *)
        TARGET="${ARCH}-apple-darwin"
        ;;
    esac
  else
    TARGET="${ARCH}-unknown-linux-gnu"
  fi
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
NODE_BIN="${NODE_PATH_OVERRIDE:-node}"
/usr/bin/env "$NODE_BIN" backend-dist/main.js
EOF

chmod +x "$BIN_DIR/backend-$TARGET"

echo "Backend binary prepared for bundling ($BIN_DIR/backend-$TARGET)"

#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Determine target triple for naming the sidecar.
# Tauri sets TAURI_ENV_TARGET_TRIPLE during bundling. Fall back to the host
# triple from `rustc` when it's not provided (e.g. during local runs).
TARGET="${TAURI_ENV_TARGET_TRIPLE}"
if [ -z "$TARGET" ]; then
  TARGET=$(rustc -vV | sed -n 's/^host: //p')
fi

# Create binary directory in the Tauri project
BIN_DIR="../../src-tauri/binaries"
mkdir -p "$BIN_DIR"

# Copy the compiled backend and its dependencies
cp -r dist "$BIN_DIR/backend-dist"
cp package.json "$BIN_DIR/"
cp -r node_modules "$BIN_DIR/" 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script that Tauri treats as a sidecar.
cat > "$BIN_DIR/backend-$TARGET" <<'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
EOF

chmod +x "$BIN_DIR/backend-$TARGET"

echo "Backend binary prepared for bundling: backend-$TARGET"

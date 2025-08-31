#!/bin/bash
set -e

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend using the workspace so local dev dependencies are resolved
npm run --workspace=backend build

# Determine target triple for naming the sidecar. Tauri sets
# TAURI_ENV_TARGET_TRIPLE during bundling. Fall back to the host triple from
# `rustc` when it's not provided (e.g. during local runs).
TARGET="${TAURI_ENV_TARGET_TRIPLE}"
if [ -z "$TARGET" ]; then
  TARGET=$(rustc -vV | sed -n 's/^host: //p')
fi
echo "Target triple: $TARGET"

# Paths used throughout the script
BIN_DIR="src-tauri/binaries"
BACKEND_DIR="apps/backend"
mkdir -p "$BIN_DIR"

# Copy the compiled backend and its package manifest
cp -r "$BACKEND_DIR/dist" "$BIN_DIR/backend-dist"
cp "$BACKEND_DIR/package.json" "$BIN_DIR/"
# Try to copy lockfile if available for reproducible installs
cp "$BACKEND_DIR/package-lock.json" "$BIN_DIR/" 2>/dev/null || true

# Install only production dependencies inside the bundle directory
npm install --omit=dev --prefix "$BIN_DIR" >/dev/null 2>&1 || echo "Node modules will be installed in production"

# Bundle the Node runtime so the sidecar works without relying on the user's PATH
NODE_BIN="$(which node)"
cp "$NODE_BIN" "$BIN_DIR/node-$TARGET"

# Create a startup script that Tauri treats as a sidecar.
cat > "$BIN_DIR/backend-$TARGET" <<EOF
#!/bin/bash
DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "\$DIR"
./node-$TARGET backend-dist/main.js
EOF

chmod +x "$BIN_DIR/backend-$TARGET"
chmod +x "$BIN_DIR/node-$TARGET"

echo "Backend binary prepared for bundling: backend-$TARGET"

#!/bin/bash
set -e

# Build script for bundling the backend with the Tauri app.

echo "Building backend for Tauri bundle..."

# Build the backend (compiled TypeScript output lives in dist/)
cd apps/backend
npm run build

echo "Creating backend binary..."

# Determine the target triple expected by Tauri.  During a Tauri build the
# `TAURI_ENV_TARGET_TRIPLE` environment variable is provided.  When running the
# script standalone we fall back to the current machine's triple.
TARGET_TRIPLE=${TAURI_ENV_TARGET_TRIPLE:-"$(uname -m)-unknown-linux-gnu"}

# Copy the built backend into the binaries directory that Tauri inspects.
mkdir -p ../../src-tauri/binaries
cp -r dist ../../src-tauri/binaries/backend-dist
cp package.json ../../src-tauri/binaries/
cp -r node_modules ../../src-tauri/binaries/ 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script that launches the compiled backend.
cat > ../../src-tauri/binaries/backend <<'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
EOF

chmod +x ../../src-tauri/binaries/backend

# Tauri expects sidecar binaries to be suffixed with the target triple. Create
# a copy with the appropriate name so the build does not fail with missing
# resource errors.
cp ../../src-tauri/binaries/backend "../../src-tauri/binaries/backend-${TARGET_TRIPLE}"
chmod +x "../../src-tauri/binaries/backend-${TARGET_TRIPLE}"

echo "Backend binary prepared for bundling"

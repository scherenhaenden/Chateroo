#!/bin/bash

# Build script for bundling the backend with the Tauri application.
# It copies the compiled NestJS backend into the `src-tauri/binaries`
# folder and creates an architecture specific sidecar executable that
# Tauri expects during bundling.

set -e

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

echo "Creating backend binary..."

# Prepare the binaries directory inside `src-tauri`
mkdir -p ../../src-tauri/binaries
cp -r dist ../../src-tauri/binaries/backend-dist
cp package.json ../../src-tauri/binaries/
cp -r node_modules ../../src-tauri/binaries/ 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script that launches the compiled backend
cat > ../../src-tauri/binaries/backend <<'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
EOF

chmod +x ../../src-tauri/binaries/backend

# Tauri looks for a sidecar named `backend-<target-triple>` when packaging.
# Create an architecture specific copy so the bundler can find it.
TARGET_TRIPLE=$(rustc -vV | sed -n 's/^host: //p')
cp ../../src-tauri/binaries/backend "../../src-tauri/binaries/backend-$TARGET_TRIPLE"

echo "Backend binary prepared for bundling"

#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Create binary using pkg (we'll need to install this)
echo "Creating backend binary..."

# For now, we'll use a simple approach - copy the built backend
mkdir -p ../../src-tauri/binaries
cp -r dist ../../src-tauri/binaries/backend-dist
cp package.json ../../src-tauri/binaries/
cp -r node_modules ../../src-tauri/binaries/ 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script
cat > ../../src-tauri/binaries/backend << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
EOF

chmod +x ../../src-tauri/binaries/backend

echo "Backend binary prepared for bundling"

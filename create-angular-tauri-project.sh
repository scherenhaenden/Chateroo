#!/bin/bash

# Angular + Tauri + NestJS Project Generator
# Creates a new project with the same structure as this one but generic

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <project-name> [description]"
    echo "Example: $0 my-app \"My awesome desktop application\""
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DESCRIPTION="${2:-Desktop application built with Angular, Tauri and NestJS}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Creating new Angular + Tauri + NestJS project: $PROJECT_NAME"

# Check if project directory already exists
if [ -d "$PROJECT_NAME" ]; then
    echo "❌ Error: Directory '$PROJECT_NAME' already exists"
    exit 1
fi

# Create project directory
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

echo "📦 Initializing workspace package.json..."

# Create root package.json
cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "type": "commonjs",
  "description": "$PROJECT_DESCRIPTION",
  "keywords": [
    "angular",
    "tauri",
    "nestjs",
    "desktop",
    "app"
  ],
  "author": "$(git config user.name) <$(git config user.email)>",
  "license": "MIT",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm:dev:frontend\" \"npm:dev:backend\"",
    "dev:frontend": "npm run --workspace=frontend start",
    "dev:backend": "npm run --workspace=backend start:dev",
    "build:frontend": "npm run --workspace=frontend build",
    "build:backend": "bash scripts/build-backend.sh",
    "build:all": "npm run build:frontend && npm run build:backend",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.7.1",
    "concurrently": "^9.2.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.7.0",
    "tauri-plugin-store-api": "^0.0.0"
  }
}
EOF

echo "🔧 Installing root dependencies..."
npm install

echo "📁 Creating workspace structure..."
mkdir -p apps scripts src-tauri/src src-tauri/icons src-tauri/capabilities

echo "🅰️  Setting up Angular frontend..."
cd apps

# Create Angular app
npx @angular/cli@latest new frontend --routing --style=css --skip-git --package-manager=npm

cd frontend

# Update Angular package.json with common dependencies
cat > package.json << EOF
{
  "name": "frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "prettier": {
    "overrides": [
      {
        "files": "*.html",
        "options": {
          "parser": "angular"
        }
      }
    ]
  },
  "private": true,
  "dependencies": {
    "@angular/common": "^20.1.0",
    "@angular/compiler": "^20.1.0",
    "@angular/core": "^20.1.0",
    "@angular/forms": "^20.1.0",
    "@angular/platform-browser": "^20.1.0",
    "@angular/router": "^20.1.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular/build": "^20.1.5",
    "@angular/cli": "^20.1.5",
    "@angular/compiler-cli": "^20.1.0",
    "@types/jasmine": "~5.1.0",
    "autoprefixer": "^10.4.21",
    "jasmine-core": "~5.8.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "postcss": "^8.5.6",
    "prettier": "^3.4.2",
    "tailwindcss": "^3.4.16",
    "typescript": "~5.7.0"
  }
}
EOF

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Update tailwind.config.js
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Update styles.css with basic styling
cat > src/styles.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
}

/* Common utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}
EOF

# Create basic app component
cat > src/app/app.component.html << EOF
<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm border-b">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
        <div class="flex space-x-4">
          <a routerLink="/" class="text-gray-600 hover:text-gray-900">Home</a>
        </div>
      </div>
    </div>
  </nav>

  <main class="container mx-auto px-4 py-8">
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to {{ title }}!</h2>
      <p class="text-gray-600 mb-6">
        This is a desktop application built with Angular, NestJS, and Tauri.
        Start building your amazing application here!
      </p>

      <div class="flex gap-4">
        <button class="btn btn-primary" (click)="testBackend()">
          Test Backend Connection
        </button>
      </div>

      <div class="mt-6" *ngIf="backendStatus">
        <div class="p-4 rounded bg-green-50 border border-green-200">
          <p class="text-green-800">✅ Backend Status: {{ backendStatus }}</p>
        </div>
      </div>
    </div>

    <router-outlet></router-outlet>
  </main>
</div>
EOF

# Create basic app component TypeScript
cat > src/app/app.component.ts << EOF
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = '$PROJECT_NAME';
  backendStatus: string = '';

  constructor(private http: HttpClient) {}

  testBackend() {
    this.http.get<any>('http://localhost:3001/api/health').subscribe({
      next: (response) => {
        this.backendStatus = response.status + ' - ' + new Date(response.timestamp).toLocaleString();
      },
      error: (error) => {
        this.backendStatus = 'Connection failed - Make sure backend is running';
        console.error('Backend connection failed:', error);
      }
    });
  }
}
EOF

# Create empty app component CSS
touch src/app/app.component.css

# Create types for Tauri
mkdir -p src/types
cat > src/types/tauri-plugin-store-api.d.ts << EOF
declare module 'tauri-plugin-store-api' {
  export interface Store {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    save(): Promise<void>;
  }

  export class Store {
    constructor(path: string);
  }
}
EOF

echo "🟢 Installing frontend dependencies..."
npm install

cd ..

echo "🏗️  Setting up NestJS backend..."
# Create NestJS app
npx @nestjs/cli@latest new backend --package-manager npm --skip-git

cd backend

# Update backend package.json
cat > package.json << EOF
{
  "name": "backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/axios": "^4.0.1",
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.3",
    "tsconfig-paths": "^4.2.5",
    "typescript": "^5.7.2"
  }
}
EOF

echo "🟢 Installing backend dependencies..."
npm install

# Create basic API controller
cat > src/api.controller.ts << EOF
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('health')
  health() {
    return this.apiService.getHealth();
  }

  @Post('data')
  handleData(@Body() data: any) {
    return this.apiService.processData(data);
  }

  @Get('info')
  getInfo() {
    return this.apiService.getAppInfo();
  }
}
EOF

# Create API service
cat > src/api.service.ts << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'API Backend'
    };
  }

  processData(data: any) {
    // Process your data here
    return {
      message: 'Data processed successfully',
      receivedData: data,
      timestamp: new Date().toISOString()
    };
  }

  getAppInfo() {
    return {
      name: '$PROJECT_NAME',
      version: '1.0.0',
      description: '$PROJECT_DESCRIPTION',
      timestamp: new Date().toISOString()
    };
  }
}
EOF

# Create API module
cat > src/api.module.ts << EOF
import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
EOF

# Update app.module.ts
cat > src/app.module.ts << EOF
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api.module';

@Module({
  imports: [ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF

# Update main.ts to enable CORS
cat > src/main.ts << EOF
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'tauri://localhost'],
    credentials: true,
  });

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
}
bootstrap();
EOF

cd ../..

echo "🦀 Setting up Tauri..."

# Initialize Tauri
npm run tauri init -- --app-name "$PROJECT_NAME" --window-title "$PROJECT_NAME" --dist-dir "../apps/frontend/dist/frontend" --dev-url "http://localhost:4200" --before-dev-command "npm run dev:frontend" --before-build-command "npm run build:frontend"

# Update tauri.conf.json
cat > src-tauri/tauri.conf.json << EOF
{
  "\$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "$PROJECT_NAME",
  "version": "1.0.0",
  "identifier": "com.${PROJECT_NAME,,}.app",
  "build": {
    "frontendDist": "../apps/frontend/dist/frontend",
    "devUrl": "http://localhost:4200",
    "beforeDevCommand": "npm run dev:frontend",
    "beforeBuildCommand": "npm run build:frontend"
  },
  "app": {
    "windows": [
      {
        "title": "$PROJECT_NAME",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "center": true,
        "minWidth": 800,
        "minHeight": 600
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http: ws: wss:;"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "externalBin": [
      "binaries/backend"
    ]
  }
}
EOF

# Update Cargo.toml
cat > src-tauri/Cargo.toml << EOF
[package]
name = "app"
version = "1.0.0"
description = "$PROJECT_DESCRIPTION"
authors = ["$(git config user.name) <$(git config user.email)>"]
license = "MIT"
repository = ""
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.3.1", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.7.0", features = [] }
tauri-plugin-log = "2"
tauri-plugin-store = "2"
EOF

# Create build script for backend bundling
cat > scripts/build-backend.sh << 'EOF'
#!/bin/bash

# Build script for bundling the backend with Tauri app

echo "Building backend for Tauri bundle..."

# Build the backend
cd apps/backend
npm run build

# Prepare paths
TARGET="${TAURI_ENV_TARGET_TRIPLE:-$(uname -m)-unknown-linux-gnu}"
BIN_DIR="../../src-tauri/binaries"

echo "Creating backend binary for target $TARGET..."

# Copy the built backend and dependencies
mkdir -p "$BIN_DIR"
cp -r dist "$BIN_DIR/backend-dist"
cp package.json "$BIN_DIR/"
cp -r node_modules "$BIN_DIR/" 2>/dev/null || echo "Node modules will be installed in production"

# Create a startup script with the expected tauri naming convention
cat > "$BIN_DIR/backend-$TARGET" << 'INNER_EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"
node backend-dist/main.js
INNER_EOF

chmod +x "$BIN_DIR/backend-$TARGET"

echo "Backend binary prepared for bundling ($BIN_DIR/backend-$TARGET)"
EOF

chmod +x scripts/build-backend.sh

# Copy icons from original project if they exist
echo "🎨 Copying icons..."
if [ -d "$SCRIPT_DIR/src-tauri/icons" ]; then
    cp "$SCRIPT_DIR/src-tauri/icons"/* src-tauri/icons/ 2>/dev/null || echo "No icons to copy"
else
    echo "⚠️  No icons found - add your own icons to src-tauri/icons/"
fi

# Create basic README
cat > README.md << EOF
# $PROJECT_NAME

$PROJECT_DESCRIPTION

## 🏗️ Architecture

This project uses a modern desktop application stack:

- **Frontend**: Angular with Tailwind CSS
- **Backend**: NestJS API server
- **Desktop**: Tauri (Rust-based)
- **Workspace**: npm workspaces for monorepo management

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm
- Rust toolchain (for Tauri)
- Git

### Development

\`\`\`bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev

# Start Tauri in development mode
npm run tauri:dev
\`\`\`

### Building for Production

\`\`\`bash
# Build everything
npm run build:all

# Build Tauri app for distribution
npm run tauri:build
\`\`\`

## 📁 Project Structure

\`\`\`
├── apps/
│   ├── frontend/          # Angular application
│   └── backend/           # NestJS API server
├── src-tauri/             # Tauri configuration and Rust code
├── scripts/               # Build and utility scripts
└── package.json           # Workspace configuration
\`\`\`

## 🛠️ Development Guide

### Frontend (Angular)

The frontend is located in \`apps/frontend/\`. It includes:

- Angular 20+ with standalone components
- Tailwind CSS for styling
- Basic routing setup
- HTTP client for backend communication

### Backend (NestJS)

The backend is located in \`apps/backend/\`. It provides:

- RESTful API endpoints
- CORS configuration for frontend
- Basic health check endpoints
- Modular architecture

### Desktop (Tauri)

Tauri configuration is in \`src-tauri/\`. Features:

- Cross-platform desktop builds
- Secure frontend-backend communication
- Native system integration capabilities
- Bundled backend for standalone distribution

## 🔧 Customization

1. **Add Features**: Extend the Angular frontend and NestJS backend
2. **Styling**: Modify Tailwind configuration in \`apps/frontend/tailwind.config.js\`
3. **Icons**: Replace icons in \`src-tauri/icons/\`
4. **Window Settings**: Update \`src-tauri/tauri.conf.json\`

## 📝 Available Scripts

- \`npm run dev\` - Start frontend and backend in development
- \`npm run dev:frontend\` - Start only frontend
- \`npm run dev:backend\` - Start only backend
- \`npm run build:all\` - Build both frontend and backend
- \`npm run tauri:dev\` - Start Tauri in development mode
- \`npm run tauri:build\` - Build Tauri app for production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
EOF

# Create basic gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
build/
**/dist/
**/build/

# Tauri
src-tauri/target/
src-tauri/binaries/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log
EOF

# Initialize git repository
git init
git add .
git commit -m "Initial commit: $PROJECT_NAME project created"

echo "✅ Project '$PROJECT_NAME' created successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npm run dev                  # Start development servers"
echo "3. npm run tauri:dev           # Start Tauri development (in new terminal)"
echo "4. npm run tauri:build         # Build for production"
echo ""
echo "📁 Project structure:"
echo "├── apps/"
echo "│   ├── frontend/              # Angular app"
echo "│   └── backend/               # NestJS API"
echo "├── src-tauri/                 # Tauri configuration"
echo "├── scripts/                   # Build scripts"
echo "└── package.json               # Workspace configuration"
echo ""
echo "🔧 Start developing by:"
echo "- Adding your UI components in apps/frontend/src/app/"
echo "- Implementing your API in apps/backend/src/"
echo "- Customizing Tauri settings in src-tauri/tauri.conf.json"
echo "- Adding your own icons to src-tauri/icons/"

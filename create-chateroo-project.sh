#!/bin/bash

# Chateroo Project Generator
# Creates a new Tauri + Angular + NestJS project identical to this one

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <project-name>"
    echo "Example: $0 my-chat-app"
    exit 1
fi

PROJECT_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Creating new Chateroo-like project: $PROJECT_NAME"

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
  "description": "AI Chat Assistant with conversational memory",
  "keywords": [
    "ai",
    "chat",
    "assistant",
    "tauri",
    "desktop"
  ],
  "author": "$(git config user.name) <$(git config user.email)>",
  "license": "UNLICENSED",
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

# Update Angular package.json
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
    "dompurify": "^3.2.6",
    "fabric": "^6.7.1",
    "marked": "^16.1.2",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular/build": "^20.1.5",
    "@angular/cli": "^20.1.5",
    "@angular/compiler-cli": "^20.1.0",
    "@types/dompurify": "^3.0.5",
    "@types/fabric": "^5.3.10",
    "@types/jasmine": "~5.1.0",
    "@types/marked": "^5.0.2",
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

# Update styles.css
cat > src/styles.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

.chat-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.message.user {
  background-color: #3b82f6;
  color: white;
  margin-left: 2rem;
}

.message.assistant {
  background-color: white;
  border: 1px solid #e5e7eb;
  margin-right: 2rem;
}
EOF

# Create Tauri types
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

# Create basic chat controller
cat > src/chat.controller.ts << EOF
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() request: ChatRequest) {
    return await this.chatService.processMessage(request);
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
EOF

# Create chat service
cat > src/chat.service.ts << EOF
import { Injectable } from '@nestjs/common';
import { ChatRequest, ChatMessage } from './chat.controller';

@Injectable()
export class ChatService {
  async processMessage(request: ChatRequest): Promise<ChatMessage> {
    // Basic echo response - replace with actual AI integration
    const response: ChatMessage = {
      role: 'assistant',
      content: \`You said: "\${request.message}". This is a basic echo response. Integrate your AI service here.\`,
      timestamp: new Date().toISOString(),
    };

    return response;
  }
}
EOF

# Create chat module
cat > src/chat.module.ts << EOF
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
EOF

# Update app.module.ts
cat > src/app.module.ts << EOF
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat.module';

@Module({
  imports: [ChatModule],
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
npm run tauri init -- --app-name "$PROJECT_NAME" --window-title "$PROJECT_NAME - AI Chat Assistant" --dist-dir "../apps/frontend/dist/frontend" --dev-url "http://localhost:4200" --before-dev-command "npm run dev:frontend" --before-build-command "npm run build:frontend"

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
        "title": "$PROJECT_NAME - AI Chat Assistant",
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
description = "$PROJECT_NAME - AI Chat Assistant with conversational memory"
authors = ["$(git config user.name) <$(git config user.email)>"]
license = "UNLICENSED"
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

# Create basic Tauri icons (you'll need to replace with actual icons)
echo "🎨 Creating placeholder icons (replace with your own)..."
mkdir -p src-tauri/icons

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
git commit -m "Initial commit: $PROJECT_NAME project setup"

echo "✅ Project '$PROJECT_NAME' created successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. Add your own icons to src-tauri/icons/"
echo "3. npm run dev                  # Start development"
echo "4. npm run tauri:dev           # Start Tauri development"
echo "5. npm run tauri:build         # Build for production"
echo ""
echo "📁 Project structure:"
echo "├── apps/"
echo "│   ├── frontend/              # Angular app"
echo "│   └── backend/               # NestJS API"
echo "├── src-tauri/                 # Tauri configuration"
echo "├── scripts/                   # Build scripts"
echo "└── package.json               # Workspace configuration"
echo ""
echo "🔧 Customize your project by:"
echo "- Adding AI integrations in apps/backend/src/chat.service.ts"
echo "- Implementing UI components in apps/frontend/src/app/"
echo "- Updating Tauri configuration in src-tauri/tauri.conf.json"
EOF

#!/bin/bash

# Angular + Tauri + NestJS Project Generator
# Creates a workspace structure identical to Chateroo with apps/ folder structure

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <project-name> [description]"
    echo "Example: $0 my-app \"My awesome desktop application\""
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DESCRIPTION="${2:-Desktop application built with Angular, Tauri and NestJS}"

echo "🚀 Creating Angular + Tauri + NestJS project: $PROJECT_NAME"

# Check if project directory already exists
if [ -d "$PROJECT_NAME" ]; then
    echo "❌ Error: Directory '$PROJECT_NAME' already exists"
    exit 1
fi

# Create project structure
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create apps directory structure (exactly like Chateroo)
mkdir -p apps/frontend/src/app/{core,models}
mkdir -p apps/frontend/src/types
mkdir -p apps/frontend/public
mkdir -p apps/backend/src/{ai-engine,dtos}
mkdir -p apps/backend/src/ai-engine/{domains/open-router,models}
mkdir -p apps/backend/test
mkdir -p scripts
mkdir -p src-tauri/{src,icons,capabilities}

echo "📦 Setting up root package.json..."
# Create root package.json (identical to Chateroo structure)
cat > package.json << EOF
{
  "name": "${PROJECT_NAME,,}",
  "version": "1.0.0",
  "type": "commonjs",
  "description": "$PROJECT_DESCRIPTION",
  "keywords": [
    "ai",
    "chat",
    "assistant",
    "tauri",
    "desktop"
  ],
  "author": "Developer <dev@example.com>",
  "license": "UNLICENSED",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm:dev:frontend\" \"npm:dev:backend\"",
    "dev:frontend": "npm run --workspace=frontend start",
    "dev:backend": "npm run --workspace=backend start:dev",
    "dev:desktop": "npm run tauri:dev",
    "dev:web": "npm run dev:frontend",
    "build:frontend": "npm run --workspace=frontend build",
    "build:backend": "bash scripts/build-backend.sh",
    "build:all": "npm run build:frontend && npm run build:backend",
    "build:web": "npm run build:frontend",
    "build:desktop": "npm run build:all && npm run tauri:build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug",
    "install:all": "npm install && npm install --workspace=frontend && npm install --workspace=backend",
    "clean": "rm -rf node_modules apps/*/node_modules apps/*/dist",
    "test": "npm run --workspace=backend test && npm run --workspace=frontend test",
    "lint": "npm run --workspace=backend lint && npm run --workspace=frontend lint"
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

echo "🏗️ Setting up Angular frontend..."
# Create frontend package.json
cat > apps/frontend/package.json << EOF
{
  "name": "frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@types/jasmine": "~5.1.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "~5.2.0"
  }
}
EOF

# Create Angular workspace files
cat > apps/frontend/angular.json << EOF
{
  "\$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "frontend": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "css"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": [],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "public"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "frontend:build:production"
            },
            "development": {
              "buildTarget": "frontend:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": [],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              "src/favicon.ico",
              "public"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}
EOF

# Frontend tsconfig files
cat > apps/frontend/tsconfig.json << EOF
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
EOF

cat > apps/frontend/tsconfig.app.json << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}
EOF

cat > apps/frontend/tsconfig.spec.json << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
EOF

# Create Tailwind config
cat > apps/frontend/tailwind.config.js << EOF
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

# Frontend source files
cat > apps/frontend/src/index.html << EOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>$PROJECT_NAME</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
EOF

cat > apps/frontend/src/main.ts << EOF
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
EOF

cat > apps/frontend/src/styles.css << EOF
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

# Frontend app files
cat > apps/frontend/src/app/app.config.ts << EOF
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
EOF

cat > apps/frontend/src/app/app.routes.ts << EOF
import { Routes } from '@angular/router';

export const routes: Routes = [];
EOF

cat > apps/frontend/src/app/app.component.ts << EOF
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: \`
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
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
  \`,
  styles: []
})
export class AppComponent {
  title = '$PROJECT_NAME';
  backendStatus: string = '';

  constructor(private http: HttpClient) {}

  testBackend() {
    this.http.get<any>('http://localhost:3000/api/health').subscribe({
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

cat > apps/frontend/src/app/app.spec.ts << EOF
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('$PROJECT_NAME');
  });
});
EOF

# Create types file
cat > apps/frontend/src/types/tauri-plugin-store-api.d.ts << EOF
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

# Frontend public files
cat > apps/frontend/public/favicon.ico << EOF
EOF

echo "🏗️ Setting up NestJS backend..."
# Create backend package.json (like Chateroo)
cat > apps/backend/package.json << EOF
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
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.1",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\\\.spec\\\\.ts$",
    "transform": {
      "^.+\\\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF

# Backend configuration files
cat > apps/backend/nest-cli.json << EOF
{
  "\$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

cat > apps/backend/tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

cat > apps/backend/tsconfig.build.json << EOF
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
EOF

# Backend source files
cat > apps/backend/src/main.ts << EOF
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'tauri://localhost'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('🚀 Backend server running on http://localhost:3000/api');
}
bootstrap();
EOF

cat > apps/backend/src/app.module.ts << EOF
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

cat > apps/backend/src/app.controller.ts << EOF
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '$PROJECT_NAME Backend'
    };
  }
}
EOF

cat > apps/backend/src/app.service.ts << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World from $PROJECT_NAME Backend!';
  }
}
EOF

cat > apps/backend/src/app.controller.spec.ts << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World from $PROJECT_NAME Backend!');
    });
  });
});
EOF

# Chat module (like Chateroo structure)
cat > apps/backend/src/chat.module.ts << EOF
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
EOF

cat > apps/backend/src/chat.controller.ts << EOF
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dtos/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() chatRequest: ChatRequestDto) {
    return this.chatService.processMessage(chatRequest);
  }

  @Get('history')
  getHistory() {
    return this.chatService.getHistory();
  }
}
EOF

cat > apps/backend/src/chat.service.ts << EOF
import { Injectable } from '@nestjs/common';
import { ChatRequestDto } from './dtos/chat.dto';

@Injectable()
export class ChatService {
  private messages: any[] = [];

  async processMessage(chatRequest: ChatRequestDto) {
    // Store user message
    this.messages.push({
      role: 'user',
      content: chatRequest.message,
      timestamp: new Date().toISOString()
    });

    // Generate simple response (replace with AI engine later)
    const response = \`Hello! You said: "\${chatRequest.message}"\`;

    this.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    return {
      message: response,
      timestamp: new Date().toISOString()
    };
  }

  getHistory() {
    return this.messages;
  }
}
EOF

# DTOs
cat > apps/backend/src/dtos/chat.dto.ts << EOF
export class ChatRequestDto {
  message: string;
  engine?: string;
}

export class ChatResponseDto {
  message: string;
  timestamp: string;
}
EOF

# Backend tests
mkdir -p apps/backend/test
cat > apps/backend/test/app.e2e-spec.ts << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World from $PROJECT_NAME Backend!');
  });
});
EOF

cat > apps/backend/test/jest-e2e.json << EOF
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
EOF

echo "🔧 Setting up Tauri..."
# Initialize Tauri
npx tauri init --app-name "$PROJECT_NAME" --window-title "$PROJECT_NAME" --dist-dir "apps/frontend/dist" --dev-url "http://localhost:4200" --before-dev-command "npm run dev:frontend" --before-build-command "npm run build:frontend"

# Update tauri.conf.json
cat > src-tauri/tauri.conf.json << EOF
{
  "\$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "$PROJECT_NAME",
  "version": "1.0.0",
  "identifier": "com.${PROJECT_NAME,,}.app",
  "build": {
    "frontendDist": "apps/frontend/dist",
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
authors = ["Developer <dev@example.com>"]
license = "MIT"
repository = ""
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2", features = [] }
tauri-plugin-log = "2"
tauri-plugin-store = "2"
EOF

echo "📝 Creating build scripts..."
# Create build script (like Chateroo)
cat > scripts/build-backend.sh << 'EOF'
#!/bin/bash

echo "Building backend for production..."

cd apps/backend
npm run build

echo "Backend built successfully!"
EOF

chmod +x scripts/build-backend.sh

# Create README
cat > README.md << EOF
# $PROJECT_NAME

$PROJECT_DESCRIPTION

## 🏗️ Architecture

This project uses a workspace structure with:

- **Frontend**: Angular with Tailwind CSS in \`apps/frontend/\`
- **Backend**: NestJS API server in \`apps/backend/\`
- **Desktop**: Tauri (Rust-based) in \`src-tauri/\`
- **Workspace**: npm workspaces for monorepo management

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm
- Rust toolchain (for Tauri)
- Git

### Development

\`\`\`bash
# Install all dependencies
npm run install:all

# Start development servers (frontend + backend)
npm run dev

# Or start individually:
npm run dev:frontend    # Start only Angular frontend
npm run dev:backend     # Start only NestJS backend
npm run dev:desktop     # Start Tauri desktop app
npm run dev:web         # Start only web version

# Start Tauri in development mode
npm run tauri:dev
\`\`\`

### Building

\`\`\`bash
# Build everything
npm run build:all

# Build specific targets
npm run build:web       # Web version only
npm run build:desktop   # Desktop app

# Build Tauri app for distribution
npm run tauri:build
\`\`\`

## 📁 Project Structure

\`\`\`
├── apps/
│   ├── frontend/              # Angular application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/      # Core services
│   │   │   │   └── models/    # Data models
│   │   │   └── types/         # TypeScript definitions
│   │   └── package.json
│   └── backend/               # NestJS API server
│       ├── src/
│       │   ├── ai-engine/     # AI processing logic
│       │   └── dtos/          # Data transfer objects
│       └── package.json
├── scripts/                   # Build and utility scripts
├── src-tauri/                 # Tauri configuration and Rust code
└── package.json               # Root workspace configuration
\`\`\`

## 🛠️ Available Scripts

### Development
- \`npm run dev\` - Start frontend and backend concurrently
- \`npm run dev:web\` - Start web version only (frontend)
- \`npm run dev:desktop\` - Start Tauri desktop app
- \`npm run tauri:dev\` - Start Tauri in development mode

### Building
- \`npm run build:all\` - Build both frontend and backend
- \`npm run build:web\` - Build web version
- \`npm run build:desktop\` - Build desktop version
- \`npm run tauri:build\` - Build Tauri app for distribution

### Utilities
- \`npm run install:all\` - Install all dependencies
- \`npm run clean\` - Clean all node_modules and dist folders
- \`npm run test\` - Run all tests
- \`npm run lint\` - Lint all code

## 🔧 Development Guide

### Adding Features

1. **Frontend Components**: Add to \`apps/frontend/src/app/\`
2. **Backend Services**: Add to \`apps/backend/src/\`
3. **Shared Types**: Add to \`apps/frontend/src/types/\`
4. **AI Engines**: Add to \`apps/backend/src/ai-engine/\`

### Workspace Commands

Each app can be run individually:

\`\`\`bash
# Run frontend commands
npm run --workspace=frontend start
npm run --workspace=frontend build
npm run --workspace=frontend test

# Run backend commands
npm run --workspace=backend start:dev
npm run --workspace=backend build
npm run --workspace=backend test
\`\`\`

## 📄 License

This project is licensed under the UNLICENSED License.
EOF

echo "🎯 Installing dependencies..."
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install
cd ../..

# Install backend dependencies
cd apps/backend
npm install
cd ../..

# Initialize git
git add .
git commit -m "Initial commit: $PROJECT_NAME project created"

echo "✅ Project '$PROJECT_NAME' created successfully!"
echo ""
echo "📁 Project structure (exactly like Chateroo):"
echo "├── apps/"
echo "│   ├── frontend/              # Angular app"
echo "│   └── backend/               # NestJS API"
echo "├── scripts/                   # Build scripts"
echo "├── src-tauri/                 # Tauri configuration"
echo "└── package.json               # Root workspace config"
echo ""
echo "🚀 Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npm run dev                 # Start both frontend + backend"
echo "3. npm run tauri:dev           # Start desktop app"
echo ""
echo "📝 Available build targets:"
echo "- npm run build:web            # Web version only"
echo "- npm run build:desktop        # Desktop app"
echo "- npm run build:all            # Everything"
echo ""
echo "🎯 Development modes:"
echo "- npm run dev:web              # Web development"
echo "- npm run dev:desktop          # Desktop development"
echo "- npm run dev                  # Full stack development"

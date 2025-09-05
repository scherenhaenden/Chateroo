# Chateroo Technical Documentation

## 1. Introduction

Chateroo is a cross‑platform desktop application that combines a modern web frontend, a modular backend service, and a lightweight desktop shell built with [Tauri](https://tauri.app/).  The goal of the project is to provide a unified chat interface capable of interacting with multiple AI providers while retaining conversation history locally.  This document describes the current state of the codebase, explains how the major pieces fit together, and provides sufficient technical background for developers who wish to extend or maintain the application.

The repository uses an npm workspace layout where each part of the system is contained in its own package under the `apps/` directory.  The frontend is a standalone Angular application.  The backend uses NestJS and exposes a REST API with optional Server‑Sent Events (SSE) for streaming responses.  A Rust‑based Tauri shell bundles the frontend and a compiled version of the backend into a single desktop distribution.

Throughout this documentation, file paths are given relative to the repository root.  TypeScript and Rust files are annotated using their native syntax.  The codebase is in active development; therefore, many parts should be considered experimental.

## 2. High‑Level Architecture

Chateroo is composed of three major subsystems:

1. **Frontend (`apps/frontend`)** – An Angular 20 application that provides the user interface.  It includes chat views, authentication mockups, file attachment support, canvas and live‑code experiment panes, and various settings panes.
2. **Backend (`apps/backend`)** – A NestJS server that exposes a REST API for sending messages to different AI providers.  It manages provider specific engines, routes requests to them, and normalizes their responses.  The backend also exposes endpoints for retrieving available OpenRouter models and providers.
3. **Tauri Shell (`src-tauri`)** – A Rust binary that embeds the frontend in a native window and runs the backend as an external process.  The Tauri layer also provides persistent storage and logging plugins.

The application follows a client–server model: the Angular client communicates with the NestJS backend through HTTP.  In development, the backend runs separately on `localhost:3000`.  In a packaged application, the backend is bundled as a separate binary and launched by Tauri at startup.  The frontend is built into static assets and served by Tauri.

## 3. Repository Layout

```
Chateroo/
├── ai-chat-wrapper/            # Placeholder workspace
├── apps/
│   ├── backend/                # NestJS server
│   └── frontend/               # Angular client
├── node_modules/               # Workspace dependencies (hoisted)
├── scripts/                    # Helper scripts for builds
├── src-tauri/                  # Tauri desktop integration
├── index.html                  # Standalone HTML landing page
├── package.json                # Root workspace configuration
└── technical-documentation.md  # This document
```

The repository uses npm workspaces; commands run at the root can target a specific workspace through the `--workspace` flag (`npm run --workspace=backend start:dev`).

## 4. Building and Running

### 4.1 Development Mode

For regular development the frontend and backend are run separately.  Two scripts orchestrate this:

- `npm run dev:frontend` – starts the Angular development server on port 4200.
- `npm run dev:backend` – starts the NestJS server with file watching on port 3000.

A helper script `npm run dev` (defined in the root `package.json`) uses `concurrently` to launch both processes at once.  Developers can navigate to `http://localhost:4200` in their browser; the Angular app will communicate with `http://localhost:3000` for API requests.

### 4.2 Building for Distribution

The Tauri configuration (`src-tauri/tauri.conf.json`) defines two build commands:

- `npm run build:frontend` – compiles the Angular app to `apps/frontend/dist`.
- `npm run build:backend` – executes `scripts/build-backend.sh`, which builds the NestJS server and packages its output into `src-tauri/binaries` so it can be shipped alongside the Tauri binary.

After the workspace packages are built, `npm run tauri:build` bundles the application for the host platform.  Tauri will place the frontend static files into the final package and register the backend binary as an external executable launched on startup.

## 5. Backend Service

The backend is a NestJS application located under `apps/backend`.  It exposes several endpoints that forward requests to provider‑specific engines.  The primary components are:

### 5.1 Modules and Controllers

The entrypoint module `AppModule` simply imports the `ChatModule` and wires up the root controller:

```typescript
// apps/backend/src/app.module.ts
@Module({
  imports: [ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`ChatModule` is where most backend functionality lives.  It registers the `Chat` controller and service along with a collection of provider engines.  The module uses a custom injection token `AI_ENGINES` to make all engines available through the `EngineRegistryService`.

`ChatController` handles HTTP requests.  The main endpoint `POST /api/chat` accepts a `SendMessageDto` payload.  The controller detects whether the client wants a streaming response by inspecting the `stream` flag or the `Accept` header.  For streaming responses it sets up Server‑Sent Event headers and writes chunks to the open connection.  It also exposes two read‑only endpoints for retrieving data from the OpenRouter provider: `/api/chat/openrouter/models` and `/api/chat/openrouter/providers`.

`AppController` and `AppService` are simple examples from the NestJS scaffold.  They expose a single `GET /` endpoint that returns `"Hello World!"`.

### 5.2 Data Transfer Objects

`SendMessageDto` defines the shape of requests sent by the frontend.  It supports both legacy single‑prompt messages and a new message array format used to retain conversation history.  The DTO also allows for optional API keys, model names, streaming toggles, and file attachments.  Each attachment includes metadata and base64‑encoded content.

```typescript
// apps/backend/src/dtos/chat.dto.ts
export class SendMessageDto {
  provider: string;
  messages?: ChatMessage[];
  prompt?: string;      // legacy support
  apiKey?: string;
  model?: string;
  stream?: boolean;
  attachments?: { name: string; type: string; base64: string; size: number; }[];
}
```

### 5.3 Chat Service

`ChatService` orchestrates interactions with the engines.  When `sendMessage` is called, it looks up the appropriate engine using `EngineRegistryService`, extracts the prompt from either `payload.prompt` or the `messages` array, and passes a normalized `ChatPayload` to the engine.  The service also provides a streaming variant (`sendMessageStream`) implemented as an asynchronous generator that yields `StreamChunk` values.  If a provider engine does not implement `sendMessageStream`, the service automatically falls back to the non-streaming method.

Two utility methods, `getOpenRouterModels` and `getOpenRouterProviders`, expose provider data by delegating to the `OpenRouterEngine`.

### 5.4 Engine Registry

`EngineRegistryService` maintains a map of available engines indexed by provider name.  Engines are injected via the `AI_ENGINES` token, allowing new providers to be added simply by implementing the `AiApiEngine` interface and registering the implementation with the module.

### 5.5 Provider Engines

Each provider engine extends the abstract base class `AiApiEngine` and implements a `sendMessage` method, optionally providing `sendMessageStream` when streaming is supported.  The existing engines include:

- `DummyEngine` – Simulates a response without calling external services.  It is useful for testing and development without API keys.
- `OpenAiEngine` – Demonstrates how to interact with OpenAI's REST API.  It enhances the prompt with metadata about file attachments and validates the presence of an API key before “responding.”  The current implementation is a placeholder; real API calls are left as a TODO.
- `LmStudioEngine` – Connects to a locally running LM Studio server (default `http://localhost:1234/v1/chat/completions`).  The engine implements both standard and streaming modes.
- `MistralEngine`, `GeminiEngine`, `PerplexityEngine`, `GrokEngine`, and `DeepseekEngine` – Each of these engines sends a POST request to its respective provider API using the `HttpService`.  Errors are caught and converted into user‑friendly messages.
- `OpenRouterEngine` – Provides access to the [OpenRouter](https://openrouter.ai) marketplace.  In addition to sending chat completions, it can list available models (`listModels`) and providers (`listProviders`).  The `sendMessage` method also handles a range of OpenRouter‑specific errors, such as invalid API keys or data policy restrictions.

These engines demonstrate a consistent pattern: construct request headers (often with bearer authorization), prepare a request body containing the model and messages, send the request via `HttpService`, parse the response, and handle errors gracefully.  Streaming engines parse line‑delimited JSON chunks and yield content as it becomes available.

### 5.6 Testing

The backend includes a small Jest test suite.  `app.controller.spec.ts` verifies that the root controller returns `"Hello World!"`.  The file `ai-engine/new-engines.spec.ts` uses parameterized tests to verify that each engine sends messages with the correct headers and handles failures by returning a friendly error string.  `openrouter.engine.spec.ts` tests model retrieval and custom model usage.  Tests can be run via `npm test --workspace=backend`, though a working Node environment with Jest is required.

### 5.7 Swagger Documentation

`main.ts` configures Swagger using `@nestjs/swagger`.  The documentation is served at `/api/docs` when the backend runs.  It documents endpoints under the `chat`, `providers`, and `app` tags.

## 6. Frontend Application

The frontend resides under `apps/frontend` and is a standard Angular project configured via `angular.json`.  It uses Tailwind CSS for styling and leverages standalone components (no NgModules).  Below are the key pieces.

### 6.1 Models

Two interfaces define the shape of domain data:

- `auth.model.ts` – Describes user accounts, sessions, and the overall authentication state.  Authentication is currently mocked on the client.
- `chat.model.ts` – Defines `ChatMessage`, `ChatAttachment`, `ChatOptions`, and `ChatSession` objects.  Messages track UI‑specific properties like `isLoading` or `canvasCode` in addition to the `role`/`content` fields used by the backend.

### 6.2 Core Services

#### 6.2.1 `ChatService`

The client‑side `ChatService` manages chat sessions, handles API communication, and coordinates streaming responses.  It maintains an array of `ChatSession` objects and exposes them via RxJS `BehaviorSubject`s so components can react to updates.  Sessions are persisted using the `ChatSessionStorageService` described below.

`sendMessage` sends a non‑streaming request to the backend and returns an observable of the response.  `sendMessageStream` uses the Fetch API with `Accept: text/event-stream` to process SSE responses.  Incoming chunks are decoded and pushed to subscribers as `StreamEvent` objects.

The service also provides helper methods for retrieving OpenRouter models and providers and for preparing message arrays in the format expected by the backend.

#### 6.2.2 `ChatSessionStorageService`

This service persists chat sessions in IndexedDB using the `ChaterooChats` database.  It exposes CRUD operations and a `sessions$` observable that emits whenever sessions change.  The storage layer sorts sessions by update time so that the most recent conversation is loaded first on startup.  Utility methods like `generateSessionId` create unique keys for new sessions.

#### 6.2.3 `AuthService`

Authentication is simulated entirely on the client.  `AuthService` stores mock sessions and user information through an abstraction called `StorageAdapter`.  Methods `login`, `register`, and `logout` update an internal `BehaviorSubject` representing `AuthState`.  The service also supports “remember me” functionality and exposes getters for the current user and authentication flags.

### 6.3 Components

The `core/components` directory holds many standalone components used throughout the application.  Only a subset is listed here to illustrate the structure.

#### 6.3.1 `ChatComponent`

`ChatComponent` is the main UI for conversation.  It composes several child components such as `ChatMessageComponent` for rendering messages, `FileUpload` for attachments, `CanvasComponent` and `LiveCodeComponent` for experimental features, and `AutocompleteComponent` for provider/model selection.  The component keeps track of the current session, handles form submission, manages scrolling, and translates user actions (like pressing Enter) into service calls.  It also synchronizes the UI with OpenRouter provider/model lists.

#### 6.3.2 `ChatMessageComponent`

Each message in the conversation is rendered by `ChatMessageComponent`.  The component splits message text into alternating code and text segments using a regular expression.  Code blocks are displayed inside a `CopyBoxComponent` to facilitate easy copying, and HTML or SVG segments can be rendered directly using the `CanvasComponent`.  Markdown content is parsed via `marked` and sanitized with `DOMPurify` to prevent XSS.  The component exposes events to request opening the canvas or live-code modals.

#### 6.3.3 File Handling

`FileUploadComponent` allows users to attach files to their messages.  The component emits selected files as `ChatAttachment` objects with base64 strings so that the backend can incorporate attachments into prompts.  `AttachmentDisplayComponent` renders attachments within `ChatMessageComponent`.

#### 6.3.4 Navigation and Layout

The `navigation` and `layout` directories contain components for the side menu, chat list, and overall application shell.  They subscribe to services such as `AuthService` and `ChatService` to present user information and session lists.

### 6.4 Guards and Routing

The `guards` directory contains route guards that restrict access to certain routes based on authentication state.  The main routing configuration is in `app.routes.ts`, which defines top‑level routes for the chat view, login, and registration screens.

### 6.5 Styles and Utilities

TailwindCSS is configured through `tailwind.config.js`.  Global styles are located in `src/styles.css`.  The project also defines type definitions for external libraries under `src/types` to satisfy the TypeScript compiler.

### 6.6 Testing

Angular’s default testing infrastructure is present.  The `chat.service.spec.ts` file contains unit tests for the client chat service, though current test runs fail due to mismatched `ChatMessage` typings; this is an area for future maintenance.  Tests are invoked with `npm test --workspace=frontend` and rely on Karma and Jasmine.

## 7. Tauri Desktop Integration

The `src-tauri` directory contains the Rust code and configuration required to bundle the web application as a desktop app.  The main components are:

- **`src/lib.rs`** – Builds the Tauri application, registers plugins for storage and logging, and launches the UI.
- **`src/main.rs`** – Simple entry point that calls `app_lib::run()`.
- **`tauri.conf.json`** – Configuration defining the product name, window options, security policy, plugins, and bundling settings.  The `bundle` section declares `binaries/backend` as an external executable that should be shipped with the final package.
- **`build.rs`** – Uses `tauri-build` to generate Rust side bindings during compilation.

The build script `scripts/build-backend.sh` compiles the backend, copies its `dist` output and `node_modules` into `src-tauri/binaries`, and creates a small wrapper script with a platform‑specific name (`backend-$TARGET`).  This script is added to the Tauri bundle so that the backend can be launched seamlessly in the final application.

## 8. Extensibility Guidelines

Adding support for a new AI provider involves implementing a new engine class:

1. Create a file under `apps/backend/src/ai-engine/` that extends `AiApiEngine` and implements `sendMessage` (and optionally `sendMessageStream`).
2. Register the class in `ChatModule` by adding it to the providers list and the `AI_ENGINES` factory array.
3. Update the frontend to allow selecting the new provider.  This typically involves updating the provider dropdown in `ChatComponent` and adjusting `ChatService` to handle provider‑specific options.
4. Add appropriate unit tests to `apps/backend/src/ai-engine/new-engines.spec.ts`.

Because the frontend sends an array of chat messages, engines that require conversation history should have access to the full prompt.  The backend’s `ChatService` already handles this by concatenating message contents when the engine only supports a plain prompt string.

## 9. Known Issues and Future Work

- Automated tests are not currently runnable in this environment because Jest and Karma are missing or misconfigured.  The repository includes test files, but additional setup is required to execute them successfully.
- `OpenAiEngine` is a placeholder that does not actually call the OpenAI API.  Implementing real API integration would require handling rate limiting, optional streaming, and file uploads.
- Many services perform console logging; a structured logging approach would be beneficial for production use.
- Authentication is purely client‑side mock logic.  A real authentication flow would require secure backend endpoints and token management.
- Error handling in the frontend is basic, particularly for streaming connections.  Improving retry logic and user feedback would improve robustness.
- The frontend lacks comprehensive accessibility (a11y) features such as ARIA labels and keyboard navigation in all components.

## 10. Conclusion

Chateroo combines a modern Angular frontend, a modular NestJS backend, and a Rust‑based Tauri shell to deliver a desktop chat application that can communicate with numerous AI providers.  Its architecture emphasizes extensibility through engine abstractions, local persistence of conversations, and flexible build steps that package the entire stack into a single cross‑platform binary.  While many features are still evolving, the current codebase provides a solid foundation for experimentation with AI chat interactions and serves as a template for combining web technologies with native desktop capabilities.


# Chateroo Architecture

This document provides a high-level overview of the Chateroo application's architecture, detailing the structure of the monorepo, the roles of the frontend and backend, and how they interact.

## 1. Overall Architecture: Monorepo with Tauri

Chateroo is structured as a monorepo, managing three distinct but interconnected parts of the application within a single repository:

-   **Tauri Shell (`src-tauri`)**: The native application shell that wraps the web-based frontend, providing access to native system functionalities and creating a cross-platform desktop experience.
-   **Angular Frontend (`apps/frontend`)**: A single-page application (SPA) built with Angular that provides the user interface. It is responsible for all rendering, user interaction, and state management on the client side.
-   **NestJS Backend (`apps/backend`)**: A Node.js server built with the NestJS framework. It acts as an intermediary between the frontend and various external AI services, handling business logic, API integrations, and request orchestration.

This structure allows for clear separation of concerns while maintaining a unified development and build process.

## 2. Backend Architecture (NestJS)

The backend is a modular NestJS application designed for extensibility and maintainability. Its core responsibility is to abstract away the complexity of interacting with different AI providers.

### Key Concepts:

-   **Modular Design**: The backend is organized into modules, with the `ChatModule` and `AppModule` being the most central.
-   **AI Engine Abstraction**: The `ai-engine` directory contains the core logic for interacting with external AI APIs.
    -   `ai-api-engine.base.ts`: Defines the abstract `AiApiEngine` class, which enforces a common interface for all AI provider integrations. Every engine must implement `sendMessage` and may optionally implement `sendMessageStream`.
    -   **Engine Implementations**: Each AI provider (e.g., `OpenAI`, `Mistral`, `Gemini`, `OpenRouter`) has its own engine class that extends `AiApiEngine`. This isolates the logic for each provider, making it easy to add new ones or modify existing ones.
    -   `engine-registry.service.ts`: A service that acts as a dependency injection point for all AI engines. It registers all available engines and allows the `ChatService` to retrieve the correct engine for a given provider string.
-   **Services and Controllers**:
    -   `chat.service.ts`: Orchestrates the communication between the frontend and the AI engines. It receives requests, retrieves the appropriate engine from the registry, formats the payload, and forwards the request.
    -   `chat.controller.ts`: Exposes the backend's functionality via a RESTful API. It defines endpoints for sending messages, listing available providers, and fetching models. It handles both standard (JSON) and streaming (Server-Sent Events) responses.

## 3. Frontend Architecture (Angular)

The frontend is a modern Angular application that follows standard best practices for component-based architecture and state management.

### Key Concepts:

-   **Component-Based Structure**: The UI is broken down into a tree of reusable components, located primarily in `src/app/core/components`. Key components include:
    -   `chat.component.ts`: The main component that orchestrates the chat interface.
    -   `login.component.ts` & `register.component.ts`: Handle user authentication.
    -   Smaller, specialized components for features like file uploads, message display, and provider selection.
-   **Service-Based State Management**: Instead of a dedicated state management library (like NgRx or Akita), the application uses Angular services to manage and share state across components.
    -   `auth.service.ts`: Manages user authentication state, including the current user and session information.
    -   `settings.service.ts`: Handles both global application settings and user-specific preferences.
    -   `chat.service.ts`: Manages the state of chat sessions, including the list of all chats and the currently active chat.
-   **Data Persistence**:
    -   **`IndexedDB`**: The `chat-session-storage.service.ts` uses the browser's `IndexedDB` to persist chat history locally on the user's machine. This provides a robust, offline-capable storage solution for large amounts of chat data.
    -   **`StorageAdapter`**: The `settings.service.ts` and `auth.service.ts` use a generic `StorageAdapter` to persist their data. This adapter is implemented by `tauri-storage.adapter.ts` (for the Tauri environment) and `browser-storage.adapter.ts` (for a standard web environment), allowing the application to run both as a desktop app and in a browser.

## 4. Communication

-   **Frontend to Backend**: The frontend communicates with the backend via standard HTTP requests from the `ChatService`. For streaming responses, it uses the `fetch` API to handle the Server-Sent Events (SSE) stream.
-   **Backend to External APIs**: The backend's AI engines use NestJS's `HttpService` (a wrapper around Axios) to communicate with the various external AI provider APIs.
-   **Tauri IPC**: The frontend can communicate with the Tauri shell via Inter-Process Communication (IPC) to access native functionalities, though this is primarily used for features like local file storage managed by the `StorageAdapter`.
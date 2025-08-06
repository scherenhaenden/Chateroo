# Chateroo - Dein universeller KI-Chat-Wrapper

**Chateroo** ist eine schlanke, performante Desktop-Anwendung für macOS, Windows und Linux, die es dir ermöglicht, mit verschiedenen KI-Anbietern wie OpenAI, Gemini, Mistral und weiteren über eine einzige, einheitliche und saubere Benutzeroberfläche zu interagieren.

Vergiss das ständige Wechseln zwischen verschiedenen Webseiten. Mit Chateroo hast du alle deine KI-Tools an einem Ort.

-----

## 🚀 Features (Für Benutzer)

  * **Multi-Provider-Unterstützung:** Wechsle nahtlos zwischen verschiedenen KI-Modellen mit einem einfachen Dropdown-Menü.
  * **Sichere API-Schlüssel-Verwaltung:** Deine API-Schlüssel werden **niemals** unsere Server verlassen. Sie werden direkt von deinem Computer an den jeweiligen Anbieter gesendet. Für die zukünftige Speicherung wird der sichere Schlüsselbund deines Betriebssystems genutzt.
  * **Saubere & intuitive Oberfläche:** Eine ablenkungsfreie Chat-Ansicht, die sich auf das Wesentliche konzentriert: deine Konversation mit der KI.
  * **Plattformübergreifend:** Installiere Chateroo nativ auf deinem bevorzugten Betriebssystem (macOS, Windows, Kubuntu/Debian).
  * **Leicht & Schnell:** Dank der Tauri-Architektur startet die App blitzschnell und verbraucht nur minimale Systemressourcen.

-----

## 🛠️ Technische Architektur & Stack

Chateroo ist als **Monorepo** aufgebaut, das eine moderne und entkoppelte Architektur verwendet, um maximale Stabilität und Erweiterbarkeit zu gewährleisten.

### Architektur-Überblick

Die Anwendung besteht aus drei Kernkomponenten, die nahtlos zusammenarbeiten:

1.  **Frontend (Angular):** Die Benutzeroberfläche, die du siehst und mit der du interagierst. Sie ist verantwortlich für die Darstellung der Chats und die Entgegennahme deiner Eingaben.
2.  **Backend (NestJS):** Ein kleiner, lokaler Server, der direkt auf deinem Computer läuft. Er agiert als Gehirn der Anwendung, nimmt Anfragen vom Frontend entgegen und leitet sie an den richtigen KI-Anbieter weiter.
3.  **Desktop-Shell (Tauri):** Ein nativer Wrapper, der das Frontend und das Backend zu einer einzigen, installierbaren Desktop-Anwendung bündelt.

**Datenfluss:**
`[Dein Input]` -\> `Frontend (Angular)` -\> `Lokales Backend (NestJS)` -\> `Externe KI-API (z.B. OpenAI)`

### Technologie-Stack

  * **Desktop Framework:** [Tauri](https://tauri.app/) (Rust-basiert)
  * **Frontend:** [Angular](https://angular.io/) (TypeScript)
  * **Backend:** [NestJS](https://nestjs.com/) (Node.js / TypeScript)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **Monorepo-Verwaltung:** [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

-----

## 👨‍💻 Für Entwickler

Diese Sektion enthält alle Informationen, die du benötigst, um das Projekt lokal auszuführen, zu verändern oder zu erweitern.

### Voraussetzungen

Stelle sicher, dass die folgenden Werkzeuge auf deinem System installiert sind:

  * **Node.js:** `v20.19.0` oder höher (Empfehlung: `nvm use 20`)
  * **npm:** `v8.0.0` oder höher
  * **Rust & Cargo:** [Installationsanleitung](https://www.rust-lang.org/tools/install)
  * **System-Abhängigkeiten für Tauri:** [Installationsanleitung](https://tauri.app/v1/guides/getting-started/prerequisites)

### Lokale Installation & Start

1.  **Klone das Repository:**

    ```bash
    git clone <repository-url>
    cd chateroo
    ```

2.  **Installiere alle Abhängigkeiten:**
    Dieser Befehl installiert die Pakete für das Root-Verzeichnis, das Frontend und das Backend.

    ```bash
    npm install
    ```

3.  **Starte die Anwendung im Entwicklungsmodus:**

    ```bash
    npm run tauri dev
    ```

    Dieser Befehl erledigt alles für dich:

      * Startet das NestJS-Backend.
      * Startet den Angular-Entwicklungsserver.
      * Öffnet die Tauri-Desktop-Anwendung, die dein Frontend lädt.

### Projektstruktur

Das Monorepo ist wie folgt strukturiert:

```
/
├── apps/
│   ├── frontend/   # Der gesamte Angular-Code für die UI
│   └── backend/    # Der gesamte NestJS-Code für die Logik
├── src-tauri/      # Konfiguration und Rust-Code für die Tauri-Shell
├── package.json    # Haupt-package.json für das Monorepo
└── README.md       # Diese Datei
```

### ✨ Einen neuen KI-Provider hinzufügen

Die Architektur ist darauf ausgelegt, neue Anbieter mit minimalem Aufwand hinzuzufügen. Angenommen, du möchtest **Mistral AI** hinzufügen:

1.  **Erstelle eine neue Engine-Klasse:**
    Erstelle eine neue Datei `apps/backend/src/ai-engine/mistral.engine.ts`.

2.  **Implementiere die Logik:**
    Implementiere die `MistralEngine`-Klasse, die von `AiApiEngine` erbt. Hier schreibst du die Logik, um die Mistral-API anzusprechen.

    ```typescript
    // apps/backend/src/ai-engine/mistral.engine.ts
    import { Injectable } from '@nestjs/common';
    import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

    @Injectable()
    export class MistralEngine extends AiApiEngine {
      readonly provider = 'mistral';

      async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
        // Hier kommt deine Logik zur Kommunikation mit der Mistral-API
        // z.B. mit 'fetch' oder einer Client-Bibliothek
        console.log(`Sende Anfrage an Mistral mit API-Key: ${payload.apiKey}`);
        return { content: `(Platzhalter) Antwort von Mistral für: "${payload.prompt}"` };
      }
    }
    ```

3.  **Registriere die neue Engine:**
    Füge deine `MistralEngine` zu den `providers` in `apps/backend/src/chat.module.ts` und zur Liste der `engineImplementations` in `apps/backend/src/chat.service.ts` hinzu.

4.  **Füge die Option im Frontend hinzu:**
    Öffne `apps/frontend/src/app/app.component.html` und füge eine neue `<option>` zum `select`-Element hinzu:

    ```html
    <option value="mistral">Mistral</option>
    ```

Das war's\! Nach einem Neustart der Anwendung steht der neue Provider zur Verfügung.

### Anwendung bauen (Build)

Um eine installierbare Datei für dein Betriebssystem zu erstellen, führe folgenden Befehl aus:

```bash
npm run tauri build
```

Die fertige Installationsdatei findest du anschließend im Verzeichnis `src-tauri/target/release/bundle/`.

-----

## 📄 Lizenz

Dieses Projekt steht unter der **MIT-Lizenz**. Details findest du in der `LICENSE`-Datei.
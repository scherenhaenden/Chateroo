import { Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenAiEngine extends AiApiEngine {
  readonly provider = 'openai';

  /**
   * Sends a message using the provided payload and returns a chat response, handling missing API key.
   */
  async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    // HINWEIS: Dies ist eine Platzhalter-Implementierung.
    // Hier würde die eigentliche Logik zur Kommunikation mit der OpenAI-API stehen.
    // z.B. mit dem 'openai' npm-Paket.
    if (!payload.apiKey) {
      return { content: 'Fehler: OpenAI API-Schlüssel fehlt.' };
    }
    await Promise.resolve();
    return {
      content: `(Platzhalter) OpenAI würde jetzt die Frage "${payload.prompt}" beantworten.`,
    };
  }
}

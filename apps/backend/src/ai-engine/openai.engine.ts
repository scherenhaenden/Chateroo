import { Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenAiEngine extends AiApiEngine {
  readonly provider = 'openai';

  async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    // HINWEIS: Dies ist eine Platzhalter-Implementierung.
    // Hier würde die eigentliche Logik zur Kommunikation mit der OpenAI-API stehen.
    if (!payload.apiKey) {
      return { content: 'Error: OpenAI API key is missing.' };
    }
    return {
      content: `(Platzhalter) OpenAI würde jetzt die Frage "${payload.prompt}" beantworten.`,
    };
  }
}

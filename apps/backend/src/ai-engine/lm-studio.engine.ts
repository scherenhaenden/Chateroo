import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LmStudioEngine extends AiApiEngine {
  readonly provider = 'lm-studio';
  private readonly apiUrl = 'http://localhost:1234/v1/chat/completions';

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    try {
      const requestBody = {
        model: 'local-model',
        messages: [{ role: 'user', content: payload.prompt }],
        temperature: 0.7,
      };

      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von LM Studio erhalten.');
      }
      return { content };
    } catch (error) {
      console.error('Fehler bei der Kommunikation mit LM Studio:', (error as any).message);
      return {
        content:
          'Fehler bei der Verbindung mit LM Studio. Stelle sicher, dass der Server läuft. ' +
          `(Details: ${(error as any).message})`,
      };
    }
  }
}

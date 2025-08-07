import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class MistralEngine extends AiApiEngine {
  public readonly provider = 'mistral';
  private readonly apiUrl = 'https://api.mistral.ai/v1/chat/completions';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Sends a message to the Mistral API and returns the response.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body = {
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: payload.prompt }],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, { headers }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von Mistral erhalten.');
      }
      return { content };
    } catch (error) {
      console.error(
        'Fehler bei der Kommunikation mit Mistral:',
        (error as any).response?.data || (error as any).message,
      );
      return { content: 'Sorry, there was an error communicating with Mistral.' };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class GrokEngine extends AiApiEngine {
  public readonly provider = 'grok';
  private readonly apiUrl = 'https://api.x.ai/v1/chat/completions';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Sends a message to the Grok API and returns the response.
   *
   * It constructs the request headers and body, sends a POST request using the HTTP service,
   * and processes the response. If an error occurs, it logs the error and returns a default error message.
   *
   * @param payload - An object containing the API key and prompt for the message.
   * @returns A promise that resolves to a ChatResponse object containing the response content.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body = {
      model: 'grok-1',
      messages: [{ role: 'user', content: payload.prompt }],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, { headers }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von Grok erhalten.');
      }
      return { content };
    } catch (error) {
      console.error(
        'Fehler bei der Kommunikation mit Grok:',
        (error as any).response?.data || (error as any).message,
      );
      return { content: 'Sorry, there was an error communicating with Grok.' };
    }
  }
}

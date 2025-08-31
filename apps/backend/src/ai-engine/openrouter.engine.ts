import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenRouterEngine extends AiApiEngine {
  public readonly provider = 'openrouter';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Sends a message to the OpenRouter API and returns the response.
   *
   * Constructs the request headers and body, sends a POST request to the
   * OpenRouter chat completions endpoint, and processes the response. In case of
   * an error or invalid response, a friendly error message is returned.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body = {
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: payload.prompt }],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, { headers }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
      }
      return { content };
    } catch (error) {
      console.error(
        'Fehler bei der Kommunikation mit OpenRouter:',
        (error as any).response?.data || (error as any).message,
      );
      return {
        content: 'Sorry, there was an error communicating with OpenRouter.',
      };
    }
  }

  /**
   * Retrieves the list of available models from OpenRouter.
   */
  public async listModels(apiKey: string): Promise<any[]> {
    const headers = { Authorization: `Bearer ${apiKey}` };
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://openrouter.ai/api/v1/models', { headers }),
      );
      return response.data?.data || [];
    } catch (error) {
      console.error(
        'Fehler beim Abrufen der Modelle von OpenRouter:',
        (error as any).response?.data || (error as any).message,
      );
      return [];
    }
  }
}


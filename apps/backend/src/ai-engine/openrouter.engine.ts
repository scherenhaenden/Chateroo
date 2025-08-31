import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class OpenRouterEngine extends AiApiEngine {
  public readonly provider = 'openrouter';
  private readonly apiBase = 'https://openrouter.ai/api/v1';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  public async getModels(apiKey: string): Promise<any[]> {
    const headers = { Authorization: `Bearer ${apiKey}` };
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiBase}/models`, { headers }),
      );
      return response.data?.data ?? [];
    } catch (error) {
      console.error(
        'Fehler beim Abrufen der Modelle von OpenRouter:',
        error.response?.data || error.message,
      );
      return [];
    }
  }

  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      Authorization: `Bearer ${payload.apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = {
      model: payload.model || 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: payload.prompt }],
    };
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiBase}/chat/completions`, body, {
          headers,
        }),
      );
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
      }
      return { content };
    } catch (error) {
      console.error(
        'Fehler bei der Kommunikation mit OpenRouter:',
        error.response?.data || error.message,
      );
      return {
        content: 'Sorry, there was an error communicating with OpenRouter.',
      };
    }
  }
}

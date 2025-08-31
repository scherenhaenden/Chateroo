import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: Record<string, string>;
  context_length?: number;
  architecture?: Record<string, unknown>;
  top_provider?: Record<string, unknown>;
}

interface OpenRouterChatResponse {
  choices: { message: { content: string } }[];
}

@Injectable()
export class OpenRouterEngine extends AiApiEngine {
  public readonly provider = 'openrouter';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly modelsUrl = 'https://openrouter.ai/api/v1/models';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Retrieves the list of available models from OpenRouter.
   */
  public async listModels(apiKey: string): Promise<OpenRouterModel[]> {
    const headers = { Authorization: `Bearer ${apiKey}` };

    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: OpenRouterModel[] }>(this.modelsUrl, {
          headers,
        }),
      );
      return response.data?.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error(
        'Fehler beim Abrufen der Modelle von OpenRouter:',
        err.response?.data || err.message,
      );
      return [];
    }
  }

  /**
   * Sends a chat completion request to OpenRouter.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body: Record<string, unknown> = {
      model: payload.model ?? 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: payload.prompt }],
    };

    if (payload.temperature !== undefined) {
      body.temperature = payload.temperature;
    }
    if (payload.maxTokens !== undefined) {
      body.max_tokens = payload.maxTokens;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<OpenRouterChatResponse>(this.apiUrl, body, {
          headers,
        }),
      );
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
      }
      return { content };
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error(
        'Fehler bei der Kommunikation mit OpenRouter:',
        err.response?.data || err.message,
      );
      return {
        content: 'Sorry, there was an error communicating with OpenRouter.',
      };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { isAxiosError } from 'axios';
import {
  AiApiEngine,
  ChatPayload,
  ChatResponse,
} from '../../../ai-api-engine.base';

// Import interfaces from separate files
import { OpenRouterProvider } from '../interfaces/openrouter-provider.interface';
import { OpenRouterModel } from '../interfaces/openrouter-model.interface';

// Response shapes for typed HTTP calls
interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

interface OpenRouterProvidersResponse {
  data: OpenRouterProvider[];
}

interface OpenRouterChatChoice {
  message?: {
    content?: string;
  };
}

interface OpenRouterChatResponse {
  choices: OpenRouterChatChoice[];
}

@Injectable()
export class OpenRouterEngine extends AiApiEngine {
  public readonly provider = 'openrouter';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly modelsUrl = 'https://openrouter.ai/api/v1/models';
  private readonly providersUrl = 'https://openrouter.ai/api/v1/providers';
  private readonly defaultModel = 'openai/gpt-4o-mini';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  public async listModels(apiKey: string): Promise<OpenRouterModel[]> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if apiKey is provided
    if (apiKey && apiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const obs = this.httpService.get<OpenRouterModelsResponse>(
        this.modelsUrl,
        {
          headers,
        },
      );
      const response: AxiosResponse<OpenRouterModelsResponse> =
        await firstValueFrom(obs);

      return response.data?.data ?? [];
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error(
          'Fehler beim Abrufen der Modelle von OpenRouter:',
          err.response?.data ?? err.message,
        );
      } else {
        console.error(
          'Fehler beim Abrufen der Modelle von OpenRouter:',
          String(err),
        );
      }
      return [];
    }
  }

  /**
   * Gets available OpenRouter providers
   */
  public async listProviders(): Promise<OpenRouterProvider[]> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const obs = this.httpService.get<OpenRouterProvidersResponse>(
        this.providersUrl,
        {
          headers,
        },
      );
      const response: AxiosResponse<OpenRouterProvidersResponse> =
        await firstValueFrom(obs);

      return response.data?.data ?? [];
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error(
          'Fehler beim Abrufen der Provider von OpenRouter:',
          err.response?.data ?? err.message,
        );
      } else {
        console.error(
          'Fehler beim Abrufen der Provider von OpenRouter:',
          String(err),
        );
      }
      return [];
    }
  }

  /**
   * Sends a message to the OpenRouter API and returns the response.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
      'HTTP-Referer': 'https://chateroo.app', // Optional: your app's URL
      'X-Title': 'Chateroo', // Optional: your app's name
    };

    // Use the messages from payload if available, otherwise fallback to simple prompt
    const messages =
      payload.messages && payload.messages.length > 0
        ? payload.messages
        : [{ role: 'user', content: payload.prompt }];

    const body = {
      model: payload.model ?? this.defaultModel,
      messages: messages,
      stream: false,
      // Add reasoning if supported by model
      ...(payload.model?.includes('reasoning') && {
        reasoning: {
          effort: 'high',
        },
      }),
    };

    try {
      const obs = this.httpService.post<OpenRouterChatResponse>(
        this.apiUrl,
        body,
        {
          headers,
        },
      );
      const response: AxiosResponse<OpenRouterChatResponse> =
        await firstValueFrom(obs);

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
      }

      return { content };
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const errorData = err.response?.data as Record<string, any> | undefined;
        const message = err.message;

        console.error(
          'Fehler bei der Kommunikation mit OpenRouter:',
          errorData ?? message,
        );

        if (errorData?.error) {
          const { message: errMsg, code } = errorData.error as {
            message?: string;
            code?: number;
          };

          if (code === 404 && errMsg?.includes('data policy')) {
            return {
              content: `Error: The selected model "${payload.model || this.defaultModel}" is not available according to your OpenRouter data policy settings. Please:\n\n1. Visit https://openrouter.ai/settings/privacy to configure your data policy\n2. Or select a different model that's available with your current settings\n3. Try using models like "openai/gpt-3.5-turbo" or "openai/gpt-4o-mini" which are commonly available`,
            };
          }

          if (code === 401) {
            return {
              content:
                'Error: Invalid API key. Please check your OpenRouter API key.',
            };
          }

          if (code === 429) {
            return {
              content:
                'Error: Rate limit exceeded. Please wait a moment and try again.',
            };
          }

          return {
            content: `Error: ${errMsg ?? 'Unknown error'} (Code: ${code ?? 'N/A'})`,
          };
        }
      } else {
        console.error(
          'Fehler bei der Kommunikation mit OpenRouter:',
          String(err),
        );
      }

      return {
        content:
          'Sorry, there was an error communicating with OpenRouter. Please try again.',
      };
    }
  }
}

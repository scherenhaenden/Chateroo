import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: { prompt: string; completion: string };
  context_length: number;
  architecture: { modality: string };
  top_provider: { id: string; is_moderated: boolean };
}

@Injectable()
export class OpenRouterEngine extends AiApiEngine {
  public readonly provider = 'openrouter';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly modelsUrl = 'https://openrouter.ai/api/v1/models';
  private readonly defaultModel = 'openai/gpt-4o-mini';

  public constructor(private readonly httpService: HttpService) {
    super();
  }

  /**
   * Retrieve a list of models from the OpenRouter API.
   *
   * This function constructs the necessary headers using the provided apiKey and makes an HTTP GET request to the modelsUrl.
   * If the request is successful, it returns the list of models; otherwise, it logs the error and returns an empty array.
   *
   * @param apiKey - The API key used for authorization in the request headers.
   * @returns A promise that resolves to an array of OpenRouterModel objects or an empty array if the request fails.
   */
  public async listModels(apiKey: string): Promise<OpenRouterModel[]> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.modelsUrl, { headers }),
      );
      return response.data?.data ?? [];
    } catch (error) {
      console.error(
        'Fehler beim Abrufen der Modelle von OpenRouter:',
        (error as any).response?.data || (error as any).message,
      );
      return [];
    }
  }

  /**
   * Sends a message to the OpenRouter API and returns the response.
   *
   * This function constructs the request headers and body using the provided payload, including the model and user prompt. It then makes an asynchronous HTTP POST request to the OpenRouter API. If a valid response is received, it extracts the content; otherwise, it throws an error. In case of any communication errors, it logs the error and returns a default error message.
   *
   * @param payload - An object containing the API key, model, and user prompt.
   * @returns A promise that resolves to a ChatResponse object containing the content of the response.
   */
  public async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.apiKey}`,
    };

    const body = {
      model: payload.model ?? this.defaultModel,
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
}

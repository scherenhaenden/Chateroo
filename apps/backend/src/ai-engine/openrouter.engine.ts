import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id?: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: Architecture;
  pricing: Pricing;
  top_provider: TopProvider;
  per_request_limits: any;
  supported_parameters: string[];
}

export interface Architecture {
  modality: string;
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type?: string;
}

export interface Pricing {
  prompt: string;
  completion: string;
  request?: string;
  image?: string;
  web_search?: string;
  internal_reasoning?: string;
  input_cache_read?: string;
  audio?: string;
  input_cache_write?: string;
}

export interface TopProvider {
  context_length?: number;
  max_completion_tokens?: number;
  is_moderated: boolean;
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

  public async listModels(apiKey: string): Promise<OpenRouterModel[]> {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if apiKey is provided
    if (apiKey && apiKey.trim() !== '') {
      headers.Authorization = `Bearer ${apiKey}`;
    }

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

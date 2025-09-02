import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiApiEngine, ChatPayload, ChatResponse, StreamChunk, ChatMessage } from './ai-api-engine.base';

export interface OpenRouterProvider {
  name: string;
  slug: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  status_page_url?: string;
}

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

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterPayload {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  provider?: any;
  reasoning?: {
    effort: string;
  };
}

interface OpenRouterStreamResponse {
  id: string;
  provider: string;
  model: string;
  object: string;
  created: number;
  choices: {
    logprobs?: any;
    finish_reason?: string;
    native_finish_reason?: string;
    index: number;
    delta?: {
      role?: string;
      content?: string;
      refusal?: any;
      reasoning?: any;
    };
    message?: {
      role: string;
      content: string;
      refusal?: any;
      reasoning?: any;
    };
  }[];
  system_fingerprint?: any;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details?: {
      reasoning_tokens: number;
    };
  };
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
   * Gets available OpenRouter providers
   */
  public async listProviders(): Promise<OpenRouterProvider[]> {
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.providersUrl, { headers }),
      );
      return response.data?.data ?? [];
    } catch (error) {
      console.error(
        'Fehler beim Abrufen der Provider von OpenRouter:',
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
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, body, { headers }),
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
      }

      return { content };
    } catch (error) {
      const errorData = (error as any).response?.data;
      const errorMessage = (error as any).message;

      console.error('Fehler bei der Kommunikation mit OpenRouter:', errorData || errorMessage);

      // Handle specific OpenRouter errors
      if (errorData?.error) {
        const { message, code } = errorData.error;

        if (code === 404 && message.includes('data policy')) {
          return {
            content: `Error: The selected model "${
              payload.model || this.defaultModel
            }" is not available according to your OpenRouter data policy settings. Please:\n\n1. Visit https://openrouter.ai/settings/privacy to configure your data policy\n2. Or select a different model that's available with your current settings\n3. Try using models like "openai/gpt-3.5-turbo" or "openai/gpt-4o-mini" which are commonly available`,
          };
        }

        if (code === 401) {
          return {
            content: 'Error: Invalid API key. Please check your OpenRouter API key.',
          };
        }

        if (code === 429) {
          return {
            content: 'Error: Rate limit exceeded. Please wait a moment and try again.',
          };
        }

        return {
          content: `Error: ${message} (Code: ${code})`,
        };
      }

      return {
        content: 'Sorry, there was an error communicating with OpenRouter. Please try again.',
      };
    }
  }

  public async *sendMessageStream(payload: ChatPayload): AsyncIterableIterator<StreamChunk> {
    const requestPayload: OpenRouterPayload = {
      model: payload.model || 'openai/gpt-3.5-turbo',
      messages: this.formatMessages(payload),
      stream: true,
      provider: {},
      reasoning: {
        effort: 'high'
      }
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${payload.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6);
              const data: OpenRouterStreamResponse = JSON.parse(jsonStr);

              const content = data.choices[0]?.delta?.content;
              if (content) {
                yield { content };
              }

              const finishReason = data.choices[0]?.finish_reason;
              if (finishReason) {
                yield { content: '', done: true };
                return;
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private formatMessages(payload: ChatPayload): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // Add existing messages if provided
    if (payload.messages) {
      messages.push(...payload.messages);
    }

    // Add the current prompt as user message
    if (payload.prompt) {
      messages.push({
        role: 'user',
        content: payload.prompt
      });
    }

    return messages;
  }
}

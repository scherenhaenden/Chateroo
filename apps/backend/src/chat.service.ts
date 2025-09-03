import { Injectable } from '@nestjs/common';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import {
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-engine/ai-api-engine.base';
import { OpenRouterEngine, OpenRouterModel } from './ai-engine/openrouter.engine';
import type { SendMessageDto } from './dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly engineRegistry: EngineRegistryService) {}

  private extractPromptFromPayload(payload: SendMessageDto): string {
    if (payload.messages) {
      return payload.messages.map((msg) => msg.content).join('\n');
    }
    return payload.prompt || '';
  }

  sendMessage(payload: SendMessageDto): Promise<ChatResponse> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      throw new Error(`Provider ${payload.provider} not supported`);
    }

    // Verwende die neue Hilfsmethode zur Extraktion des Prompts
    const prompt = this.extractPromptFromPayload(payload);
    console.log('Extracted prompt from payload:', prompt);
    console.log('Original payload messages:', payload.messages);

    const chatPayload: ChatPayload = {
      prompt: prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
    };

    return engine.sendMessage(chatPayload);
  }

  async *sendMessageStream(
    payload: SendMessageDto,
  ): AsyncIterableIterator<StreamChunk> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      yield {
        content: `Provider ${payload.provider} not supported`,
        done: true,
      };
      return;
    }

    // Convert messages array to prompt if needed
    const prompt = this.extractPromptFromPayload(payload);

    const chatPayload: ChatPayload = {
      prompt: prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
      stream: true,
    };

    // Use streaming if available, otherwise fall back to regular message
    if (engine.sendMessageStream) {
      yield* engine.sendMessageStream(chatPayload);
    } else {
      // Fallback for engines without streaming support
      const response = await engine.sendMessage(chatPayload);
      yield { content: response.content, done: true };
    }
  }

  /**
   * Gets available OpenRouter models
   */
  async getOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
    const engine = this.engineRegistry.get('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not available');
    }

    // If no API key provided, try to get models with a temporary/demo key
    // or return an empty array with a message
    if (!apiKey) {
      try {
        // OpenRouter's public models endpoint doesn't require authentication
        // We'll use a minimal key or handle the request differently
        return await engine.listModels('');
      } catch (error) {
        console.log('No API key provided for OpenRouter models, returning empty list');
        return [];
      }
    }

    return await engine.listModels(apiKey);
  }

  /**
   * Gets available OpenRouter providers
   */
  async getOpenRouterProviders(): Promise<any[]> {
    const engine = this.engineRegistry.get('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not available');
    }

    return await engine.listProviders();
  }
}

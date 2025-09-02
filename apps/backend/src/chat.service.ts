import { Injectable } from '@nestjs/common';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import {
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-engine/ai-api-engine.base';
import { OpenRouterEngine } from './ai-engine/openrouter.engine';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

export interface SendMessageDto {
  provider: string;
  messages?: ChatMessage[];
  prompt?: string;
  apiKey?: string;
  model?: string;
  stream?: boolean;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

@Injectable()
export class ChatService {
  constructor(
    private readonly engineRegistry: EngineRegistryService,
  ) {}

  async sendMessage(payload: SendMessageDto): Promise<ChatResponse> {
    const engine = this.engineRegistry.getEngine(payload.provider || 'openrouter');

    if (!engine) {
      throw new Error(`Engine for provider "${payload.provider}" not found`);
    }

    // Convert SendMessageDto to ChatPayload
    const chatPayload: ChatPayload = {
      prompt: payload.prompt || '',
      messages: payload.messages,
      apiKey: payload.apiKey,
      model: payload.model,
      stream: false,
      attachments: payload.attachments,
    };

    return await engine.sendMessage(chatPayload);
  }

  async *sendMessageStream(payload: SendMessageDto): AsyncIterableIterator<StreamChunk> {
    const engine = this.engineRegistry.getEngine(payload.provider || 'openrouter');

    if (!engine) {
      throw new Error(`Engine for provider "${payload.provider}" not found`);
    }

    // Convert SendMessageDto to ChatPayload
    const chatPayload: ChatPayload = {
      prompt: payload.prompt || '',
      messages: payload.messages,
      apiKey: payload.apiKey,
      model: payload.model,
      stream: true,
      attachments: payload.attachments,
    };

    if (engine.sendMessageStream) {
      yield* engine.sendMessageStream(chatPayload);
    } else {
      // Fallback für Engines ohne Streaming-Support
      const response = await engine.sendMessage(chatPayload);
      yield { content: response.content, done: true };
    }
  }

  async getOpenRouterModels(apiKey?: string) {
    const engine = this.engineRegistry.getEngine('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not found');
    }
    return await engine.listModels(apiKey || '');
  }

  async getOpenRouterProviders() {
    const engine = this.engineRegistry.getEngine('openrouter') as OpenRouterEngine;
    if (!engine) {
      throw new Error('OpenRouter engine not found');
    }
    return await engine.listProviders();
  }
}

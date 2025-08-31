import { Injectable } from '@nestjs/common';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import {
  ChatPayload,
  ChatResponse,
  StreamChunk,
} from './ai-engine/ai-api-engine.base';

export interface ChatServicePayload {
  provider: string;
  prompt: string;
  apiKey?: string;
  model?: string;
  attachments?: {
    name: string;
    type: string;
    base64: string;
    size: number;
  }[];
}

@Injectable()
export class ChatService {
  constructor(private readonly engineRegistry: EngineRegistryService) {}

  sendMessage(payload: ChatServicePayload): Promise<ChatResponse> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      throw new Error(`Provider ${payload.provider} not supported`);
    }

    const chatPayload: ChatPayload = {
      prompt: payload.prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments,
    };

    return engine.sendMessage(chatPayload);
  }

  async *sendMessageStream(
    payload: ChatServicePayload,
  ): AsyncIterableIterator<StreamChunk> {
    const engine = this.engineRegistry.get(payload.provider);
    if (!engine) {
      yield {
        content: `Provider ${payload.provider} not supported`,
        done: true,
      };
      return;
    }

    const chatPayload: ChatPayload = {
      prompt: payload.prompt,
      apiKey: payload.apiKey,
      model: payload.model,
      attachments: payload.attachments,
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
}

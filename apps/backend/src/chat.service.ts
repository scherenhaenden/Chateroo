import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { OpenRouterEngine, OpenRouterModel } from './ai-engine/openrouter.engine';

@Injectable()
export class ChatService {
  public constructor(private readonly registry: EngineRegistryService) {}

  /**
   * Handles incoming chat messages by selecting an appropriate provider and sending the message.
   */
  public async handleMessage(
    provider: string,
    payload: ChatPayload,
  ): Promise<ChatResponse> {
    const engine = this.registry.get(provider);
    if (!engine) {
      throw new NotFoundException(`Provider '${provider}' wird nicht unterstützt.`);
    }
    return engine.sendMessage(payload);
  }

  public getProviders(): string[] {
    return this.registry.getProviders();
  }

  public async listOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
    const engine = this.registry.get('openrouter') as OpenRouterEngine | undefined;
    if (!engine) {
      throw new NotFoundException(`Provider 'openrouter' wird nicht unterstützt.`);
    }
    return engine.listModels(apiKey);
  }
}

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  AiApiEngine,
  ChatPayload,
  ChatResponse,
} from './ai-engine/ai-api-engine.base';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';

@Injectable()
export class ChatService implements OnModuleInit {
  private engines: Map<string, AiApiEngine> = new Map();

  // ModuleRef wird verwendet, um alle Instanzen von AiApiEngine zu finden
  constructor(private moduleRef: ModuleRef) {}

  /**
   * Initializes AI engines by fetching their instances and storing them.
   */
  onModuleInit() {
    // Finde alle Provider, die von AiApiEngine erben
    const engineImplementations = [DummyEngine, OpenAiEngine];
    engineImplementations.forEach((engineClass) => {
      const engineInstance = this.moduleRef.get(engineClass, { strict: false });
      this.engines.set(engineInstance.provider, engineInstance);
    });
  }

  /**
   * Handles incoming chat messages by selecting an appropriate provider and sending the message.
   */
  async handleMessage(
    provider: string,
    payload: ChatPayload,
  ): Promise<ChatResponse> {
    const engine = this.engines.get(provider);
    if (!engine) {
      throw new NotFoundException(
        `Provider '${provider}' wird nicht unterstützt.`,
      );
    }
    return engine.sendMessage(payload);
  }

  getProviders(): string[] {
    return Array.from(this.engines.keys());
  }
}

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';

@Injectable()
export class ChatService implements OnModuleInit {
  private engines: Map<string, AiApiEngine> = new Map();

  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    const engineImplementations = [DummyEngine, OpenAiEngine];
    engineImplementations.forEach(engineClass => {
      const engineInstance = this.moduleRef.get(engineClass, { strict: false });
      if (engineInstance) {
        this.engines.set(engineInstance.provider, engineInstance);
      }
    });
  }

  async handleMessage(provider: string, payload: ChatPayload): Promise<ChatResponse> {
    const engine = this.engines.get(provider);
    if (!engine) {
      throw new NotFoundException(`Provider '${provider}' wird nicht unterstützt.`);
    }
    return engine.sendMessage(payload);
  }
}


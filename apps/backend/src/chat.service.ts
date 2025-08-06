import { Inject, Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';

@Injectable()
export class ChatService {
  private readonly engines = new Map<string, AiApiEngine>();

  constructor(@Inject('AI_ENGINES') engines: AiApiEngine[]) {
    engines.forEach((engine) => this.engines.set(engine.provider, engine));
  }

  async sendMessage(provider: string, payload: ChatPayload): Promise<ChatResponse> {
    const engine = this.engines.get(provider);
    if (!engine) {
      return { content: `Fehler: Provider '${provider}' nicht unterstützt.` };
    }
    return engine.sendMessage(payload);
  }

  getProviders(): string[] {
    return Array.from(this.engines.keys());
  }
}

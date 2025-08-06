import { Injectable } from '@nestjs/common';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';

@Injectable()
export class DummyEngine extends AiApiEngine {
  readonly provider = 'dummy';

  async sendMessage(payload: ChatPayload): Promise<ChatResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      content: `Antwort vom Dummy-Provider für die Frage: "${payload.prompt}"`,
    };
  }
}

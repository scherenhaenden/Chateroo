import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';
import { AiApiEngine } from './ai-engine/ai-api-engine.base';

const engineProviders = [DummyEngine, OpenAiEngine];

@Module({
  providers: [
    ...engineProviders,
    {
      provide: 'AI_ENGINES',
      useFactory: (...engines: AiApiEngine[]) => engines,
      inject: engineProviders,
    },
    ChatService,
  ],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}

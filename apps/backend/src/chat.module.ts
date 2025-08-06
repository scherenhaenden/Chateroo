import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';

@Module({
  controllers: [ChatController],
  // Registriere alle Engines hier als Provider
  providers: [ChatService, DummyEngine, OpenAiEngine],
})
export class ChatModule {}

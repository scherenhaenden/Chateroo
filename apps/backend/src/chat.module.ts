import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';
import { LmStudioEngine } from './ai-engine/lm-studio.engine';

@Module({
  imports: [HttpModule],
  controllers: [ChatController],
  // Registriere alle Engines hier als Provider
  providers: [ChatService, DummyEngine, OpenAiEngine, LmStudioEngine],
})
export class ChatModule {}

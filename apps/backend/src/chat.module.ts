import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DummyEngine } from './ai-engine/dummy.engine';
import { OpenAiEngine } from './ai-engine/openai.engine';
import { LmStudioEngine } from './ai-engine/lm-studio.engine';
import { MistralEngine } from './ai-engine/mistral.engine';
import { GeminiEngine } from './ai-engine/gemini.engine';
import { PerplexityEngine } from './ai-engine/perplexity.engine';
import { GrokEngine } from './ai-engine/grok.engine';
import { DeepseekEngine } from './ai-engine/deepseek.engine';
import { OpenRouterEngine } from './ai-engine/openrouter.engine';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { AI_ENGINES } from './ai-engine/ai-engine.constants';
import { AiApiEngine } from './ai-engine/ai-api-engine.base';

@Module({
  imports: [HttpModule],
  controllers: [ChatController],
  // Registriere alle Engines hier als Provider
  providers: [
    EngineRegistryService,
    ChatService,
    DummyEngine,
    OpenAiEngine,
    LmStudioEngine,
    MistralEngine,
    GeminiEngine,
    PerplexityEngine,
    GrokEngine,
    DeepseekEngine,
    OpenRouterEngine,
    {
      provide: AI_ENGINES,
      useFactory: (
        dummy: DummyEngine,
        openAi: OpenAiEngine,
        lmStudio: LmStudioEngine,
        mistral: MistralEngine,
        gemini: GeminiEngine,
        perplexity: PerplexityEngine,
        grok: GrokEngine,
        deepseek: DeepseekEngine,
        openrouter: OpenRouterEngine,
      ): AiApiEngine[] => [
        dummy,
        openAi,
        lmStudio,
        mistral,
        gemini,
        perplexity,
        grok,
        deepseek,
        openrouter,
      ],
      inject: [
        DummyEngine,
        OpenAiEngine,
        LmStudioEngine,
        MistralEngine,
        GeminiEngine,
        PerplexityEngine,
        GrokEngine,
        DeepseekEngine,
        OpenRouterEngine,
      ],
    },
  ],
})
export class ChatModule {}

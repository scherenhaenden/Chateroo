"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
const dummy_engine_1 = require("./ai-engine/dummy.engine");
const openai_engine_1 = require("./ai-engine/openai.engine");
const lm_studio_engine_1 = require("./ai-engine/lm-studio.engine");
const mistral_engine_1 = require("./ai-engine/mistral.engine");
const gemini_engine_1 = require("./ai-engine/gemini.engine");
const perplexity_engine_1 = require("./ai-engine/perplexity.engine");
const grok_engine_1 = require("./ai-engine/grok.engine");
const deepseek_engine_1 = require("./ai-engine/deepseek.engine");
const openrouter_engine_1 = require("./ai-engine/openrouter.engine");
const engine_registry_service_1 = require("./ai-engine/engine-registry.service");
const ai_engine_constants_1 = require("./ai-engine/ai-engine.constants");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [chat_controller_1.ChatController],
        providers: [
            engine_registry_service_1.EngineRegistryService,
            chat_service_1.ChatService,
            dummy_engine_1.DummyEngine,
            openai_engine_1.OpenAiEngine,
            lm_studio_engine_1.LmStudioEngine,
            mistral_engine_1.MistralEngine,
            gemini_engine_1.GeminiEngine,
            perplexity_engine_1.PerplexityEngine,
            grok_engine_1.GrokEngine,
            deepseek_engine_1.DeepseekEngine,
            openrouter_engine_1.OpenRouterEngine,
            {
                provide: ai_engine_constants_1.AI_ENGINES,
                useFactory: (dummy, openAi, lmStudio, mistral, gemini, perplexity, grok, deepseek, openrouter) => [
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
                    dummy_engine_1.DummyEngine,
                    openai_engine_1.OpenAiEngine,
                    lm_studio_engine_1.LmStudioEngine,
                    mistral_engine_1.MistralEngine,
                    gemini_engine_1.GeminiEngine,
                    perplexity_engine_1.PerplexityEngine,
                    grok_engine_1.GrokEngine,
                    deepseek_engine_1.DeepseekEngine,
                    openrouter_engine_1.OpenRouterEngine,
                ],
            },
        ],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("./ai-engine/engine-registry.service");
let ChatService = class ChatService {
    engineRegistry;
    constructor(engineRegistry) {
        this.engineRegistry = engineRegistry;
    }
    extractPromptFromPayload(payload) {
        if (payload.messages) {
            return payload.messages.map((msg) => msg.content).join('\n');
        }
        return payload.prompt || '';
    }
    sendMessage(payload) {
        const engine = this.engineRegistry.get(payload.provider);
        if (!engine) {
            throw new Error(`Provider ${payload.provider} not supported`);
        }
        const prompt = this.extractPromptFromPayload(payload);
        console.log('Extracted prompt from payload:', prompt);
        console.log('Original payload messages:', payload.messages);
        const chatPayload = {
            prompt: prompt,
            apiKey: payload.apiKey,
            model: payload.model,
            attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
        };
        return engine.sendMessage(chatPayload);
    }
    async *sendMessageStream(payload) {
        const engine = this.engineRegistry.get(payload.provider);
        if (!engine) {
            yield {
                content: `Provider ${payload.provider} not supported`,
                done: true,
            };
            return;
        }
        const prompt = this.extractPromptFromPayload(payload);
        const chatPayload = {
            prompt: prompt,
            apiKey: payload.apiKey,
            model: payload.model,
            attachments: payload.attachments || payload.messages?.[payload.messages.length - 1]?.attachments,
            stream: true,
        };
        if (engine.sendMessageStream) {
            yield* engine.sendMessageStream(chatPayload);
        }
        else {
            const response = await engine.sendMessage(chatPayload);
            yield { content: response.content, done: true };
        }
    }
    async getOpenRouterModels(apiKey) {
        const engine = this.engineRegistry.get('openrouter');
        if (!engine) {
            throw new Error('OpenRouter engine not available');
        }
        if (!apiKey) {
            try {
                return await engine.listModels('');
            }
            catch (error) {
                console.log('No API key provided for OpenRouter models, returning empty list');
                return [];
            }
        }
        return await engine.listModels(apiKey);
    }
    async getOpenRouterProviders() {
        const engine = this.engineRegistry.get('openrouter');
        if (!engine) {
            throw new Error('OpenRouter engine not available');
        }
        return await engine.listProviders();
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistryService])
], ChatService);
//# sourceMappingURL=chat.service.js.map
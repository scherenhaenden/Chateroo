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
    async sendMessage(payload) {
        const engine = this.engineRegistry.getEngine(payload.provider || 'openrouter');
        if (!engine) {
            throw new Error(`Engine for provider "${payload.provider}" not found`);
        }
        const chatPayload = {
            prompt: payload.prompt || '',
            messages: payload.messages,
            apiKey: payload.apiKey,
            model: payload.model,
            stream: false,
            attachments: payload.attachments,
        };
        return await engine.sendMessage(chatPayload);
    }
    async *sendMessageStream(payload) {
        const engine = this.engineRegistry.getEngine(payload.provider || 'openrouter');
        if (!engine) {
            throw new Error(`Engine for provider "${payload.provider}" not found`);
        }
        const chatPayload = {
            prompt: payload.prompt || '',
            messages: payload.messages,
            apiKey: payload.apiKey,
            model: payload.model,
            stream: true,
            attachments: payload.attachments,
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
        const engine = this.engineRegistry.getEngine('openrouter');
        if (!engine) {
            throw new Error('OpenRouter engine not found');
        }
        return await engine.listModels(apiKey || '');
    }
    async getOpenRouterProviders() {
        const engine = this.engineRegistry.getEngine('openrouter');
        if (!engine) {
            throw new Error('OpenRouter engine not found');
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
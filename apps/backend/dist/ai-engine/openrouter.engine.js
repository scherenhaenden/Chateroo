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
exports.OpenRouterEngine = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const ai_api_engine_base_1 = require("./ai-api-engine.base");
let OpenRouterEngine = class OpenRouterEngine extends ai_api_engine_base_1.AiApiEngine {
    httpService;
    provider = 'openrouter';
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    modelsUrl = 'https://openrouter.ai/api/v1/models';
    providersUrl = 'https://openrouter.ai/api/v1/providers';
    defaultModel = 'openai/gpt-4o-mini';
    constructor(httpService) {
        super();
        this.httpService = httpService;
    }
    async listModels(apiKey) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey && apiKey.trim() !== '') {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.modelsUrl, { headers }));
            return response.data?.data ?? [];
        }
        catch (error) {
            console.error('Fehler beim Abrufen der Modelle von OpenRouter:', error.response?.data || error.message);
            return [];
        }
    }
    async listProviders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.providersUrl, { headers }));
            return response.data?.data ?? [];
        }
        catch (error) {
            console.error('Fehler beim Abrufen der Provider von OpenRouter:', error.response?.data || error.message);
            return [];
        }
    }
    async sendMessage(payload) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
        };
        const body = {
            model: payload.model ?? this.defaultModel,
            messages: [{ role: 'user', content: payload.prompt }],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, body, { headers }));
            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Keine gültige Antwort von OpenRouter erhalten.');
            }
            return { content };
        }
        catch (error) {
            console.error('Fehler bei der Kommunikation mit OpenRouter:', error.response?.data || error.message);
            return {
                content: 'Sorry, there was an error communicating with OpenRouter.',
            };
        }
    }
};
exports.OpenRouterEngine = OpenRouterEngine;
exports.OpenRouterEngine = OpenRouterEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], OpenRouterEngine);
//# sourceMappingURL=openrouter.engine.js.map
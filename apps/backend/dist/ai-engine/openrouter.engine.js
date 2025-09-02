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
            'HTTP-Referer': 'https://chateroo.app',
            'X-Title': 'Chateroo',
        };
        const messages = payload.messages && payload.messages.length > 0
            ? payload.messages
            : [{ role: 'user', content: payload.prompt }];
        const body = {
            model: payload.model ?? this.defaultModel,
            messages: messages,
            stream: false,
            ...(payload.model?.includes('reasoning') && {
                reasoning: {
                    effort: 'high',
                },
            }),
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
            const errorData = error.response?.data;
            const errorMessage = error.message;
            console.error('Fehler bei der Kommunikation mit OpenRouter:', errorData || errorMessage);
            if (errorData?.error) {
                const { message, code } = errorData.error;
                if (code === 404 && message.includes('data policy')) {
                    return {
                        content: `Error: The selected model "${payload.model || this.defaultModel}" is not available according to your OpenRouter data policy settings. Please:\n\n1. Visit https://openrouter.ai/settings/privacy to configure your data policy\n2. Or select a different model that's available with your current settings\n3. Try using models like "openai/gpt-3.5-turbo" or "openai/gpt-4o-mini" which are commonly available`,
                    };
                }
                if (code === 401) {
                    return {
                        content: 'Error: Invalid API key. Please check your OpenRouter API key.',
                    };
                }
                if (code === 429) {
                    return {
                        content: 'Error: Rate limit exceeded. Please wait a moment and try again.',
                    };
                }
                return {
                    content: `Error: ${message} (Code: ${code})`,
                };
            }
            return {
                content: 'Sorry, there was an error communicating with OpenRouter. Please try again.',
            };
        }
    }
    async *sendMessageStream(payload) {
        const requestPayload = {
            model: payload.model || 'openai/gpt-3.5-turbo',
            messages: this.formatMessages(payload),
            stream: true,
            provider: {},
            reasoning: {
                effort: 'high'
            }
        };
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${payload.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });
        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body reader available');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed === '' || trimmed === 'data: [DONE]')
                        continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6);
                            const data = JSON.parse(jsonStr);
                            const content = data.choices[0]?.delta?.content;
                            if (content) {
                                yield { content };
                            }
                            const finishReason = data.choices[0]?.finish_reason;
                            if (finishReason) {
                                yield { content: '', done: true };
                                return;
                            }
                        }
                        catch (error) {
                            console.error('Error parsing stream chunk:', error);
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    formatMessages(payload) {
        const messages = [];
        if (payload.messages) {
            messages.push(...payload.messages);
        }
        if (payload.prompt) {
            messages.push({
                role: 'user',
                content: payload.prompt
            });
        }
        return messages;
    }
};
exports.OpenRouterEngine = OpenRouterEngine;
exports.OpenRouterEngine = OpenRouterEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], OpenRouterEngine);
//# sourceMappingURL=openrouter.engine.js.map
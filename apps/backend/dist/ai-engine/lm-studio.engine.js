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
exports.LmStudioEngine = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const ai_api_engine_base_1 = require("./ai-api-engine.base");
const rxjs_1 = require("rxjs");
let LmStudioEngine = class LmStudioEngine extends ai_api_engine_base_1.AiApiEngine {
    httpService;
    provider = 'lm-studio';
    apiUrl = 'http://localhost:1234/v1/chat/completions';
    constructor(httpService) {
        super();
        this.httpService = httpService;
    }
    async sendMessage(payload) {
        try {
            const requestBody = {
                model: 'local-model',
                messages: [{ role: 'user', content: payload.prompt }],
                temperature: 0.7,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, requestBody, {
                headers: { 'Content-Type': 'application/json' },
            }));
            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Keine gültige Antwort von LM Studio erhalten.');
            }
            return { content };
        }
        catch (error) {
            console.error('Fehler bei der Kommunikation mit LM Studio:', error.message);
            return {
                content: 'Fehler bei der Verbindung mit LM Studio. Stelle sicher, dass der Server läuft. ' +
                    `(Details: ${error.message})`,
            };
        }
    }
    async *sendMessageStream(payload) {
        try {
            const requestBody = {
                model: 'local-model',
                messages: [{ role: 'user', content: payload.prompt }],
                temperature: 0.7,
                stream: true,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, requestBody, {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'stream',
            }));
            let buffer = '';
            for await (const chunk of response.data) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim() === '')
                        continue;
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            yield { content: '', done: true };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                yield { content };
                            }
                        }
                        catch {
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Fehler bei der Streaming-Kommunikation mit LM Studio:', error.message);
            yield {
                content: `Fehler bei der Verbindung mit LM Studio. Stelle sicher, dass der Server läuft. (Details: ${error.message})`,
                done: true,
            };
        }
    }
};
exports.LmStudioEngine = LmStudioEngine;
exports.LmStudioEngine = LmStudioEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], LmStudioEngine);
//# sourceMappingURL=lm-studio.engine.js.map
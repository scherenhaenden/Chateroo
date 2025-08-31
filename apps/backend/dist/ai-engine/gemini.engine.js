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
exports.GeminiEngine = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const ai_api_engine_base_1 = require("./ai-api-engine.base");
let GeminiEngine = class GeminiEngine extends ai_api_engine_base_1.AiApiEngine {
    httpService;
    provider = 'gemini';
    apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    constructor(httpService) {
        super();
        this.httpService = httpService;
    }
    async *sendMessageStream(payload) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
        };
        let messageContent = payload.prompt;
        if (payload.attachments && payload.attachments.length > 0) {
            const attachmentInfo = payload.attachments
                .map((att) => {
                if (att.type.startsWith('image/')) {
                    return `[BILD: ${att.name} - ${this.formatFileSize(att.size)}]`;
                }
                else if (this.isTextFile(att.type)) {
                    try {
                        const content = Buffer.from(att.base64, 'base64').toString('utf-8');
                        return `[DATEI: ${att.name}]\n${content.substring(0, 1500)}${content.length > 1500 ? '\n[...gekürzt]' : ''}`;
                    }
                    catch {
                        return `[DATEI: ${att.name} - nicht lesbar]`;
                    }
                }
                return `[DATEI: ${att.name} - ${this.formatFileSize(att.size)}]`;
            })
                .join('\n\n');
            messageContent = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
        }
        const body = {
            model: 'gemini-1.5-flash',
            messages: [{ role: 'user', content: messageContent }],
            stream: true,
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, body, {
                headers,
                responseType: 'stream',
            }));
            let buffer = '';
            for await (const chunk of response.data) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
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
            console.error('Fehler bei der Streaming-Kommunikation mit Gemini:', error.response?.data || error.message);
            yield {
                content: 'Sorry, there was an error communicating with Gemini.',
                done: true,
            };
        }
    }
    async sendMessage(payload) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.apiKey}`,
        };
        let messageContent = payload.prompt;
        if (payload.attachments && payload.attachments.length > 0) {
            const attachmentInfo = payload.attachments
                .map((att) => {
                if (att.type.startsWith('image/')) {
                    return `[BILD: ${att.name} - ${this.formatFileSize(att.size)}]`;
                }
                else if (this.isTextFile(att.type)) {
                    try {
                        const content = Buffer.from(att.base64, 'base64').toString('utf-8');
                        return `[DATEI: ${att.name}]\n${content.substring(0, 1500)}${content.length > 1500 ? '\n[...gekürzt]' : ''}`;
                    }
                    catch (e) {
                        return `[DATEI: ${att.name} - nicht lesbar]`;
                    }
                }
                return `[DATEI: ${att.name} - ${this.formatFileSize(att.size)}]`;
            })
                .join('\n\n');
            messageContent = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
        }
        const body = {
            model: 'gemini-1.5-flash',
            messages: [{ role: 'user', content: messageContent }],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, body, { headers }));
            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Keine gültige Antwort von Gemini erhalten.');
            }
            return { content };
        }
        catch (error) {
            console.error('Fehler bei der Kommunikation mit Gemini:', error.response?.data || error.message);
            return {
                content: 'Sorry, there was an error communicating with Gemini.',
            };
        }
    }
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    isTextFile(mimeType) {
        const textTypes = [
            'text/plain',
            'text/markdown',
            'text/csv',
            'application/json',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'text/xml',
            'application/xml',
            'application/typescript',
        ];
        return textTypes.includes(mimeType) || mimeType.startsWith('text/');
    }
};
exports.GeminiEngine = GeminiEngine;
exports.GeminiEngine = GeminiEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], GeminiEngine);
//# sourceMappingURL=gemini.engine.js.map
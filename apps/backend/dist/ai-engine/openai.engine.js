"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiEngine = void 0;
const common_1 = require("@nestjs/common");
const ai_api_engine_base_1 = require("./ai-api-engine.base");
let OpenAiEngine = class OpenAiEngine extends ai_api_engine_base_1.AiApiEngine {
    provider = 'openai';
    formatFileSize(size) {
        if (size < 1024)
            return `${size} B`;
        if (size < 1024 * 1024)
            return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
    isTextFile(type) {
        return type.startsWith('text/');
    }
    processAttachments(attachments) {
        return attachments?.map(att => {
            if (att.type.startsWith('image/')) {
                return `Bild: ${att.name} (${this.formatFileSize(att.size)})`;
            }
            else if (this.isTextFile(att.type)) {
                try {
                    const content = Buffer.from(att.base64, 'base64').toString('utf-8');
                    return `Datei: ${att.name}\nInhalt:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`;
                }
                catch {
                    return `Datei: ${att.name} (${this.formatFileSize(att.size)}) - Konnte nicht gelesen werden`;
                }
            }
            return `Datei: ${att.name} (${this.formatFileSize(att.size)})`;
        }).join('\n') || '';
    }
    async sendMessage(payload) {
        if (!payload.apiKey) {
            return { content: 'Fehler: OpenAI API-Schlüssel fehlt.' };
        }
        try {
            let enhancedPrompt = payload.prompt;
            if (payload.attachments && payload.attachments.length > 0) {
                const attachmentInfo = this.processAttachments(payload.attachments);
                enhancedPrompt = `${payload.prompt}\n\nAngehängte Dateien:\n${attachmentInfo}`;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = `OpenAI würde auf "${payload.prompt}" antworten.`;
            return { content: response };
        }
        catch (error) {
            console.error('Error in OpenAiEngine:', error);
            throw error;
        }
    }
};
exports.OpenAiEngine = OpenAiEngine;
exports.OpenAiEngine = OpenAiEngine = __decorate([
    (0, common_1.Injectable)()
], OpenAiEngine);
//# sourceMappingURL=openai.engine.js.map
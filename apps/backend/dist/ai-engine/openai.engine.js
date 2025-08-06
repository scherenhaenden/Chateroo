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
    async sendMessage(payload) {
        if (!payload.apiKey) {
            return { content: 'Error: OpenAI API key is missing.' };
        }
        return {
            content: `(Platzhalter) OpenAI würde jetzt die Frage "${payload.prompt}" beantworten.`,
        };
    }
};
exports.OpenAiEngine = OpenAiEngine;
exports.OpenAiEngine = OpenAiEngine = __decorate([
    (0, common_1.Injectable)()
], OpenAiEngine);
//# sourceMappingURL=openai.engine.js.map
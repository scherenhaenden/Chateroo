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
exports.SendMessageDto = exports.ChatMessage = void 0;
const swagger_1 = require("@nestjs/swagger");
class ChatMessage {
    role;
    content;
    attachments;
}
exports.ChatMessage = ChatMessage;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The role of the message sender',
        enum: ['user', 'assistant', 'system'],
        example: 'user',
    }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The content of the message',
        example: 'Hello, how can you help me today?',
    }),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File attachments for the message',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'document.pdf' },
                type: { type: 'string', example: 'application/pdf' },
                base64: { type: 'string', example: 'JVBERi0xLjQK...' },
                size: { type: 'number', example: 1024 },
            },
        },
        required: false,
    }),
    __metadata("design:type", Array)
], ChatMessage.prototype, "attachments", void 0);
class SendMessageDto {
    provider;
    messages;
    prompt;
    apiKey;
    model;
    stream;
    attachments;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The AI provider to use for processing the message',
        example: 'lm-studio',
        enum: ['openai', 'gemini', 'lm-studio', 'openrouter', 'mistral', 'perplexity', 'grok', 'deepseek'],
    }),
    __metadata("design:type", String)
], SendMessageDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Complete conversation history (new format)',
        type: [ChatMessage],
        required: false,
    }),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Single prompt message (legacy format for backward compatibility)',
        example: 'What is the weather like today?',
        required: false,
    }),
    __metadata("design:type", String)
], SendMessageDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API key for the selected provider (if required)',
        example: 'sk-...',
        required: false,
    }),
    __metadata("design:type", String)
], SendMessageDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Specific model to use with the provider',
        example: 'gpt-4',
        required: false,
    }),
    __metadata("design:type", String)
], SendMessageDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Enable streaming response',
        example: true,
        default: false,
        required: false,
    }),
    __metadata("design:type", Boolean)
], SendMessageDto.prototype, "stream", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File attachments for the message',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'image.jpg' },
                type: { type: 'string', example: 'image/jpeg' },
                base64: { type: 'string', example: '/9j/4AAQSkZJRgABA...' },
                size: { type: 'number', example: 2048 },
            },
        },
        required: false,
    }),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "attachments", void 0);
//# sourceMappingURL=chat.dto.js.map
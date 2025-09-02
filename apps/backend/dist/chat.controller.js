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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dtos/chat.dto");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    setupStreamHeaders(res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
    }
    logPayload(payload) {
        console.log('Received payload in backend:', payload);
    }
    async sendMessage(payload, res, accept) {
        this.logPayload(payload);
        const isStream = payload.stream || accept?.includes('text/event-stream');
        if (isStream) {
            this.setupStreamHeaders(res);
            try {
                for await (const chunk of this.chatService.sendMessageStream(payload)) {
                    if (chunk.content) {
                        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
                    }
                    if (chunk.done) {
                        res.write('data: [DONE]\n\n');
                        break;
                    }
                }
            }
            catch (error) {
                console.error('Error in chat controller:', error);
                res.write(`data: ${JSON.stringify({ error: 'An error occurred while processing your request' })}\n\n`);
            }
            finally {
                res.end();
            }
            return;
        }
        try {
            const result = await this.chatService.sendMessage(payload);
            res.json(result);
        }
        catch (error) {
            console.error('Error in chat controller:', error);
            res.status(500).json({
                error: 'An error occurred while processing your request',
                details: error.message,
            });
        }
    }
    async getOpenRouterModels(apiKey) {
        try {
            return await this.chatService.getOpenRouterModels(apiKey);
        }
        catch (error) {
            console.error('Error fetching OpenRouter models:', error);
            throw error;
        }
    }
    async getOpenRouterProviders() {
        try {
            return await this.chatService.getOpenRouterProviders();
        }
        catch (error) {
            console.error('Error fetching OpenRouter providers:', error);
            throw error;
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Send a message to AI provider',
        description: 'Sends a message to the specified AI provider. Supports both streaming and non-streaming responses. For streaming, set stream=true in the request body or include "text/event-stream" in the Accept header.',
    }),
    (0, swagger_1.ApiBody)({
        type: chat_dto_1.SendMessageDto,
        examples: {
            'Simple message': {
                summary: 'Simple message to LM Studio',
                value: {
                    provider: 'lm-studio',
                    prompt: 'Hello, how are you?',
                },
            },
            'Conversation history': {
                summary: 'Message with conversation history',
                value: {
                    provider: 'lm-studio',
                    messages: [
                        { role: 'user', content: 'What is TypeScript?' },
                        { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript...' },
                        { role: 'user', content: 'Can you give me an example?' },
                    ],
                    stream: true,
                },
            },
            'OpenAI with API Key': {
                summary: 'Message to OpenAI with API key',
                value: {
                    provider: 'openai',
                    prompt: 'Explain quantum computing',
                    apiKey: 'sk-...',
                    model: 'gpt-4',
                },
            },
        },
    }),
    (0, swagger_1.ApiHeader)({
        name: 'accept',
        description: 'Set to "text/event-stream" for streaming responses',
        required: false,
        example: 'text/event-stream',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message sent successfully',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            example: 'Hello! I am an AI assistant. How can I help you today?',
                        },
                    },
                },
            },
            'text/event-stream': {
                schema: {
                    type: 'string',
                    example: 'data: {"content":"Hello"}\n\ndata: {"content":" there!"}\n\ndata: [DONE]\n\n',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error',
        schema: {
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    example: 'An error occurred while processing your request',
                },
                details: {
                    type: 'string',
                    example: 'Provider openai not supported',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('accept')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.SendMessageDto, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('openrouter/models'),
    (0, swagger_1.ApiTags)('providers'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get OpenRouter models',
        description: 'Retrieves the list of available models from OpenRouter. Requires an API key for full model list.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'apiKey',
        description: 'OpenRouter API key (optional - returns limited list without key)',
        required: false,
        example: 'sk-or-...',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of OpenRouter models retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'openai/gpt-4' },
                    name: { type: 'string', example: 'GPT-4' },
                    description: { type: 'string', example: 'OpenAI GPT-4 model' },
                    context_length: { type: 'number', example: 8192 },
                },
            },
        },
    }),
    __param(0, (0, common_1.Query)('apiKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOpenRouterModels", null);
__decorate([
    (0, common_1.Get)('openrouter/providers'),
    (0, swagger_1.ApiTags)('providers'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get OpenRouter providers',
        description: 'Retrieves the list of available AI providers from OpenRouter.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of OpenRouter providers retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'OpenAI' },
                    slug: { type: 'string', example: 'openai' },
                },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOpenRouterProviders", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, common_1.Controller)('api/chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map
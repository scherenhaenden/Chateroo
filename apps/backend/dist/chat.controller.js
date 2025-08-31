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
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async sendMessage(payload, res, accept) {
        console.log('Received payload:', payload);
        const isStream = payload.stream || accept?.includes('text/event-stream');
        if (isStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders?.();
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
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('accept')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('api/chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map
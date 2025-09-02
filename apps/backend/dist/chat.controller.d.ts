import type { Response } from 'express';
import { ChatService } from './chat.service';
import type { SendMessageDto } from './dtos/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    private setupStreamHeaders;
    private logPayload;
    sendMessage(payload: SendMessageDto, res: Response, accept?: string): Promise<void>;
    getOpenRouterModels(apiKey?: string): Promise<import("./ai-engine/openrouter.engine").OpenRouterModel[]>;
    getOpenRouterProviders(): Promise<any[]>;
}

import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatPayload } from './ai-engine/ai-api-engine.base';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(payload: ChatPayload): Promise<import("./ai-engine/ai-api-engine.base").ChatResponse>;
    streamMessage(payload: ChatPayload, response: Response): Promise<void>;
    getOpenRouterModels(apiKey?: string): Promise<import("./ai-engine/openrouter.engine").OpenRouterModel[]>;
    getOpenRouterProviders(): Promise<any[]>;
}

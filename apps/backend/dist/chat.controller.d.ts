import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
import { OpenRouterModel } from './ai-engine/openrouter.engine';
declare class ChatRequestDto implements ChatPayload {
    provider: string;
    prompt: string;
    apiKey?: string;
    model?: string;
}
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(requestDto: ChatRequestDto): Promise<ChatResponse>;
    listOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]>;
}
export {};

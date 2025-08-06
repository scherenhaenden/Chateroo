import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(provider: string, payload: ChatPayload): Promise<ChatResponse>;
}

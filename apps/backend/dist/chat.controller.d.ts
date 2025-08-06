import { ChatService } from './chat.service';
import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
declare class ChatRequestDto implements ChatPayload {
    provider: string;
    prompt: string;
    apiKey?: string;
}
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(requestDto: ChatRequestDto): Promise<ChatResponse>;
}
export {};

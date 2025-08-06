import { AiApiEngine, ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
export declare class ChatService {
    private readonly engines;
    constructor(engines: AiApiEngine[]);
    sendMessage(provider: string, payload: ChatPayload): Promise<ChatResponse>;
    getProviders(): string[];
}

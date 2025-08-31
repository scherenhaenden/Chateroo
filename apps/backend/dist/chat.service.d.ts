import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { ChatResponse, StreamChunk } from './ai-engine/ai-api-engine.base';
export interface ChatServicePayload {
    provider: string;
    prompt: string;
    apiKey?: string;
    model?: string;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
export declare class ChatService {
    private readonly engineRegistry;
    constructor(engineRegistry: EngineRegistryService);
    sendMessage(payload: ChatServicePayload): Promise<ChatResponse>;
    sendMessageStream(payload: ChatServicePayload): AsyncIterableIterator<StreamChunk>;
}

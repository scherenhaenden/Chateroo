import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { ChatResponse, StreamChunk } from './ai-engine/ai-api-engine.base';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
export interface ChatServicePayload {
    provider: string;
    messages?: ChatMessage[];
    prompt?: string;
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
    private extractPromptFromPayload;
    private convertMessagesToConversationalPrompt;
}

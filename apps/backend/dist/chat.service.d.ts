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
export interface SendMessageDto {
    provider: string;
    messages?: ChatMessage[];
    prompt?: string;
    apiKey?: string;
    model?: string;
    stream?: boolean;
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
    sendMessage(payload: SendMessageDto): Promise<ChatResponse>;
    sendMessageStream(payload: SendMessageDto): AsyncIterableIterator<StreamChunk>;
    getOpenRouterModels(apiKey?: string): Promise<import("./ai-engine/openrouter.engine").OpenRouterModel[]>;
    getOpenRouterProviders(): Promise<import("./ai-engine/openrouter.engine").OpenRouterProvider[]>;
}

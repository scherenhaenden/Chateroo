import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { ChatResponse, StreamChunk } from './ai-engine/ai-api-engine.base';
import { OpenRouterModel } from './ai-engine/openrouter.engine';
import type { SendMessageDto } from './dtos/chat.dto';
export declare class ChatService {
    private readonly engineRegistry;
    constructor(engineRegistry: EngineRegistryService);
    private extractPromptFromPayload;
    sendMessage(payload: SendMessageDto): Promise<ChatResponse>;
    sendMessageStream(payload: SendMessageDto): AsyncIterableIterator<StreamChunk>;
    getOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]>;
    getOpenRouterProviders(): Promise<any[]>;
}

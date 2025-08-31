import { ChatPayload, ChatResponse } from './ai-engine/ai-api-engine.base';
import { EngineRegistryService } from './ai-engine/engine-registry.service';
import { OpenRouterModel } from './ai-engine/openrouter.engine';
export declare class ChatService {
    private readonly registry;
    constructor(registry: EngineRegistryService);
    handleMessage(provider: string, payload: ChatPayload): Promise<ChatResponse>;
    getProviders(): string[];
    listOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]>;
}

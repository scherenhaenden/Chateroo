import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number;
    architecture: {
        modality: string;
    };
    top_provider: {
        id: string;
        is_moderated: boolean;
    };
}
export declare class OpenRouterEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "openrouter";
    private readonly apiUrl;
    private readonly modelsUrl;
    private readonly defaultModel;
    constructor(httpService: HttpService);
    listModels(apiKey: string): Promise<OpenRouterModel[]>;
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

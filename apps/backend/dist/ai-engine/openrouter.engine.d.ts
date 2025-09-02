import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export interface OpenRouterProvider {
    name: string;
    slug: string;
    privacy_policy_url?: string;
    terms_of_service_url?: string;
    status_page_url?: string;
}
export interface OpenRouterModel {
    id: string;
    canonical_slug: string;
    hugging_face_id?: string;
    name: string;
    created: number;
    description: string;
    context_length: number;
    architecture: Architecture;
    pricing: Pricing;
    top_provider: TopProvider;
    per_request_limits: any;
    supported_parameters: string[];
}
export interface Architecture {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type?: string;
}
export interface Pricing {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
    web_search?: string;
    internal_reasoning?: string;
    input_cache_read?: string;
    audio?: string;
    input_cache_write?: string;
}
export interface TopProvider {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated: boolean;
}
export declare class OpenRouterEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "openrouter";
    private readonly apiUrl;
    private readonly modelsUrl;
    private readonly providersUrl;
    private readonly defaultModel;
    constructor(httpService: HttpService);
    listModels(apiKey: string): Promise<OpenRouterModel[]>;
    listProviders(): Promise<OpenRouterProvider[]>;
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

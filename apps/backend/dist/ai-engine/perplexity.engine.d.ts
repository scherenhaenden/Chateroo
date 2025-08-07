import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class PerplexityEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "perplexity";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

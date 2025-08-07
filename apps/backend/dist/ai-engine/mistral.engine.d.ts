import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class MistralEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "mistral";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

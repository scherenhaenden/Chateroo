import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class DeepseekEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "deepseek";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

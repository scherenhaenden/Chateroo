import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class GeminiEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "gemini";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
    private formatFileSize;
    private isTextFile;
}

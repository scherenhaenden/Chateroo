import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse, StreamChunk } from './ai-api-engine.base';
export declare class GeminiEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "gemini";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessageStream(payload: ChatPayload): AsyncIterableIterator<StreamChunk>;
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
    private formatFileSize;
    private isTextFile;
}

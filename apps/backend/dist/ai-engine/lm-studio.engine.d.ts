import { HttpService } from '@nestjs/axios';
import { AiApiEngine, ChatPayload, ChatResponse, StreamChunk } from './ai-api-engine.base';
export declare class LmStudioEngine extends AiApiEngine {
    private readonly httpService;
    readonly provider = "lm-studio";
    private readonly apiUrl;
    constructor(httpService: HttpService);
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
    sendMessageStream(payload: ChatPayload): AsyncIterableIterator<StreamChunk>;
}

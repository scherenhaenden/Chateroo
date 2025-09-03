import { AiApiEngine, ChatPayload, ChatResponse } from './ai-api-engine.base';
export declare class OpenAiEngine extends AiApiEngine {
    readonly provider = "openai";
    private formatFileSize;
    private isTextFile;
    private processAttachments;
    sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

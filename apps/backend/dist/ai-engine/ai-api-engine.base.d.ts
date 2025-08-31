export interface ChatAttachment {
    name: string;
    type: string;
    base64: string;
    size: number;
}
export interface ChatPayload {
    prompt: string;
    apiKey?: string;
    model?: string;
    attachments?: ChatAttachment[];
    stream?: boolean;
}
export interface ChatResponse {
    content: string;
}
export interface StreamChunk {
    content: string;
    done?: boolean;
}
export declare abstract class AiApiEngine {
    abstract readonly provider: string;
    abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
    sendMessageStream?(payload: ChatPayload): AsyncIterableIterator<StreamChunk>;
}

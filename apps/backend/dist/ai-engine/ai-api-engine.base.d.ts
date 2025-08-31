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
}
export interface ChatResponse {
    content: string;
}
export declare abstract class AiApiEngine {
    abstract readonly provider: string;
    abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

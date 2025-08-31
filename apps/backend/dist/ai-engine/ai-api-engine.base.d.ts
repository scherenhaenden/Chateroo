export interface ChatPayload {
    prompt: string;
    apiKey?: string;
    model?: string;
}
export interface ChatResponse {
    content: string;
}
export declare abstract class AiApiEngine {
    abstract readonly provider: string;
    abstract sendMessage(payload: ChatPayload): Promise<ChatResponse>;
}

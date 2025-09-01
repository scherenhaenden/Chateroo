export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
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
    messages?: ChatMessage[];
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

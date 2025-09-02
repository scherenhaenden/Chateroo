export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
export interface SendMessageDto {
    provider: string;
    messages?: ChatMessage[];
    prompt?: string;
    apiKey?: string;
    model?: string;
    stream?: boolean;
    attachments?: {
        name: string;
        type: string;
        base64: string;
        size: number;
    }[];
}
